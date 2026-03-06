import { Move, type MoveType } from "@/domain/game/move";
import { judge } from "@/domain/game/round-result";
import { verifyCommitHash } from "@/infrastructure/crypto/commit-hash";
import { generateThought } from "@/domain/ai/thought-generator";
import { getPersonality, type AiPersonalityType } from "@/domain/ai/ai-personality";
import { detectMilestones, type Milestone } from "@/domain/game/milestone";
import type { PredictorInput } from "@/domain/ai/predictor";

export interface SubmitMoveInput {
  playerMove: MoveType;
  aiMove: MoveType;
  salt: string;
  commitHash: string;
  personality: AiPersonalityType;
  history: PredictorInput[];
  currentRound: number;
}

export interface SubmitMoveResult {
  aiMove: MoveType;
  result: "win" | "lose" | "draw";
  thought: string;
  milestones: Milestone[];
  commitProof: {
    hash: string;
    salt: string;
    verified: boolean;
  };
}

export async function submitMove(input: SubmitMoveInput): Promise<SubmitMoveResult> {
  const { playerMove, aiMove, salt, commitHash, personality, history, currentRound } = input;

  const verified = await verifyCommitHash(aiMove, salt, commitHash);

  if (!verified) {
    throw new Error("Commit hash verification failed: AI move may have been tampered with");
  }

  const playerMoveObj = Move.of(playerMove);
  const aiMoveObj = Move.of(aiMove);
  const result = judge(playerMoveObj, aiMoveObj);

  const personalityObj = getPersonality(personality);
  const thought = generateThought(personalityObj, history, "");

  const roundsWithCurrent = [
    ...history.map((h, i) => ({ result: h.result, roundNumber: i + 1 })),
    { result, roundNumber: currentRound },
  ];
  const milestones = detectMilestones(roundsWithCurrent);

  return {
    aiMove,
    result,
    thought,
    milestones,
    commitProof: {
      hash: commitHash,
      salt,
      verified,
    },
  };
}
