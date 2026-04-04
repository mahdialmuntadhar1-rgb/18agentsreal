import { calculateCompletenessScore, validateBusinessRecord } from '../../src/services/validation.ts';
import { classifyRecordMatch } from '../../src/services/matcher.ts';
import { normalizeBusinessRecord } from '../../src/services/normalize.ts';
import { supabaseAdmin } from './supabase-admin.ts';
import type { AgentState, JobEvent, JobResult, QueueJob } from './contracts.ts';
import { resolveGovernor } from './governor-registry.ts';

const HEARTBEAT_INTERVAL_MS = Number(process.env.WORKER_HEARTBEAT_MS ?? '10000');
const POLL_MS = Number(process.env.WORKER_POLL_MS ?? '3000');
const STALE_JOB_MS = Number(process.env.WORKER_STALE_MS ?? '120000');

export class QueueJobRunner {
  private recordsCollected = 0;
  private errorsCount = 0;

  constructor(private readonly agentId: string, private readonly agentName: string, private readonly agentScope: string) {}

  async runLoop(): Promise<void> {
    await this.upsertAgentState({ status: 'idle', current_job_id: null, current_city: null, current_category: null });
    for (;;) {
      await this.recoverStaleJobs();
      const job = await this.claimNextJob();
      if (!job) {
        await this.heartbeat(null, null, 'idle');
        await this.sleep(POLL_MS);
        continue;
      }

      await this.executeJob(job);
    }
  }

  private async recoverStaleJobs(): Promise<void> {
    const staleAt = new Date(Date.now() - STALE_JOB_MS).toISOString();
    const { data, error } = await supabaseAdmin.rpc('recover_stale_jobs', {
      p_governorate_scope: this.agentScope,
      p_stale_before: staleAt,
    });

    if (error || !data) return;

    for (const job of data as Array<{ id: string; attempt_count: number; max_attempts: number }>) {
      const willRetry = (job.attempt_count ?? 0) < (job.max_attempts ?? 1);
      await this.logEvent({
        job_id: job.id,
        event_type: willRetry ? 'retried' : 'failed',
        message: willRetry ? 'Recovered stale running job into retrying' : 'Stale running job failed at max attempts',
        metadata: { recovery: true, attempt_count: job.attempt_count, max_attempts: job.max_attempts },
      });
    }
  }

  private async claimNextJob(): Promise<QueueJob | null> {
    const { data, error } = await supabaseAdmin.rpc('claim_next_job', {
      p_agent_id: this.agentId,
      p_governorate_scope: this.agentScope,
    });

    if (error || !data || data.length === 0) return null;

    const claimed = data[0] as QueueJob;
    await this.logEvent({ job_id: claimed.id, event_type: 'claimed', message: `Claimed by ${this.agentId}` });
    return claimed;
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
          isverified: record.isVerified,
          completeness_score: calculateCompletenessScore(record),
          validation_issues: validation.issues,
          match_decision: match,
          collected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

      await supabaseAdmin.from('job_results').upsert({ ...result, updated_at: new Date().toISOString() }, { onConflict: 'job_id' });
      await supabaseAdmin
        .from('jobs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          last_heartbeat_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('assigned_agent_id', this.agentId);
      await this.logEvent({ job_id: job.id, event_type: 'completed' });
      this.recordsCollected += upserts.length;
      await this.upsertAgentState({
        status: 'idle',
        current_job_id: null,
        current_city: null,
        current_category: null,
      });
    } catch (error) {
      const failure = this.formatFailure(error, job);
      const retriesLeft = (job.attempt_count ?? 0) < (job.max_attempts ?? 1);
      await supabaseAdmin
        .from('jobs')
        .update({
          status: retriesLeft ? 'retrying' : 'failed',
          failure_reason: failure.summary,
          failure_details: failure.details,
          assigned_agent_id: null,
          last_heartbeat_at: new Date().toISOString(),
          finished_at: retriesLeft ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('assigned_agent_id', this.agentId);

      await this.logEvent({
        job_id: job.id,
        event_type: retriesLeft ? 'retried' : 'failed',
        message: failure.summary,
        metadata: failure.details,
      });

      this.errorsCount += 1;
      await this.upsertAgentState({
        status: retriesLeft ? 'idle' : 'error',
        current_job_id: null,
        current_city: null,
        current_category: null,
      });
    } finally {
      clearInterval(heartbeatTimer);
    }
  }

  private formatFailure(error: unknown, job: QueueJob): { summary: string; details: Record<string, unknown> } {
    const rawMessage = error instanceof Error ? error.message : String(error);
    return {
      summary: `${job.category}/${job.city}: ${rawMessage}`,
      details: {
        error: rawMessage,
        category: job.category,
        city: job.city,
        governorate: job.governorate,
        attempt_count: job.attempt_count,
        max_attempts: job.max_attempts,
        at: new Date().toISOString(),
      },
    };
  }

  private async heartbeat(currentJobId: string | null, currentCategory: string | null, status: AgentState['status']): Promise<void> {
    const now = new Date().toISOString();
    if (currentJobId) {
      await supabaseAdmin
        .from('jobs')
        .update({ last_heartbeat_at: now, updated_at: now })
        .eq('id', currentJobId)
        .eq('assigned_agent_id', this.agentId)
        .eq('status', 'running');
    }

    await this.upsertAgentState({ status, current_job_id: currentJobId, current_category: currentCategory, heartbeatOnly: true });
  }

  private async upsertAgentState(
    input: Partial<AgentState> & { heartbeatOnly?: boolean },
  ): Promise<void> {
    const now = new Date().toISOString();
    const payload = {
      agent_id: this.agentId,
      agent_name: this.agentName,
      governorate_scope: this.agentScope,
      status: input.status ?? 'idle',
      current_job_id: input.current_job_id ?? null,
      current_city: input.current_city ?? null,
      current_category: input.current_category ?? null,
      last_heartbeat_at: now,
      records_collected: this.recordsCollected,
      errors_count: this.errorsCount,
      updated_at: now,
    };

    if (input.heartbeatOnly) {
      await supabaseAdmin
        .from('agent_states')
        .update({ status: payload.status, current_job_id: payload.current_job_id, current_category: payload.current_category, last_heartbeat_at: now, updated_at: now })
        .eq('agent_id', this.agentId);
      return;
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
