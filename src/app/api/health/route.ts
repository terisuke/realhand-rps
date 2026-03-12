import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = !!(url && key);

  let supabaseStatus = false;
  if (isSupabaseConfigured) {
    try {
      const client = createClient(url, key);
      const { error } = await client
        .from("matches")
        .select("id", { count: "exact", head: true });
      supabaseStatus = !error;
    } catch {
      supabaseStatus = false;
    }
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: supabaseStatus,
  });
}
