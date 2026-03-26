import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AgentLogRow = {
  id: number;
  agent_id: string;
  task_id: number | null;
  run_id: string | null;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  correlation_id: string;
  details: unknown;
  created_at: string;
};
