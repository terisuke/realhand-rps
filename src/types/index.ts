export type Move = "rock" | "paper" | "scissors";
export type Result = "win" | "lose" | "draw";
export type GameMode = "camera" | "button";

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
