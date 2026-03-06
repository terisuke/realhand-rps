import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { MatchRecord } from "@/types";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

/** マッチを保存 */
export async function saveMatch(match: Omit<MatchRecord, "id" | "created_at">) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("matches").insert(match);
  if (error) console.error("[supabase] saveMatch error:", error.message);
}

/** セッションの全マッチ履歴を取得 */
export async function getSessionHistory(sessionId: string): Promise<MatchRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .eq("session_id", sessionId)
    .order("round", { ascending: true });

  if (error) {
    console.error("[supabase] getSessionHistory error:", error.message);
    return [];
  }
  return (data ?? []) as MatchRecord[];
}
