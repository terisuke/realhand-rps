import { computePhase } from "@/domain/game/game-phase";
import { metaStrategyDecide } from "@/domain/ai/meta-strategy";
import { getReadableBias } from "@/domain/ai/readable-pattern";
import { createCommitHash, generateSalt } from "@/infrastructure/crypto/commit-hash";
import type { MoveType } from "@/domain/game/move";
import type { PredictorInput } from "@/domain/ai/predictor";
import type { AiPersonalityType } from "@/domain/ai/ai-personality";
import type { RoundAccuracy } from "@/domain/game/game-phase";

export interface StartRoundInput {
  sessionId: string;
  rounds: PredictorInput[];
  personality: AiPersonalityType;
  currentRound: number;
}

/**
 * SECURITY: aiMove and salt are for server-side storage only.
 * NEVER include these in API responses to the client.
 * Only commitHash should be sent to the client.
 */
export interface StartRoundResult {
  roundNumber: number;
  commitHash: string;
  aiMove: MoveType;
  salt: string;
}

export async function startRound(input: StartRoundInput): Promise<StartRoundResult> {
  const { rounds, currentRound } = input;

  // 1. Convert PredictorInput[] to RoundAccuracy[] for computePhase.
  //    aiPredictedCorrectly = AI won the round = player "lose"
  const roundAccuracies: RoundAccuracy[] = rounds.map((r) => ({
    aiPredictedCorrectly: r.result === "lose",
  }));

  // 2. Compute current game phase from history
  const phase = computePhase(roundAccuracies, currentRound);

  // 3. Get readable bias for current phase (pass lastAiMove if available)
  const lastAiMove = rounds.length > 0 ? rounds[rounds.length - 1].aiMove : undefined;
  const readableBias = getReadableBias(phase, lastAiMove);

  // 4. MetaStrategy decides AI move (deterministic given same history)
  const strategyResult = metaStrategyDecide(rounds, phase, readableBias);
  const aiMove = strategyResult.move;

  // 5. Generate salt + commit hash
  const salt = generateSalt();
  const commitHash = await createCommitHash(aiMove, salt);

  return {
    roundNumber: currentRound,
    commitHash,
    aiMove,
    salt,
  };
}
