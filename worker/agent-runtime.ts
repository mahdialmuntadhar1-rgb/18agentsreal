import { getConfig } from './lib/config';
import { createRuntimeDb } from './lib/db';
import { buildBusinessSourceHash, computeBackoffSeconds } from './lib/idempotency';
import { logRuntime } from './lib/logger';
import type { Agent, AgentTask, BusinessUpsert, ProviderBusiness } from './lib/schema';
import { ConnectorNotConfiguredError, fetchGooglePlacesBusinesses } from './lib/connectors/google-places';

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
}

function createCorrelationId(agentId: string): string {
  return `${agentId}-${Date.now()}`;
}

async function fetchBusinesses(env: Env, task: AgentTask): Promise<ProviderBusiness[]> {
  return fetchGooglePlacesBusinesses(env.GOOGLE_PLACES_API_KEY, task.city, task.category);
}

async function executeAgent(env: Env, agent: Agent): Promise<void> {
  const config = getConfig(env);
  const db = createRuntimeDb(config.supabaseUrl, config.supabaseServiceRoleKey);
  const correlationId = createCorrelationId(agent.id);
  const runId = await db.createRun(agent.id, correlationId, 'running');
  let claimedTask: AgentTask | null = null;

  try {
    await db.setAgentStatus(agent.id, 'running');
    claimedTask = await db.claimNextTask(agent.id, 5);

    if (!claimedTask) {
      await logRuntime(db, 'info', 'no_pending_task', correlationId, { agentId: agent.id, runId });
      await db.finishRun(runId, 'completed', { processed: 0 });
      await db.setAgentStatus(agent.id, 'idle');
      return;
    }

    const businesses = await fetchBusinesses(env, claimedTask);
    const upserts: BusinessUpsert[] = [];

    for (const business of businesses) {
      const sourceHash = await buildBusinessSourceHash(agent.id, business);
      upserts.push({
        governorate_id: claimedTask.governorate_id,
        external_id: business.externalId,
        name: business.name,
        category: business.category,
        city: business.city,
        address: business.address,
        phone: business.phone,
        website: business.website,
        latitude: business.latitude,
        longitude: business.longitude,
        rating: business.rating,
        review_count: business.reviewCount,
        source: 'google_places',
        source_url: business.sourceUrl,
        source_hash: sourceHash,
        raw_payload: business.rawPayload,
        collected_at: new Date().toISOString(),
        created_by_agent_id: agent.id,
        updated_by_agent_id: agent.id,
        last_task_id: claimedTask.id,
      });
    }

    await db.upsertBusinesses(upserts);
    await db.completeTask(claimedTask.id);
    await logRuntime(db, 'info', 'task_completed', correlationId, {
      agentId: agent.id,
      runId,
      taskId: claimedTask.id,
      details: { upserts: upserts.length },
    });

    await db.finishRun(runId, 'completed', { taskId: claimedTask.id, upserts: upserts.length });
    await db.setAgentStatus(agent.id, 'idle');
  } catch (error) {
    if (error instanceof ConnectorNotConfiguredError) {
      await db.setAgentStatus(agent.id, 'not_configured', error.message);
      await db.finishRun(runId, 'not_configured', { reason: error.message, taskId: claimedTask?.id ?? null });
      await logRuntime(db, 'warn', 'connector_not_configured', correlationId, {
        agentId: agent.id,
        runId,
        taskId: claimedTask?.id,
        details: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'unknown_error';
    if (claimedTask) {
      const backoff = computeBackoffSeconds(
        claimedTask.attempt_count,
        config.backoffBaseSeconds,
        config.backoffMaxSeconds,
      );
      const nextRun = new Date(Date.now() + backoff * 1000).toISOString();
      const shouldRetry = claimedTask.attempt_count < claimedTask.max_attempts;
      await db.failTask(claimedTask.id, shouldRetry ? 'retrying' : 'failed', message, shouldRetry ? nextRun : undefined);
    }

    await db.setAgentStatus(agent.id, 'error', message);
    await db.finishRun(runId, 'failed', { error: message, taskId: claimedTask?.id ?? null });
    await logRuntime(db, 'error', 'run_failed', correlationId, {
      agentId: agent.id,
      runId,
      taskId: claimedTask?.id,
      details: message,
    });
  }
}

export class AgentStateDO {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method === 'POST') {
      const body = (await request.json()) as { checkpoint?: Record<string, unknown> };
      await this.state.storage.put('checkpoint', body.checkpoint ?? {});
      return Response.json({ ok: true });
    }

    const checkpoint = (await this.state.storage.get<Record<string, unknown>>('checkpoint')) ?? {};
    return Response.json({ checkpoint });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', version: 'v4', time: new Date().toISOString() });
    }

    if (url.pathname === '/api/admin/orchestrate' && request.method === 'POST') {
      const token = request.headers.get('x-admin-secret') ?? '';
      if (token !== env.ADMIN_SHARED_SECRET) {
        return unauthorized();
      }

      await env.AGENT_TASK_QUEUE.send({ type: 'orchestrate' });
      return Response.json({ status: 'queued' });
    }

    return new Response('not_found', { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await env.AGENT_TASK_QUEUE.send({ type: 'orchestrate' });
  },

  async queue(batch: MessageBatch<{ type: string; agentId?: string }>, env: Env): Promise<void> {
    const config = getConfig(env);
    const db = createRuntimeDb(config.supabaseUrl, config.supabaseServiceRoleKey);
    const agents = await db.getAgents();

    for (const message of batch.messages) {
      try {
        if (message.body.type !== 'orchestrate') {
          message.ack();
          continue;
        }

        const targets = message.body.agentId ? agents.filter((agent) => agent.id === message.body.agentId) : agents;
        for (const agent of targets) {
          await executeAgent(env, agent);
          const id = env.AGENT_STATE_DO.idFromName(agent.id);
          const stub = env.AGENT_STATE_DO.get(id);
          await stub.fetch('https://do.local/checkpoint', {
            method: 'POST',
            body: JSON.stringify({ checkpoint: { lastRunAt: new Date().toISOString() } }),
          });
        }

        message.ack();
      } catch (error) {
        console.error(error);
        message.retry();
      }
    }
  },
};
