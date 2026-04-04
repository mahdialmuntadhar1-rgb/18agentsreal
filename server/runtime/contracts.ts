import type { NormalizedBusinessRecord } from '../../src/services/normalize.ts';

export type JobStatus = 'queued' | 'running' | 'retrying' | 'failed' | 'completed';

export interface QueueJob {
  id: string;
  governorate: string;
  city: string;
  category: string;
  status: JobStatus;
  assigned_agent_id: string | null;
  attempt_count: number;
  max_attempts: number;
  claimed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  last_heartbeat_at: string | null;
  failure_reason: string | null;
  failure_details: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobEvent {
  job_id: string;
  event_type:
    | 'claimed'
    | 'started'
    | 'fetch_started'
    | 'fetch_completed'
    | 'normalized'
    | 'persisted'
    | 'retried'
    | 'failed'
    | 'completed';
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  job_id: string;
  total_raw_records: number;
  normalized_records: number;
  valid_records: number;
  invalid_records: number;
  match_new: number;
  match_update: number;
  match_duplicate: number;
  match_review: number;
}

export interface AgentState {
  agent_id: string;
  agent_name: string;
  governorate_scope: string;
  status: 'idle' | 'running' | 'error' | 'stopped';
  current_job_id: string | null;
  current_city: string | null;
  current_category: string | null;
  last_heartbeat_at: string;
  records_collected: number;
  errors_count: number;
}

export interface PersistedRecord extends NormalizedBusinessRecord {
  jobId: string;
  validationIssues: string[];
  matchDecision: 'NEW' | 'UPDATE' | 'DUPLICATE' | 'REVIEW';
  completenessScore: number;
  provider: string;
}
