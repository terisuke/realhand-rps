import { describe, it, expect } from "vitest";
import { startRound } from "@/application/use-cases/start-round";
import { verifyCommitHash } from "@/infrastructure/crypto/commit-hash";
import type { PredictorInput } from "@/domain/ai/predictor";

const MOVES = ["rock", "paper", "scissors"] as const;

const emptyHistory: PredictorInput[] = [];

const shortHistory: PredictorInput[] = [
  { playerMove: "rock", result: "lose", aiMove: "paper" },
  { playerMove: "rock", result: "lose", aiMove: "paper" },
  { playerMove: "scissors", result: "win", aiMove: "rock" },
];

describe("startRound", () => {
  it("returns a 64-char hex commit hash", async () => {
    const result = await startRound({
      sessionId: "test-session-1",
      rounds: emptyHistory,
      personality: "analytical",
      currentRound: 1,
    });

    expect(result.commitHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a valid AI move (rock, paper, or scissors)", async () => {
    const result = await startRound({
      sessionId: "test-session-1",
      rounds: emptyHistory,
      personality: "analytical",
      currentRound: 1,
    });

    expect(MOVES).toContain(result.aiMove);
  });

  it("returns the correct round number", async () => {
    const result = await startRound({
      sessionId: "test-session-1",
      rounds: emptyHistory,
      personality: "analytical",
      currentRound: 5,
    });

    expect(result.roundNumber).toBe(5);
  });

  it("commit hash can be verified with the returned move and salt", async () => {
    const result = await startRound({
      sessionId: "test-session-1",
      rounds: emptyHistory,
      personality: "analytical",
      currentRound: 1,
    });

    const isValid = await verifyCommitHash(result.aiMove, result.salt, result.commitHash);
    expect(isValid).toBe(true);
  });

  it("commit hash does NOT verify with a wrong move", async () => {
    const result = await startRound({
      sessionId: "test-session-1",
      rounds: emptyHistory,
      personality: "analytical",
      currentRound: 1,
    });

    const wrongMove = MOVES.find((m) => m !== result.aiMove) ?? "rock";
    const isValid = await verifyCommitHash(wrongMove, result.salt, result.commitHash);
    expect(isValid).toBe(false);
  });

  it("returns the same move for the same history (stateless, deterministic)", async () => {
    const history: PredictorInput[] = [
      { playerMove: "rock", result: "lose", aiMove: "paper" },
      { playerMove: "rock", result: "lose", aiMove: "paper" },
      { playerMove: "rock", result: "lose", aiMove: "paper" },
      { playerMove: "rock", result: "lose", aiMove: "paper" },
      { playerMove: "rock", result: "lose", aiMove: "paper" },
      { playerMove: "rock", result: "lose", aiMove: "paper" },
    ];

    const result1 = await startRound({
      sessionId: "session-a",
      rounds: history,
      personality: "analytical",
      currentRound: 7,
    });

    const result2 = await startRound({
      sessionId: "session-b",
      rounds: history,
      personality: "analytical",
      currentRound: 7,
    });

    // Move selection is deterministic given same history and phase
    expect(result1.aiMove).toBe(result2.aiMove);
  });

  it("returns different salts each call (non-deterministic salt)", async () => {
    const result1 = await startRound({
      sessionId: "test-session-1",
      rounds: emptyHistory,
      personality: "analytical",
      currentRound: 1,
    });

    const result2 = await startRound({
      sessionId: "test-session-1",
      rounds: emptyHistory,
      personality: "analytical",
      currentRound: 1,
    });

    expect(result1.salt).not.toBe(result2.salt);
  });

  it("works with non-empty history", async () => {
    const result = await startRound({
      sessionId: "test-session-2",
      rounds: shortHistory,
      personality: "provocative",
      currentRound: 4,
    });

    expect(result.commitHash).toMatch(/^[0-9a-f]{64}$/);
    expect(MOVES).toContain(result.aiMove);
    expect(result.roundNumber).toBe(4);
  });

  it("handles endgame round number (>= 25)", async () => {
    const result = await startRound({
      sessionId: "test-session-3",
      rounds: emptyHistory,
      personality: "uncanny",
      currentRound: 25,
    });

    expect(result.commitHash).toMatch(/^[0-9a-f]{64}$/);
    expect(MOVES).toContain(result.aiMove);
  });
});
