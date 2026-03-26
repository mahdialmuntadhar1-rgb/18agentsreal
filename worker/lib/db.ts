import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Agent, AgentTask, AgentStatus, BusinessUpsert, LogLevel, RunStatus } from './schema';

export interface RuntimeDb {
  getAgents(): Promise<Agent[]>;
  claimNextTask(agentId: string, maxAttempts: number): Promise<AgentTask | null>;
  createRun(agentId: string, correlationId: string, status: RunStatus): Promise<string>;
  finishRun(runId: string, status: RunStatus, summary: Record<string, unknown>): Promise<void>;
  setAgentStatus(agentId: string, status: AgentStatus, reason?: string): Promise<void>;
  completeTask(taskId: number): Promise<void>;
  failTask(taskId: number, status: 'retrying' | 'failed', lastError: string, runAfterIso?: string): Promise<void>;
  upsertBusinesses(items: BusinessUpsert[]): Promise<void>;
  log(level: LogLevel, message: string, correlationId: string, context: { runId?: string; agentId: string; taskId?: number; details?: unknown }): Promise<void>;
}

export function createRuntimeDb(url: string, serviceRoleKey: string): RuntimeDb {
  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return new SupabaseRuntimeDb(client);
}

class SupabaseRuntimeDb implements RuntimeDb {
  constructor(private readonly client: SupabaseClient) {}

  async getAgents(): Promise<Agent[]> {
    const { data, error } = await this.client.from('agents').select('*');
    if (error) throw error;
    return (data ?? []) as Agent[];
  }

  async claimNextTask(agentId: string, maxAttempts: number): Promise<AgentTask | null> {
    const { data, error } = await this.client.rpc('claim_next_task', { p_agent_id: agentId, p_max_attempts: maxAttempts });
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data[0] as AgentTask;
  }

  async createRun(agentId: string, correlationId: string, status: RunStatus): Promise<string> {
    const { data, error } = await this.client
      .from('agent_runs')
      .insert({ agent_id: agentId, correlation_id: correlationId, status, started_at: new Date().toISOString() })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async finishRun(runId: string, status: RunStatus, summary: Record<string, unknown>): Promise<void> {
    const { error } = await this.client.from('agent_runs').update({ status, summary, finished_at: new Date().toISOString() }).eq('id', runId);
    if (error) throw error;
  }

  async setAgentStatus(agentId: string, status: AgentStatus, reason?: string): Promise<void> {
    const { error } = await this.client
      .from('agents')
      .update({ status, status_reason: reason ?? null, last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', agentId);
    if (error) throw error;
  }

  async completeTask(taskId: number): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.client
      .from('agent_tasks')
      .update({ status: 'completed', completed_at: now, failed_at: null, last_error: null, run_after: now, updated_at: now })
      .eq('id', taskId);
    if (error) throw error;
  }

  async failTask(taskId: number, status: 'retrying' | 'failed', lastError: string, runAfterIso?: string): Promise<void> {
    const now = new Date().toISOString();
    const updates: Record<string, string | null> = {
      status,
      last_error: lastError,
      updated_at: now,
      completed_at: null,
      failed_at: status === 'failed' ? now : null,
      run_after: status === 'retrying' ? runAfterIso ?? now : now,
    };

    const { error } = await this.client.from('agent_tasks').update(updates).eq('id', taskId);
    if (error) throw error;
  }

  async upsertBusinesses(items: BusinessUpsert[]): Promise<void> {
    if (!items.length) return;

    const { error } = await this.client.from('businesses').upsert(items, { onConflict: 'source_hash' });
    if (error) throw error;
  }

  async log(level: LogLevel, message: string, correlationId: string, context: { runId?: string; agentId: string; taskId?: number; details?: unknown }): Promise<void> {
    const { error } = await this.client.from('agent_logs').insert({
      run_id: context.runId,
      agent_id: context.agentId,
      task_id: context.taskId,
      level,
      message,
      details: context.details ?? null,
      correlation_id: correlationId,
    });

    if (error) throw error;
  }
}
