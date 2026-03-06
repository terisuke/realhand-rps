import { describe, it, expect } from "vitest";
import { buildSessionReport } from "@/domain/game/session-report";
import type { RoundData } from "@/domain/game/round";

function makeRound(
  roundNumber: number,
  playerMove: "rock" | "paper" | "scissors",
  aiMove: "rock" | "paper" | "scissors",
  result: "win" | "lose" | "draw"
): RoundData {
  return {
    roundNumber,
    playerMove,
    aiMove,
    result,
    thought: "test",
    phase: "opening",
    aiPredictedCorrectly: false,
  };
}

describe("buildSessionReport - empty rounds", () => {
  it("returns zeroed report for empty rounds", () => {
    const report = buildSessionReport([]);
    expect(report.totalRounds).toBe(0);
    expect(report.playerWins).toBe(0);
    expect(report.aiWins).toBe(0);
    expect(report.draws).toBe(0);
    expect(report.moveDistribution).toEqual({ rock: 0, paper: 0, scissors: 0 });
    expect(report.moveRatios).toEqual({ rock: 0, paper: 0, scissors: 0 });
    expect(report.winRateHistory).toEqual([]);
    expect(report.afterLoseChangedRate).toBe(0);
    expect(report.playerWinRate).toBe(0);
    expect(report.aiWinRate).toBe(0);
  });
});

describe("buildSessionReport - win/loss/draw counts", () => {
  it("correctly counts wins, losses, draws", () => {
    const rounds = [
      makeRound(1, "rock", "scissors", "win"),
      makeRound(2, "rock", "paper", "lose"),
      makeRound(3, "rock", "rock", "draw"),
      makeRound(4, "scissors", "rock", "lose"),
      makeRound(5, "paper", "rock", "win"),
    ];
    const report = buildSessionReport(rounds);
    expect(report.totalRounds).toBe(5);
    expect(report.playerWins).toBe(2);
    expect(report.aiWins).toBe(2);
    expect(report.draws).toBe(1);
  });

  it("calculates playerWinRate as percentage", () => {
    const rounds = [
      makeRound(1, "rock", "scissors", "win"),
      makeRound(2, "rock", "paper", "lose"),
      makeRound(3, "rock", "rock", "draw"),
      makeRound(4, "scissors", "rock", "lose"),
    ];
    const report = buildSessionReport(rounds);
    // 1 win out of 4 = 25%
    expect(report.playerWinRate).toBe(25);
  });

  it("calculates aiWinRate as percentage", () => {
    const rounds = [
      makeRound(1, "rock", "scissors", "win"),
      makeRound(2, "rock", "paper", "lose"),
      makeRound(3, "rock", "rock", "draw"),
      makeRound(4, "scissors", "rock", "lose"),
    ];
    const report = buildSessionReport(rounds);
    // 2 AI wins out of 4 = 50%
    expect(report.aiWinRate).toBe(50);
  });
});

describe("buildSessionReport - moveDistribution", () => {
  it("accurately counts move distribution", () => {
    const rounds = [
      makeRound(1, "rock", "rock", "draw"),
      makeRound(2, "rock", "scissors", "win"),
      makeRound(3, "scissors", "rock", "lose"),
      makeRound(4, "paper", "rock", "win"),
    ];
    const report = buildSessionReport(rounds);
    expect(report.moveDistribution).toEqual({ rock: 2, paper: 1, scissors: 1 });
  });

  it("calculates move ratios as fractions summing to 1", () => {
    const rounds = [
      makeRound(1, "rock", "rock", "draw"),
      makeRound(2, "rock", "scissors", "win"),
      makeRound(3, "paper", "rock", "win"),
      makeRound(4, "paper", "rock", "win"),
    ];
    const report = buildSessionReport(rounds);
    expect(report.moveRatios.rock).toBeCloseTo(0.5);
    expect(report.moveRatios.paper).toBeCloseTo(0.5);
    expect(report.moveRatios.scissors).toBeCloseTo(0);
  });
});

describe("buildSessionReport - afterLoseChangedRate", () => {
  it("calculates afterLoseChangedRate correctly when player always changes after loss", () => {
    const rounds = [
      makeRound(1, "rock", "paper", "lose"),
      makeRound(2, "paper", "scissors", "lose"), // changed from rock → counted
      makeRound(3, "scissors", "rock", "lose"),  // changed from paper → counted
    ];
    const report = buildSessionReport(rounds);
    // 2 opportunities (after round 1 and 2 losses), both changed → 100%
    expect(report.afterLoseChangedRate).toBe(1);
  });

  it("calculates afterLoseChangedRate = 0 when player never changes after loss", () => {
    const rounds = [
      makeRound(1, "rock", "paper", "lose"),
      makeRound(2, "rock", "scissors", "win"),   // did not change after lose
    ];
    const report = buildSessionReport(rounds);
    expect(report.afterLoseChangedRate).toBe(0);
  });

  it("returns 0 for afterLoseChangedRate with no losses", () => {
    const rounds = [
      makeRound(1, "rock", "scissors", "win"),
      makeRound(2, "paper", "rock", "win"),
    ];
    const report = buildSessionReport(rounds);
    expect(report.afterLoseChangedRate).toBe(0);
  });
});

describe("buildSessionReport - winRateHistory", () => {
  it("has correct length matching rounds", () => {
    const rounds = [
      makeRound(1, "rock", "scissors", "win"),
      makeRound(2, "rock", "paper", "lose"),
      makeRound(3, "rock", "rock", "draw"),
    ];
    const report = buildSessionReport(rounds);
    expect(report.winRateHistory).toHaveLength(3);
  });

  it("has correct cumulative win rate at each round", () => {
    const rounds = [
      makeRound(1, "rock", "scissors", "win"),   // 1/1 = 1.0
      makeRound(2, "rock", "paper", "lose"),      // 1/2 = 0.5
      makeRound(3, "paper", "rock", "win"),       // 2/3 ≈ 0.667
    ];
    const report = buildSessionReport(rounds);
    expect(report.winRateHistory[0]).toBeCloseTo(1.0);
    expect(report.winRateHistory[1]).toBeCloseTo(0.5);
    expect(report.winRateHistory[2]).toBeCloseTo(2 / 3);
  });
});

describe("buildSessionReport - topAiPattern", () => {
  it("contains a Japanese move name", () => {
    const rounds = [
      makeRound(1, "rock", "scissors", "win"),
      makeRound(2, "rock", "paper", "lose"),
      makeRound(3, "rock", "rock", "draw"),
    ];
    const report = buildSessionReport(rounds);
    // Most used move is "rock" = "グー"
    expect(report.topAiPattern).toContain("グー");
  });

  it("reflects the most-used player move", () => {
    const rounds = [
      makeRound(1, "scissors", "rock", "lose"),
      makeRound(2, "scissors", "paper", "win"),
      makeRound(3, "scissors", "scissors", "draw"),
      makeRound(4, "rock", "scissors", "win"),
    ];
    const report = buildSessionReport(rounds);
    // scissors (3x) is most used = "チョキ"
    expect(report.topAiPattern).toContain("チョキ");
  });
});
