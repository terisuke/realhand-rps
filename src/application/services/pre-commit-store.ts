import type { MoveType } from "@/domain/game/move";
import type { AiPersonalityType } from "@/domain/ai/ai-personality";
import type { PredictorInput } from "@/domain/ai/predictor";
import { supabase, isSupabaseConfigured } from "@/infrastructure/supabase/client";

/** Full data passed when saving a pre-commit (includes personality/history for in-memory fallback). */
export interface PreCommitData {
  readonly aiMove: MoveType;
  readonly salt: string;
  readonly commitHash: string;
  readonly personality: AiPersonalityType;
  readonly history: PredictorInput[];
  readonly currentRound: number;
}

/** What getPreCommit returns — no personality/history (client sends those). */
export interface PreCommitRecord {
  readonly aiMove: MoveType;
  readonly salt: string;
  readonly commitHash: string;
}

const memoryStore = new Map<string, PreCommitData>();

function toKey(sessionId: string, roundNumber: number): string {
  return `${sessionId}:${roundNumber}`;
}

export async function savePreCommit(
  sessionId: string,
  roundNumber: number,
  data: PreCommitData
): Promise<void> {
  const key = toKey(sessionId, roundNumber);

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("round_commits").insert({
      session_id: sessionId,
      round_number: roundNumber,
      ai_move: data.aiMove,
      salt: data.salt,
      commit_hash: data.commitHash,
      revealed: false,
    });

    // 23505 = unique_violation (round already started, safe to ignore)
    if (error && error.code !== "23505") {
      throw new Error(`Failed to save pre-commit: ${error.message}`);
    }

    return;
  }

  // Fallback: in-memory store
  memoryStore.set(key, Object.freeze({
    ...data,
    history: Object.freeze([...data.history]),
  }) as PreCommitData);
}

export async function getPreCommit(
  sessionId: string,
  roundNumber: number
): Promise<PreCommitRecord | undefined> {
  const key = toKey(sessionId, roundNumber);

  if (isSupabaseConfigured && supabase) {
    const { data: row, error } = await supabase
      .from("round_commits")
      .select("ai_move, salt, commit_hash")
      .eq("session_id", sessionId)
      .eq("round_number", roundNumber)
      .eq("revealed", false)
      .single();

    if (error) {
      console.error("[getPreCommit] Supabase query failed:", error.message, error.code);
      return undefined;
    }
    if (!row) return undefined;

    return {
      aiMove: row.ai_move as MoveType,
      salt: row.salt as string,
      commitHash: row.commit_hash as string,
    };
  }

  // Fallback: in-memory store
  const entry = memoryStore.get(key);
  if (!entry) return undefined;
  return {
    aiMove: entry.aiMove,
    salt: entry.salt,
    commitHash: entry.commitHash,
  };
}

export async function deletePreCommit(
  sessionId: string,
  roundNumber: number
): Promise<void> {
  const key = toKey(sessionId, roundNumber);

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("round_commits")
      .update({ revealed: true })
      .eq("session_id", sessionId)
      .eq("round_number", roundNumber);

    if (error) {
      console.error("Failed to mark pre-commit as revealed:", error.message);
    }

    return;
  }

  // Fallback: in-memory store
  memoryStore.delete(key);
}

export function clearAllPreCommits(): void {
  memoryStore.clear();
}
