import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  "https://hsadukhmcclwixuntqwu.supabase.co";

// Use service-role key for server-side writes; falls back to anon key for read-only
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
