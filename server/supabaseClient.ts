import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "https://mxxaxhrtccomkazpvthn.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(url, key);
