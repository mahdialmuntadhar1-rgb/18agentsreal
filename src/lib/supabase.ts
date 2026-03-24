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

export const getVerifiedBusinesses = async (governorate?: string) => {
  let query = supabase
    .from('businesses')
    .select('id, name, phone, city, category, address, contact, location, created_at')
    .eq('verification_status', 'verified')
    .eq('city_center_only', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (governorate) {
    query = query.ilike('city', `%${governorate}%`);
  }

  const { data, error } = await query;
  return { data, error };
};
