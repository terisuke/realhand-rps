import type { MoveType } from "@/domain/game/move";
import type { AiPersonalityType } from "@/domain/ai/ai-personality";
import type { PredictorInput } from "@/domain/ai/predictor";
import { supabase, isSupabaseConfigured } from "@/infrastructure/supabase/client";

export interface PreCommitData {
  readonly aiMove: MoveType;
  readonly salt: string;
  readonly commitHash: string;
  readonly personality: AiPersonalityType;
  readonly history: PredictorInput[];
  readonly currentRound: number;
}

/** Supplementary in-memory data not stored in DB (personality, history) */
interface SupplementaryData {
  readonly personality: AiPersonalityType;
  readonly history: PredictorInput[];
}

const memoryStore = new Map<string, PreCommitData>();
const supplementaryStore = new Map<string, SupplementaryData>();

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
    const { error } = await supabase.from("round_commits").upsert(
      {
        session_id: sessionId,
        round_number: roundNumber,
        ai_move: data.aiMove,
        salt: data.salt,
        commit_hash: data.commitHash,
        revealed: false,
      },
      { onConflict: "session_id,round_number" }
    );

    if (error) {
      throw new Error(`Failed to save pre-commit: ${error.message}`);
    }

    supplementaryStore.set(key, Object.freeze({
      personality: data.personality,
      history: Object.freeze([...data.history]),
    }) as SupplementaryData);

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
): Promise<PreCommitData | undefined> {
  const key = toKey(sessionId, roundNumber);

  if (isSupabaseConfigured && supabase) {
    const { data: row, error } = await supabase
      .from("round_commits")
      .select("ai_move, salt, commit_hash")
      .eq("session_id", sessionId)
      .eq("round_number", roundNumber)
      .eq("revealed", false)
      .single();

    if (error || !row) return undefined;

    const supplementary = supplementaryStore.get(key);
    if (!supplementary) return undefined;

    return {
      aiMove: row.ai_move as MoveType,
      salt: row.salt as string,
      commitHash: row.commit_hash as string,
      personality: supplementary.personality,
      history: [...supplementary.history],
      currentRound: roundNumber,
    };
  }

  // Fallback: in-memory store
  const entry = memoryStore.get(key);
  if (!entry) return undefined;
  return { ...entry, history: [...entry.history] };
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

    supplementaryStore.delete(key);
    return;
  }

  // Fallback: in-memory store
  memoryStore.delete(key);
}

export function clearAllPreCommits(): void {
  memoryStore.clear();
  supplementaryStore.clear();
}
