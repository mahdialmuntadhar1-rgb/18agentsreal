import { createClient } from '@supabase/supabase-js';

// Fallbacks keep production working when host build env injection is misconfigured.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://hsadukhmcclwixuntqwu.supabase.co';
const SUPABASE_ANON =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  '';

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
