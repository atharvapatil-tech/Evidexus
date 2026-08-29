import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
// Support both naming conventions
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase env variables missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
