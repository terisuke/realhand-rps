import { describe, it, expect } from "vitest";
import { Move, MOVES, type MoveType } from "@/domain/game/move";
import { type ResultType } from "@/domain/game/round-result";
import { Round, type RoundData } from "@/domain/game/round";
import { computePhase, type GamePhase } from "@/domain/game/game-phase";
import { detectMilestones } from "@/domain/game/milestone";
import { metaStrategyDecide } from "@/domain/ai/meta-strategy";
import { getReadableBias } from "@/domain/ai/readable-pattern";
import { generateReport } from "@/application/use-cases/generate-report";
import type { PredictorInput } from "@/domain/ai/predictor";

const TOTAL_ROUNDS = 30;

function randomMove(): MoveType {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

function simulateGame(playerMovesFn: (round: number) => MoveType = randomMove): RoundData[] {
  const rounds: RoundData[] = [];
  const history: PredictorInput[] = [];

  for (let i = 1; i <= TOTAL_ROUNDS; i++) {
    const phase = computePhase(
      rounds.map((r) => ({ aiPredictedCorrectly: r.aiPredictedCorrectly })),
      i
    );
    const readableBias = getReadableBias(
      phase,
      rounds.length > 0 ? rounds[rounds.length - 1].aiMove : undefined
    );
    const aiResult = metaStrategyDecide(history, phase, readableBias);
    const aiMove = Move.of(aiResult.move);

    const playerMoveType = playerMovesFn(i);
    const playerMove = Move.of(playerMoveType);

    const predicted = Move.counter(playerMove);
    const aiPredictedCorrectly = aiMove.equals(predicted);

    const round = Round.create({
      roundNumber: i,
      playerMove,
      aiMove,
      thought: aiResult.topReason,
      phase,
      aiPredictedCorrectly,
    });

    rounds.push(round.data);
    history.push({
      playerMove: playerMoveType,
      aiMove: aiResult.move,
      result: round.result,
    });
  }

  return rounds;
}

describe("Integration: Game Flow", () => {
  describe("Complete 30-round game simulation", () => {
    it("plays exactly 30 rounds with correct win/loss/draw totals", () => {
      const rounds = simulateGame();

      expect(rounds).toHaveLength(TOTAL_ROUNDS);

      const wins = rounds.filter((r) => r.result === "win").length;
      const losses = rounds.filter((r) => r.result === "lose").length;
      const draws = rounds.filter((r) => r.result === "draw").length;

      expect(wins + losses + draws).toBe(TOTAL_ROUNDS);
    });

    it("generates a valid report from a completed game", () => {
      const rounds = simulateGame();
      const report = generateReport({ rounds });

      expect(report.totalRounds).toBe(TOTAL_ROUNDS);
      expect(report.playerWins + report.aiWins + report.draws).toBe(TOTAL_ROUNDS);
      expect(report.winRateHistory).toHaveLength(TOTAL_ROUNDS);

      const distSum =
        report.moveDistribution.rock +
        report.moveDistribution.paper +
        report.moveDistribution.scissors;
      expect(distSum).toBe(TOTAL_ROUNDS);
    });

    it("assigns valid phases and moves to every round", () => {
      const rounds = simulateGame();
      const validPhases: GamePhase[] = ["opening", "midgame", "endgame"];
      const validResults: ResultType[] = ["win", "lose", "draw"];

      for (const round of rounds) {
        expect(validPhases).toContain(round.phase);
        expect(MOVES).toContain(round.playerMove);
        expect(MOVES).toContain(round.aiMove);
        expect(validResults).toContain(round.result);
        expect(round.thought).toBeTruthy();
      }
    });
  });

  describe("Phase transitions", () => {
    it("transitions to midgame when AI prediction accuracy exceeds 50% in a window", () => {
      // Directly test computePhase with controlled accuracy data
      // Window size is 5; accuracy > 0.5 triggers midgame
      const roundsWithHighAccuracy = [
        { aiPredictedCorrectly: true },
        { aiPredictedCorrectly: true },
        { aiPredictedCorrectly: true },
        { aiPredictedCorrectly: false },
        { aiPredictedCorrectly: false },
      ];
      // 3/5 = 0.6 > 0.5 -> midgame
      const phase = computePhase(roundsWithHighAccuracy, 6);
      expect(phase).toBe("midgame");

      // Verify opening stays opening with low accuracy (1/5 = 0.2)
      const lowAccuracy = [
        { aiPredictedCorrectly: false },
        { aiPredictedCorrectly: false },
        { aiPredictedCorrectly: false },
        { aiPredictedCorrectly: false },
        { aiPredictedCorrectly: true },
      ];
      const openingPhase = computePhase(lowAccuracy, 6);
      expect(openingPhase).toBe("opening");
    });

    it("transitions to endgame by round 25 regardless of accuracy", () => {
      const rounds = simulateGame();

      // Round 25+ must be at least endgame (computePhase forces endgame at round >= 25)
      const lateRounds = rounds.filter((r) => r.roundNumber >= 25);
      for (const round of lateRounds) {
        expect(round.phase).toBe("endgame");
      }
    });

    it("phases are monotonically non-decreasing", () => {
      const rounds = simulateGame(() => "rock");
      const phaseRank: Record<GamePhase, number> = { opening: 0, midgame: 1, endgame: 2 };

      let maxRank = 0;
      for (const round of rounds) {
        const rank = phaseRank[round.phase];
        expect(rank).toBeGreaterThanOrEqual(maxRank);
        maxRank = Math.max(maxRank, rank);
      }
    });
  });

  describe("Milestone detection", () => {
    it("detects first_win milestone", () => {
      const rounds: Array<{ result: ResultType; roundNumber: number }> = [
        { result: "lose", roundNumber: 1 },
        { result: "draw", roundNumber: 2 },
        { result: "win", roundNumber: 3 },
      ];

      const milestones = detectMilestones(rounds);
      const firstWin = milestones.find((m) => m.type === "first_win");
      expect(firstWin).toBeDefined();
      expect(firstWin!.atRound).toBe(3);
    });

    it("detects three_streak_win milestone", () => {
      const rounds: Array<{ result: ResultType; roundNumber: number }> = [
        { result: "win", roundNumber: 1 },
        { result: "win", roundNumber: 2 },
        { result: "win", roundNumber: 3 },
      ];

      const milestones = detectMilestones(rounds);
      const streakWin = milestones.find((m) => m.type === "three_streak_win");
      expect(streakWin).toBeDefined();
      expect(streakWin!.atRound).toBe(3);
    });

    it("detects three_streak_lose milestone", () => {
      const rounds: Array<{ result: ResultType; roundNumber: number }> = [
        { result: "lose", roundNumber: 1 },
        { result: "lose", roundNumber: 2 },
        { result: "lose", roundNumber: 3 },
      ];

      const milestones = detectMilestones(rounds);
      const streakLose = milestones.find((m) => m.type === "three_streak_lose");
      expect(streakLose).toBeDefined();
      expect(streakLose!.atRound).toBe(3);
    });

    it("detects player_dominance milestone", () => {
      const rounds: Array<{ result: ResultType; roundNumber: number }> = [];
      // 7 wins, 2 losses -> wins - losses = 5
      for (let i = 1; i <= 7; i++) rounds.push({ result: "win", roundNumber: i });
      rounds.push({ result: "lose", roundNumber: 8 });
      rounds.push({ result: "lose", roundNumber: 9 });

      const milestones = detectMilestones(rounds);
      const dominance = milestones.find((m) => m.type === "player_dominance");
      expect(dominance).toBeDefined();
      expect(dominance!.atRound).toBe(9);
    });

    it("detects ai_dominance milestone", () => {
      const rounds: Array<{ result: ResultType; roundNumber: number }> = [];
      // 7 losses, 2 wins -> losses - wins = 5
      for (let i = 1; i <= 7; i++) rounds.push({ result: "lose", roundNumber: i });
      rounds.push({ result: "win", roundNumber: 8 });
      rounds.push({ result: "win", roundNumber: 9 });

      const milestones = detectMilestones(rounds);
      const dominance = milestones.find((m) => m.type === "ai_dominance");
      expect(dominance).toBeDefined();
      expect(dominance!.atRound).toBe(9);
    });

    it("detects five_rounds milestone at round 5", () => {
      const rounds: Array<{ result: ResultType; roundNumber: number }> = [];
      for (let i = 1; i <= 5; i++) rounds.push({ result: "draw", roundNumber: i });

      const milestones = detectMilestones(rounds);
      const fiveRounds = milestones.find((m) => m.type === "five_rounds");
      expect(fiveRounds).toBeDefined();
      expect(fiveRounds!.atRound).toBe(5);
    });

    it("detects halfway milestone at round 15", () => {
      const rounds: Array<{ result: ResultType; roundNumber: number }> = [];
      for (let i = 1; i <= 15; i++) rounds.push({ result: "draw", roundNumber: i });

      const milestones = detectMilestones(rounds);
      const halfway = milestones.find((m) => m.type === "halfway");
      expect(halfway).toBeDefined();
      expect(halfway!.atRound).toBe(15);
    });
  });

  describe("Report generation from completed game", () => {
    it("generates complete report with correct structure", () => {
      const rounds = simulateGame();
      const report = generateReport({ rounds });

      expect(report.totalRounds).toBe(TOTAL_ROUNDS);
      expect(report.winRateHistory).toHaveLength(TOTAL_ROUNDS);

      const distSum =
        report.moveDistribution.rock +
        report.moveDistribution.paper +
        report.moveDistribution.scissors;
      expect(distSum).toBe(TOTAL_ROUNDS);

      // moveRatios should sum to ~1
      const ratioSum = report.moveRatios.rock + report.moveRatios.paper + report.moveRatios.scissors;
      expect(ratioSum).toBeCloseTo(1, 5);
    });

    it("calculates correct win rates", () => {
      const rounds = simulateGame();
      const report = generateReport({ rounds });

      const expectedPlayerWinRate = Math.round(
        (report.playerWins / report.totalRounds) * 100
      );
      const expectedAiWinRate = Math.round(
        (report.aiWins / report.totalRounds) * 100
      );

      expect(report.playerWinRate).toBe(expectedPlayerWinRate);
      expect(report.aiWinRate).toBe(expectedAiWinRate);
    });

    it("win rate history is cumulative and between 0 and 1", () => {
      const rounds = simulateGame();
      const report = generateReport({ rounds });

      for (const rate of report.winRateHistory) {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(1);
      }
    });

    it("topAiPattern is a non-empty string", () => {
      const rounds = simulateGame();
      const report = generateReport({ rounds });

      expect(report.topAiPattern).toBeTruthy();
      expect(typeof report.topAiPattern).toBe("string");
    });

    it("afterLoseChangedRate is between 0 and 1", () => {
      const rounds = simulateGame();
      const report = generateReport({ rounds });

      expect(report.afterLoseChangedRate).toBeGreaterThanOrEqual(0);
      expect(report.afterLoseChangedRate).toBeLessThanOrEqual(1);
    });
  });
});
