import type { MoveType } from "@/domain/game/move";
import type { GamePhase } from "@/domain/game/game-phase";

export interface ReadableBias {
  rock: number;
  paper: number;
  scissors: number;
}

const ZERO_BIAS: ReadableBias = { rock: 0, paper: 0, scissors: 0 };

export function getReadableBias(
  phase: GamePhase,
  lastAiMove?: MoveType
): ReadableBias {
  if (phase === "endgame") {
    return { ...ZERO_BIAS };
  }

  if (phase === "opening") {
    return { rock: 0, paper: 0.15, scissors: 0 };
  }

  // midgame: repeat bias when lastAiMove is provided
  if (phase === "midgame" && lastAiMove !== undefined) {
    return {
      rock: lastAiMove === "rock" ? 0.1 : 0,
      paper: lastAiMove === "paper" ? 0.1 : 0,
      scissors: lastAiMove === "scissors" ? 0.1 : 0,
    };
  }

  return { ...ZERO_BIAS };
}

export function applyBias(
  baseWeights: Record<MoveType, number>,
  bias: ReadableBias
): Record<MoveType, number> {
  return {
    rock: baseWeights.rock + bias.rock,
    paper: baseWeights.paper + bias.paper,
    scissors: baseWeights.scissors + bias.scissors,
  };
}
