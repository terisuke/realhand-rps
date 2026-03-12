import { supabase } from "./client";
import type { MoveType } from "@/domain/game/move";
import type { ResultType } from "@/domain/game/round-result";

export interface MatchRow {
  readonly id: string;
  readonly session_id: string;
  readonly round_number: number;
  readonly player_move: MoveType;
  readonly ai_move: MoveType;
  readonly result: ResultType;
  readonly thought: string;
  readonly phase: string;
  readonly created_at: string;
}

export interface SaveMatchParams {
  readonly sessionId: string;
  readonly roundNumber: number;
  readonly playerMove: MoveType;
  readonly aiMove: MoveType;
  readonly result: ResultType;
  readonly thought: string;
  readonly phase: string;
}

export async function saveMatch(params: SaveMatchParams): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("matches").insert({
    session_id: params.sessionId,
    round_number: params.roundNumber,
    player_move: params.playerMove,
    ai_move: params.aiMove,
    result: params.result,
    thought: params.thought,
    phase: params.phase,
  });

  if (error) {
    console.error("[match-repository] Failed to save match:", error.message);
  }
}

export async function getMatchesBySession(
  sessionId: string
): Promise<MatchRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("session_id", sessionId)
    .order("round_number", { ascending: true });

  if (error) {
    console.error("[match-repository] Failed to fetch matches:", error.message);
    return [];
  }

  return data ?? [];
}
