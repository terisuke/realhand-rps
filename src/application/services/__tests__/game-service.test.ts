import { describe, it, expect, beforeEach } from "vitest";
import { GameService } from "../game-service";
import { clearAllPreCommits } from "../pre-commit-store";
import type { RoundData } from "@/domain/game/round";
import type { MoveType } from "@/domain/game/move";

const MOVES: MoveType[] = ["rock", "paper", "scissors"];

let service: GameService;

beforeEach(() => {
  clearAllPreCommits();
  service = new GameService();
});

describe("GameService.startNewRound", () => {
  it("returns roundNumber and commitHash without leaking aiMove or salt", async () => {
    const result = await service.startNewRound({
      sessionId: "test-1",
      history: [],
      personality: "analytical",
      currentRound: 1,
    });

    expect(result.roundNumber).toBe(1);
    expect(typeof result.commitHash).toBe("string");
    expect(result.commitHash.length).toBeGreaterThan(0);
    expect(result).not.toHaveProperty("aiMove");
    expect(result).not.toHaveProperty("salt");
  });

  it("works with existing history", async () => {
    const result = await service.startNewRound({
      sessionId: "test-2",
      history: [
        { playerMove: "rock", aiMove: "paper", result: "lose" },
        { playerMove: "scissors", aiMove: "rock", result: "lose" },
      ],
      personality: "provocative",
      currentRound: 3,
    });

    expect(result.roundNumber).toBe(3);
    expect(typeof result.commitHash).toBe("string");
  });
});

describe("GameService.revealAndJudge", () => {
  it("returns a valid SubmitMoveResult with verified commit proof", async () => {
    await service.startNewRound({
      sessionId: "reveal-1",
      history: [],
      personality: "uncanny",
      currentRound: 1,
    });

    const result = await service.revealAndJudge({
      sessionId: "reveal-1",
      roundNumber: 1,
      playerMove: "rock",
      personality: "uncanny",
      history: [],
    });

    expect(MOVES).toContain(result.aiMove);
    expect(["win", "lose", "draw"]).toContain(result.result);
    expect(typeof result.thought).toBe("string");
    expect(result.thought.length).toBeGreaterThan(0);
    expect(Array.isArray(result.milestones)).toBe(true);
    expect(result.commitProof.verified).toBe(true);
  });

  it("throws when no pre-commit exists", async () => {
    await expect(
      service.revealAndJudge({
        sessionId: "missing",
        roundNumber: 99,
        playerMove: "rock",
        personality: "analytical",
        history: [],
      })
    ).rejects.toThrow("No pre-commit found for missing:99");
  });

  it("removes pre-commit after reveal (prevents replay)", async () => {
    await service.startNewRound({
      sessionId: "replay-test",
      history: [],
      personality: "analytical",
      currentRound: 1,
    });

    await service.revealAndJudge({
      sessionId: "replay-test",
      roundNumber: 1,
      playerMove: "scissors",
      personality: "analytical",
      history: [],
    });

    await expect(
      service.revealAndJudge({
        sessionId: "replay-test",
        roundNumber: 1,
        playerMove: "scissors",
        personality: "analytical",
        history: [],
      })
    ).rejects.toThrow("No pre-commit found");
  });
});

describe("GameService.generateSessionReport", () => {
  it("returns a valid SessionReport for empty rounds", () => {
    const result = service.generateSessionReport({ rounds: [] });

    expect(result.totalRounds).toBe(0);
    expect(result.playerWins).toBe(0);
    expect(result.aiWins).toBe(0);
    expect(result.draws).toBe(0);
    expect(result.moveDistribution).toEqual({ rock: 0, paper: 0, scissors: 0 });
  });

  it("returns correct stats for non-empty rounds", () => {
    const rounds: RoundData[] = [
      {
        roundNumber: 1,
        playerMove: "rock",
        aiMove: "scissors",
        result: "win",
        thought: "test",
        phase: "opening",
        aiPredictedCorrectly: false,
      },
      {
        roundNumber: 2,
        playerMove: "paper",
        aiMove: "scissors",
        result: "lose",
        thought: "test",
        phase: "opening",
        aiPredictedCorrectly: true,
      },
      {
        roundNumber: 3,
        playerMove: "rock",
        aiMove: "rock",
        result: "draw",
        thought: "test",
        phase: "midgame",
        aiPredictedCorrectly: false,
      },
    ];

    const result = service.generateSessionReport({ rounds });

    expect(result.totalRounds).toBe(3);
    expect(result.playerWins).toBe(1);
    expect(result.aiWins).toBe(1);
    expect(result.draws).toBe(1);
    expect(result.moveDistribution.rock).toBe(2);
    expect(result.moveDistribution.paper).toBe(1);
    expect(result.moveDistribution.scissors).toBe(0);
  });
});

describe("integration: startNewRound -> revealAndJudge flow", () => {
  it("completes the full round flow with verified commit proof", async () => {
    const startResult = await service.startNewRound({
      sessionId: "integration-1",
      history: [],
      personality: "analytical",
      currentRound: 1,
    });

    expect(startResult.commitHash.length).toBeGreaterThan(0);

    const submitResult = await service.revealAndJudge({
      sessionId: "integration-1",
      roundNumber: 1,
      playerMove: "scissors",
      personality: "analytical",
      history: [],
    });

    expect(submitResult.commitProof.verified).toBe(true);
    expect(submitResult.commitProof.hash).toBe(startResult.commitHash);
    expect(MOVES).toContain(submitResult.aiMove);
    expect(["win", "lose", "draw"]).toContain(submitResult.result);
    expect(typeof submitResult.thought).toBe("string");
  });

  it("handles multiple rounds in sequence", async () => {
    const round1 = await service.startNewRound({
      sessionId: "multi-round",
      history: [],
      personality: "provocative",
      currentRound: 1,
    });

    const result1 = await service.revealAndJudge({
      sessionId: "multi-round",
      roundNumber: 1,
      playerMove: "rock",
      personality: "provocative",
      history: [],
    });

    expect(result1.commitProof.verified).toBe(true);

    const history = [
      { playerMove: "rock" as MoveType, aiMove: result1.aiMove, result: result1.result },
    ];

    const round2 = await service.startNewRound({
      sessionId: "multi-round",
      history,
      personality: "provocative",
      currentRound: 2,
    });

    const result2 = await service.revealAndJudge({
      sessionId: "multi-round",
      roundNumber: 2,
      playerMove: "paper",
      personality: "provocative",
      history,
    });

    expect(result2.commitProof.verified).toBe(true);
    expect(result2.commitProof.hash).toBe(round2.commitHash);
  });
});
