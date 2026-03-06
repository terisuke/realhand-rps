import { describe, it, expect } from "vitest";
import { generateReport } from "@/application/use-cases/generate-report";
import type { RoundData } from "@/domain/game/round";

function makeRound(overrides: Partial<RoundData> = {}): RoundData {
  return {
    roundNumber: 1,
    playerMove: "rock",
    aiMove: "scissors",
    result: "win",
    thought: "test",
    phase: "opening",
    aiPredictedCorrectly: false,
    ...overrides,
  };
}

describe("generateReport", () => {
  it("returns valid SessionReport for 30 rounds", () => {
    const rounds: RoundData[] = Array.from({ length: 30 }, (_, i) =>
      makeRound({
        roundNumber: i + 1,
        playerMove: i % 3 === 0 ? "rock" : i % 3 === 1 ? "paper" : "scissors",
        aiMove: "rock",
        result: i % 3 === 0 ? "draw" : i % 3 === 1 ? "win" : "lose",
      })
    );

    const report = generateReport({ rounds });

    expect(report.totalRounds).toBe(30);
    expect(report.playerWins + report.aiWins + report.draws).toBe(30);
    expect(report.winRateHistory).toHaveLength(30);
  });

  it("handles empty rounds gracefully", () => {
    const report = generateReport({ rounds: [] });

    expect(report.totalRounds).toBe(0);
    expect(report.playerWins).toBe(0);
    expect(report.aiWins).toBe(0);
    expect(report.draws).toBe(0);
    expect(report.winRateHistory).toHaveLength(0);
    expect(report.playerWinRate).toBe(0);
    expect(report.aiWinRate).toBe(0);
  });

  it("win rates are percentages (0-100)", () => {
    const rounds: RoundData[] = [
      makeRound({ result: "win" }),
      makeRound({ roundNumber: 2, result: "win" }),
      makeRound({ roundNumber: 3, result: "lose" }),
      makeRound({ roundNumber: 4, result: "draw" }),
    ];

    const report = generateReport({ rounds });

    expect(report.playerWinRate).toBeGreaterThanOrEqual(0);
    expect(report.playerWinRate).toBeLessThanOrEqual(100);
    expect(report.aiWinRate).toBeGreaterThanOrEqual(0);
    expect(report.aiWinRate).toBeLessThanOrEqual(100);
    expect(report.playerWinRate).toBe(50);
    expect(report.aiWinRate).toBe(25);
  });
});
