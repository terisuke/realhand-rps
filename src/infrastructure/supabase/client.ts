import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_ vars are inlined at build time; non-prefixed vars are available at runtime.
// Server-side API routes need the runtime fallback in case env vars were added after the build.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function buildClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = buildClient();
export const isSupabaseConfigured = supabase !== null;
