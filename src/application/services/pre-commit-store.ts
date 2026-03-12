import type { MoveType } from "@/domain/game/move";
import type { AiPersonalityType } from "@/domain/ai/ai-personality";
import type { PredictorInput } from "@/domain/ai/predictor";

export interface PreCommitData {
  readonly aiMove: MoveType;
  readonly salt: string;
  readonly commitHash: string;
  readonly personality: AiPersonalityType;
  readonly history: PredictorInput[];
  readonly currentRound: number;
}

const store = new Map<string, PreCommitData>();

function toKey(sessionId: string, roundNumber: number): string {
  return `${sessionId}:${roundNumber}`;
}

export function savePreCommit(
  sessionId: string,
  roundNumber: number,
  data: PreCommitData
): void {
  // Defensive copy: freeze to prevent external mutation
  store.set(toKey(sessionId, roundNumber), Object.freeze({
    ...data,
    history: Object.freeze([...data.history]),
  }) as PreCommitData);
}

export function getPreCommit(
  sessionId: string,
  roundNumber: number
): PreCommitData | undefined {
  const entry = store.get(toKey(sessionId, roundNumber));
  if (!entry) return undefined;
  // Return defensive copy
  return { ...entry, history: [...entry.history] };
}

export function deletePreCommit(
  sessionId: string,
  roundNumber: number
): void {
  store.delete(toKey(sessionId, roundNumber));
}

export function clearAllPreCommits(): void {
  store.clear();
}
