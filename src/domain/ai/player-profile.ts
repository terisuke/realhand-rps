import type { MoveType } from "@/domain/game/move";
import type { ResultType } from "@/domain/game/round-result";

export interface RoundInput {
  playerMove: MoveType;
  result: ResultType;
}

export interface PlayerProfile {
  moveDistribution: Record<MoveType, number>;
  moveRatios: Record<MoveType, number>;
  afterLoseChangedRate: number;
  winRate: number;
  mostUsedMove: MoveType;
  streakInfo: { type: ResultType | null; length: number };
}

const ZERO_DIST: Record<MoveType, number> = { rock: 0, paper: 0, scissors: 0 };

function computeMoveDistribution(rounds: RoundInput[]): Record<MoveType, number> {
  return rounds.reduce(
    (acc, r) => ({ ...acc, [r.playerMove]: acc[r.playerMove] + 1 }),
    { ...ZERO_DIST }
  );
}

function computeMoveRatios(
  dist: Record<MoveType, number>,
  total: number
): Record<MoveType, number> {
  if (total === 0) return { ...ZERO_DIST };
  return {
    rock: dist.rock / total,
    paper: dist.paper / total,
    scissors: dist.scissors / total,
  };
}

function computeAfterLoseChangedRate(rounds: RoundInput[]): number {
  let afterLoseTotal = 0;
  let afterLoseChanged = 0;

  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i - 1].result === "lose") {
      afterLoseTotal++;
      if (rounds[i].playerMove !== rounds[i - 1].playerMove) {
        afterLoseChanged++;
      }
    }
  }

  return afterLoseTotal > 0 ? afterLoseChanged / afterLoseTotal : 0;
}

function computeWinRate(rounds: RoundInput[]): number {
  if (rounds.length === 0) return 0;
  return rounds.filter((r) => r.result === "win").length / rounds.length;
}

function computeMostUsedMove(dist: Record<MoveType, number>): MoveType {
  const moves: MoveType[] = ["rock", "paper", "scissors"];
  return moves.reduce((a, b) => (dist[a] >= dist[b] ? a : b));
}

function computeStreakInfo(rounds: RoundInput[]): { type: ResultType | null; length: number } {
  if (rounds.length === 0) return { type: null, length: 0 };

  const lastType = rounds[rounds.length - 1].result;
  let length = 1;

  for (let i = rounds.length - 2; i >= 0; i--) {
    if (rounds[i].result === lastType) {
      length++;
    } else {
      break;
    }
  }

  return { type: lastType, length };
}

export function buildPlayerProfile(rounds: RoundInput[]): PlayerProfile {
  const dist = computeMoveDistribution(rounds);
  const total = rounds.length;

  return {
    moveDistribution: dist,
    moveRatios: computeMoveRatios(dist, total),
    afterLoseChangedRate: computeAfterLoseChangedRate(rounds),
    winRate: computeWinRate(rounds),
    mostUsedMove: computeMostUsedMove(dist),
    streakInfo: computeStreakInfo(rounds),
  };
}
