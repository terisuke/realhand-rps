import { Move, MoveType } from "./move";
import { ResultType, judge } from "./round-result";
import { GamePhase } from "./game-phase";

export interface RoundData {
  roundNumber: number;
  playerMove: MoveType;
  aiMove: MoveType;
  result: ResultType;
  thought: string;
  phase: GamePhase;
  aiPredictedCorrectly: boolean;
}

export class Round {
  private constructor(private readonly _data: RoundData) {}

  get data(): Readonly<RoundData> {
    return Object.freeze({ ...this._data });
  }

  static create(params: {
    roundNumber: number;
    playerMove: Move;
    aiMove: Move;
    thought: string;
    phase: GamePhase;
    aiPredictedCorrectly: boolean;
  }): Round {
    const result = judge(params.playerMove, params.aiMove);
    return new Round({
      roundNumber: params.roundNumber,
      playerMove: params.playerMove.type,
      aiMove: params.aiMove.type,
      result,
      thought: params.thought,
      phase: params.phase,
      aiPredictedCorrectly: params.aiPredictedCorrectly,
    });
  }

  get roundNumber(): number {
    return this._data.roundNumber;
  }

  get playerMove(): MoveType {
    return this._data.playerMove;
  }

  get aiMove(): MoveType {
    return this._data.aiMove;
  }

  get result(): ResultType {
    return this._data.result;
  }

  get thought(): string {
    return this._data.thought;
  }

  get phase(): GamePhase {
    return this._data.phase;
  }

  get aiPredictedCorrectly(): boolean {
    return this._data.aiPredictedCorrectly;
  }
}
