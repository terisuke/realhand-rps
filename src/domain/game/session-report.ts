import { JP_LABELS, type MoveType } from "./move";
import type { RoundData } from "./round";

export interface SessionReport {
  totalRounds: number;
  playerWins: number;
  aiWins: number;
  draws: number;
  moveDistribution: Record<MoveType, number>;
  moveRatios: Record<MoveType, number>;
  winRateHistory: number[];
  topAiPattern: string;
  afterLoseChangedRate: number;
  playerWinRate: number;
  aiWinRate: number;
}

const EMPTY_DIST: Record<MoveType, number> = { rock: 0, paper: 0, scissors: 0 };

export function buildSessionReport(rounds: RoundData[]): SessionReport {
  if (rounds.length === 0) {
    return {
      totalRounds: 0,
      playerWins: 0,
      aiWins: 0,
      draws: 0,
      moveDistribution: { ...EMPTY_DIST },
      moveRatios: { ...EMPTY_DIST },
      winRateHistory: [],
      topAiPattern: "",
      afterLoseChangedRate: 0,
      playerWinRate: 0,
      aiWinRate: 0,
    };
  }

  const dist = rounds.reduce<Record<MoveType, number>>(
    (acc, r) => ({ ...acc, [r.playerMove]: acc[r.playerMove] + 1 }),
    { rock: 0, paper: 0, scissors: 0 }
  );

  const { afterLoseChanged, afterLoseTotal } = rounds.reduce(
    (acc, r, i) => {
      if (i === 0 || rounds[i - 1].result !== "lose") return acc;
      const changed = r.playerMove !== rounds[i - 1].playerMove ? 1 : 0;
      return { afterLoseTotal: acc.afterLoseTotal + 1, afterLoseChanged: acc.afterLoseChanged + changed };
    },
    { afterLoseChanged: 0, afterLoseTotal: 0 }
  );

  const totalRounds = rounds.length;
  const playerWins = rounds.filter((r) => r.result === "win").length;
  const aiWins = rounds.filter((r) => r.result === "lose").length;
  const draws = rounds.filter((r) => r.result === "draw").length;

  const moveRatios: Record<MoveType, number> = {
    rock: dist.rock / totalRounds,
    paper: dist.paper / totalRounds,
    scissors: dist.scissors / totalRounds,
  };

  const winRateHistory = rounds.map((_, i) => {
    const slice = rounds.slice(0, i + 1);
    return slice.filter((r) => r.result === "win").length / (i + 1);
  });

  const mostUsed = (Object.keys(dist) as MoveType[]).reduce((a, b) =>
    dist[a] >= dist[b] ? a : b
  );
  const topAiPattern = `あなたは「${JP_LABELS[mostUsed]}」が最も多く（${Math.round((dist[mostUsed] / totalRounds) * 100)}%）、そのパターンを重点的に読みました。`;

  return {
    totalRounds,
    playerWins,
    aiWins,
    draws,
    moveDistribution: { ...dist },
    moveRatios,
    winRateHistory,
    topAiPattern,
    afterLoseChangedRate: afterLoseTotal > 0 ? afterLoseChanged / afterLoseTotal : 0,
    playerWinRate: Math.round((playerWins / totalRounds) * 100),
    aiWinRate: Math.round((aiWins / totalRounds) * 100),
  };
}
