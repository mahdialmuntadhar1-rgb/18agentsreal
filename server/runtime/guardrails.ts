import { supabaseAdmin } from './supabase-admin.ts';

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[runtime] Missing required env var: ${name}`);
  }
  return value;
};

const assertTableExists = async (table: string): Promise<void> => {
  const { error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    throw new Error(`[runtime] Missing table or access issue for '${table}'. Run migrations/20260404_runtime_hardening.sql. Root error: ${error.message}`);
  }
};

const assertRpcExists = async (fn: 'claim_next_job' | 'recover_stale_jobs'): Promise<void> => {
  const params =
    fn === 'claim_next_job'
      ? { p_agent_id: '__runtime_guard__', p_governorate_scope: '__runtime_guard__' }
      : { p_governorate_scope: '__runtime_guard__', p_stale_before: new Date().toISOString() };

  const { error } = await supabaseAdmin.rpc(fn, params);
  if (error && error.code === 'PGRST202') {
    throw new Error(`[runtime] Missing RPC function '${fn}'. Run migrations/20260404_runtime_hardening.sql.`);
  }
};

export const assertRuntimeStartup = async (mode: 'api' | 'worker' | 'all'): Promise<void> => {
  requireEnv('SUPABASE_URL');
  requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (mode === 'worker' || mode === 'all') {
    requireEnv('GEMINI_API_KEY');
    requireEnv('AGENT_SCOPE');
  }

  await Promise.all([
    assertTableExists('jobs'),
    assertTableExists('job_events'),
    assertTableExists('job_results'),
    assertTableExists('agent_states'),
    assertTableExists('records'),
  ]);

  await Promise.all([assertRpcExists('claim_next_job'), assertRpcExists('recover_stale_jobs')]);
};
