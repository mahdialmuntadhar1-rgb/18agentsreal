import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://mxxaxhrtccomkazpvthn.supabase.co";
const supabaseAnonKey = "sb_publishable_KLDOoNqnoT80_io47mNmKA_3Wc6SNcM";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);