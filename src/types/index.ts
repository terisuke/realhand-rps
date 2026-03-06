// Re-export domain types
export type { MoveType } from "@/domain/game/move";
export type { ResultType } from "@/domain/game/round-result";

// Backward-compatible aliases
import type { MoveType } from "@/domain/game/move";
import type { ResultType } from "@/domain/game/round-result";

export type Move = MoveType;
export type Result = ResultType;

export type GameMode = "camera" | "button";

// API-boundary interfaces (snake_case conventions)
export interface MatchRecord {
  id?: string;
  session_id: string;
  player_move: Move;
  ai_move: Move;
  result: Result;
  round: number;
  created_at?: string;
}

export interface PlayRequest {
  player_move: Move;
  session_id: string;
  history: MatchRecord[];
}

export interface PlayResponse {
  ai_move: Move;
  result: Result;
  thought: string;
}

export interface ReportData {
  totalRounds: number;
  playerWins: number;
  aiWins: number;
  draws: number;
  moveDistribution: Record<Move, number>;
  winRateHistory: number[];
  topAiPattern: string;
  afterLoseChangedRate: number;
}

export interface PredictorScore {
  name: string;
  prediction: Move;
  confidence: number;
  reason: string;
}
