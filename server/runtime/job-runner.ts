import { calculateCompletenessScore, validateBusinessRecord } from '../../src/services/validation.ts';
import { classifyRecordMatch } from '../../src/services/matcher.ts';
import { normalizeBusinessRecord } from '../../src/services/normalize.ts';
import { supabaseAdmin } from './supabase-admin.ts';
import type { AgentState, JobEvent, JobResult, QueueJob } from './contracts.ts';
import { resolveGovernor } from './governor-registry.ts';

const HEARTBEAT_INTERVAL_MS = 10_000;
const STALE_JOB_MS = 120_000;

export class QueueJobRunner {
  constructor(private readonly agentId: string, private readonly agentName: string, private readonly agentScope: string) {}

  async runLoop(): Promise<void> {
    await this.upsertAgentState({ status: 'idle', current_job_id: null, current_city: null, current_category: null });
    for (;;) {
      await this.recoverStaleJobs();
      const job = await this.claimNextJob();
      if (!job) {
        await this.heartbeat(null, null, 'idle');
        await this.sleep(3000);
        continue;
      }

      await this.executeJob(job);
    }
  }

  private async recoverStaleJobs(): Promise<void> {
    const staleAt = new Date(Date.now() - STALE_JOB_MS).toISOString();
    const { data } = await supabaseAdmin
      .from('jobs')
      .select('id,attempt_count,max_attempts')
      .eq('status', 'running')
      .lt('last_heartbeat_at', staleAt)
      .eq('assigned_agent_id', this.agentId);

    for (const job of data ?? []) {
      const willRetry = (job.attempt_count ?? 0) < (job.max_attempts ?? 1);
      await supabaseAdmin
        .from('jobs')
        .update({
          status: willRetry ? 'retrying' : 'failed',
          failure_reason: willRetry ? 'stale_job_recovered' : 'stale_job_max_attempts',
          assigned_agent_id: null,
        })
        .eq('id', job.id)
        .eq('status', 'running');

      await this.logEvent({
        job_id: job.id,
        event_type: willRetry ? 'retried' : 'failed',
        message: willRetry ? 'Recovered stale running job into retrying' : 'Stale running job failed at max attempts',
      });
    }
  }

  private async claimNextJob(): Promise<QueueJob | null> {
    const { data: candidates } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .in('status', ['queued', 'retrying'])
      .eq('governorate', this.agentScope)
      .order('created_at', { ascending: true })
      .limit(5);

    for (const candidate of candidates ?? []) {
      const now = new Date().toISOString();
      const { data: claimed } = await supabaseAdmin
        .from('jobs')
        .update({
          status: 'running',
          assigned_agent_id: this.agentId,
          claimed_at: now,
          started_at: candidate.started_at ?? now,
          last_heartbeat_at: now,
          attempt_count: (candidate.attempt_count ?? 0) + 1,
          failure_reason: null,
        })
        .eq('id', candidate.id)
        .in('status', ['queued', 'retrying'])
        .select('*')
        .maybeSingle();

      if (!claimed) continue;

      await this.logEvent({ job_id: claimed.id, event_type: 'claimed', message: `Claimed by ${this.agentId}` });
      return claimed as QueueJob;
    }

    return null;
  }

  private async executeJob(job: QueueJob): Promise<void> {
    await this.logEvent({ job_id: job.id, event_type: 'started', message: 'Execution started' });
    await this.upsertAgentState({
      status: 'running',
      current_job_id: job.id,
      current_city: job.city,
      current_category: job.category,
    });

    const heartbeatTimer = setInterval(() => {
      void this.heartbeat(job.id, job.category, 'running');
    }, HEARTBEAT_INTERVAL_MS);

    try {
      await this.logEvent({ job_id: job.id, event_type: 'fetch_started' });
      const governor = resolveGovernor(job.category, this.agentName, job.city);
      const raw = await governor.run(job.city, job.category);
      await this.logEvent({ job_id: job.id, event_type: 'fetch_completed', metadata: { count: raw.length } });

      const normalized = raw.map((record, idx) =>
        normalizeBusinessRecord(
          {
            ...record,
            governorate: job.governorate,
            city: record.city || job.city,
            source_name: record.source_name,
            lat: record.latitude,
            lng: record.longitude,
            verified: false,
          },
          `${job.id}-${idx + 1}`,
        ),
      );

      await this.logEvent({ job_id: job.id, event_type: 'normalized', metadata: { count: normalized.length } });

      let validCount = 0;
      let invalidCount = 0;
      const matchCounts = { NEW: 0, UPDATE: 0, DUPLICATE: 0, REVIEW: 0 };

      const upserts = normalized.map((record) => {
        const validation = validateBusinessRecord(record);
        validation.isValid ? (validCount += 1) : (invalidCount += 1);
        const match = classifyRecordMatch(record, undefined);
        matchCounts[match] += 1;

        return {
          source_record_id: record.id,
          job_id: job.id,
          name: record.name,
          name_ar: record.nameAr ?? null,
          category: record.category,
          governorate: record.governorate,
          city: record.city,
          provider: record.sourceName,
          phone: record.phone ?? null,
          whatsapp: record.whatsapp ?? null,
          email: record.email ?? null,
          website: record.website ?? null,
          latitude: record.latitude ?? null,
          longitude: record.longitude ?? null,
          isVerified: record.isVerified,
          completeness_score: calculateCompletenessScore(record),
          validation_issues: validation.issues,
          match_decision: match,
          collected_at: new Date().toISOString(),
        };
      });

      if (upserts.length > 0) {
        await supabaseAdmin.from('records').upsert(upserts, { onConflict: 'source_record_id,provider,governorate,city' });
      }

      await this.logEvent({ job_id: job.id, event_type: 'persisted', metadata: { count: upserts.length } });

      const result: JobResult = {
        job_id: job.id,
        total_raw_records: raw.length,
        normalized_records: normalized.length,
        valid_records: validCount,
        invalid_records: invalidCount,
        match_new: matchCounts.NEW,
        match_update: matchCounts.UPDATE,
        match_duplicate: matchCounts.DUPLICATE,
        match_review: matchCounts.REVIEW,
      };

      await supabaseAdmin.from('job_results').upsert(result, { onConflict: 'job_id' });
      await supabaseAdmin
        .from('jobs')
        .update({ status: 'completed', finished_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() })
        .eq('id', job.id)
        .eq('assigned_agent_id', this.agentId);
      await this.logEvent({ job_id: job.id, event_type: 'completed' });
      await this.upsertAgentState({
        status: 'idle',
        current_job_id: null,
        current_city: null,
        current_category: null,
        records_collected_inc: upserts.length,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const retriesLeft = job.attempt_count < job.max_attempts;
      await supabaseAdmin
        .from('jobs')
        .update({
          status: retriesLeft ? 'retrying' : 'failed',
          failure_reason: reason,
          assigned_agent_id: null,
          last_heartbeat_at: new Date().toISOString(),
          finished_at: retriesLeft ? null : new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('assigned_agent_id', this.agentId);

      await this.logEvent({
        job_id: job.id,
        event_type: retriesLeft ? 'retried' : 'failed',
        message: reason,
      });

      await this.upsertAgentState({
        status: retriesLeft ? 'idle' : 'error',
        current_job_id: null,
        current_city: null,
        current_category: null,
        errors_count_inc: 1,
      });
    } finally {
      clearInterval(heartbeatTimer);
    }
  }

  private async heartbeat(currentJobId: string | null, currentCategory: string | null, status: AgentState['status']): Promise<void> {
    const now = new Date().toISOString();
    if (currentJobId) {
      await supabaseAdmin
        .from('jobs')
        .update({ last_heartbeat_at: now })
        .eq('id', currentJobId)
        .eq('assigned_agent_id', this.agentId)
        .eq('status', 'running');
    }

    await this.upsertAgentState({ status, current_job_id: currentJobId, current_category: currentCategory, heartbeatOnly: true });
  }

  private async upsertAgentState(
    input: Partial<AgentState> & { records_collected_inc?: number; errors_count_inc?: number; heartbeatOnly?: boolean },
  ): Promise<void> {
    const now = new Date().toISOString();
    const { data: existing } = await supabaseAdmin
      .from('agent_states')
      .select('*')
      .eq('agent_id', this.agentId)
      .maybeSingle();

    const payload: AgentState = {
      agent_id: this.agentId,
      agent_name: this.agentName,
      governorate_scope: this.agentScope,
      status: input.status ?? existing?.status ?? 'idle',
      current_job_id: input.current_job_id ?? existing?.current_job_id ?? null,
      current_city: input.current_city ?? existing?.current_city ?? null,
      current_category: input.current_category ?? existing?.current_category ?? null,
      last_heartbeat_at: now,
      records_collected: (existing?.records_collected ?? 0) + (input.records_collected_inc ?? 0),
      errors_count: (existing?.errors_count ?? 0) + (input.errors_count_inc ?? 0),
    };

    if (input.heartbeatOnly && existing) {
      payload.records_collected = existing.records_collected;
      payload.errors_count = existing.errors_count;
      payload.current_city = existing.current_city;
    }

    await supabaseAdmin.from('agent_states').upsert(payload, { onConflict: 'agent_id' });
  }

  private async logEvent(event: JobEvent): Promise<void> {
    await supabaseAdmin.from('job_events').insert({
      ...event,
      created_at: new Date().toISOString(),
      agent_id: this.agentId,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
