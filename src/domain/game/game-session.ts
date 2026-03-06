import { Round, RoundData } from "./round";
import { Move, MoveType } from "./move";
import { GamePhase, computePhase } from "./game-phase";
import { Milestone, detectMilestones } from "./milestone";
import type { AiPersonalityType } from "../ai/ai-personality";

export interface GameSessionData {
  rounds: RoundData[];
  personality: AiPersonalityType;
}

const MAX_ROUNDS = 30;

export class GameSession {
  private constructor(
    private readonly rounds: Round[],
    public readonly personality: AiPersonalityType
  ) {}

  static create(personality: AiPersonalityType): GameSession {
    return new GameSession([], personality);
  }

  static fromHistory(rounds: RoundData[], personality: AiPersonalityType): GameSession {
    const reconstructed = rounds.map((data) =>
      Round.create({
        roundNumber: data.roundNumber,
        playerMove: Move.of(data.playerMove as MoveType),
        aiMove: Move.of(data.aiMove as MoveType),
        thought: data.thought,
        phase: data.phase,
        aiPredictedCorrectly: data.aiPredictedCorrectly,
      })
    );
    return new GameSession(reconstructed, personality);
  }

  addRound(params: {
    playerMove: Move;
    aiMove: Move;
    thought: string;
    phase: GamePhase;
    aiPredictedCorrectly: boolean;
  }): GameSession {
    if (this.rounds.length >= MAX_ROUNDS) {
      throw new Error(`ゲームセッションは最大${MAX_ROUNDS}ラウンドです`);
    }
    const round = Round.create({
      roundNumber: this.rounds.length + 1,
      ...params,
    });
    return new GameSession([...this.rounds, round], this.personality);
  }

  getCurrentPhase(): GamePhase {
    const accuracyData = this.rounds.map((r) => ({
      aiPredictedCorrectly: r.aiPredictedCorrectly,
    }));
    return computePhase(accuracyData, this.rounds.length);
  }

  isComplete(): boolean {
    return this.rounds.length >= MAX_ROUNDS;
  }

  getRounds(): readonly RoundData[] {
    return this.rounds.map((r) => r.data);
  }

  getRoundCount(): number {
    return this.rounds.length;
  }

  checkMilestones(): Milestone[] {
    const simpleRounds = this.rounds.map((r) => ({
      result: r.result as "win" | "lose" | "draw",
      roundNumber: r.roundNumber,
    }));
    return detectMilestones(simpleRounds);
  }

  getWins(): number {
    return this.rounds.filter((r) => r.result === "win").length;
  }

  getLosses(): number {
    return this.rounds.filter((r) => r.result === "lose").length;
  }

  getDraws(): number {
    return this.rounds.filter((r) => r.result === "draw").length;
  }
}
