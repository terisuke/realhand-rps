import type { MoveType } from "./game/move";
import type { GamePhase } from "./game/game-phase";

export interface RoundCompleted {
  type: "RoundCompleted";
  round: number;
  playerMove: MoveType;
  aiMove: MoveType;
  result: "win" | "lose" | "draw";
  phase: GamePhase;
}

export interface PhaseTransitioned {
  type: "PhaseTransitioned";
  from: GamePhase;
  to: GamePhase;
  atRound: number;
}

export interface MilestoneReached {
  type: "MilestoneReached";
  milestone: string;
  atRound: number;
}

export interface GameCompleted {
  type: "GameCompleted";
  totalRounds: number;
}

export type DomainEvent =
  | RoundCompleted
  | PhaseTransitioned
  | MilestoneReached
  | GameCompleted;
