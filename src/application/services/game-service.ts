import { startRound } from "@/application/use-cases/start-round";
import { submitMove, type SubmitMoveResult } from "@/application/use-cases/submit-move";
import { generateReport } from "@/application/use-cases/generate-report";
import {
  savePreCommit,
  getPreCommit,
  deletePreCommit,
} from "@/application/services/pre-commit-store";
import type { MoveType } from "@/domain/game/move";
import type { PredictorInput } from "@/domain/ai/predictor";
import type { AiPersonalityType } from "@/domain/ai/ai-personality";
import type { RoundData } from "@/domain/game/round";
import type { SessionReport } from "@/domain/game/session-report";

export class GameService {
  async startNewRound(params: {
    sessionId: string;
    history: PredictorInput[];
    personality: AiPersonalityType;
    currentRound: number;
  }): Promise<{ roundNumber: number; commitHash: string }> {
    const result = await startRound({
      sessionId: params.sessionId,
      rounds: params.history,
      personality: params.personality,
      currentRound: params.currentRound,
    });

    savePreCommit(params.sessionId, result.roundNumber, {
      aiMove: result.aiMove,
      salt: result.salt,
      commitHash: result.commitHash,
      personality: params.personality,
      history: params.history,
      currentRound: params.currentRound,
    });

    return {
      roundNumber: result.roundNumber,
      commitHash: result.commitHash,
    };
  }

  async revealAndJudge(params: {
    sessionId: string;
    roundNumber: number;
    playerMove: MoveType;
    personality: AiPersonalityType;
    history: PredictorInput[];
  }): Promise<SubmitMoveResult> {
    const preCommit = getPreCommit(params.sessionId, params.roundNumber);

    if (!preCommit) {
      throw new Error(
        `No pre-commit found for ${params.sessionId}:${params.roundNumber}`
      );
    }

    const result = await submitMove({
      playerMove: params.playerMove,
      aiMove: preCommit.aiMove,
      salt: preCommit.salt,
      commitHash: preCommit.commitHash,
      personality: params.personality,
      history: params.history,
      currentRound: params.roundNumber,
    });

    // Delete only after successful execution
    deletePreCommit(params.sessionId, params.roundNumber);

    return result;
  }

  generateSessionReport(params: { rounds: RoundData[] }): SessionReport {
    return generateReport(params);
  }
}
