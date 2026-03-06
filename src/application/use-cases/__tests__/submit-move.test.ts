import { describe, it, expect } from "vitest";
import { createCommitHash } from "@/infrastructure/crypto/commit-hash";
import { submitMove } from "@/application/use-cases/submit-move";

describe("submitMove", () => {
  async function makeValidInput(overrides?: Partial<Parameters<typeof submitMove>[0]>) {
    const aiMove = "rock" as const;
    const salt = "test-salt-123";
    const commitHash = await createCommitHash(aiMove, salt);
    return {
      playerMove: "scissors" as const,
      aiMove,
      salt,
      commitHash,
      personality: "analytical" as const,
      history: [],
      currentRound: 1,
      ...overrides,
    };
  }

  it("returns correct judge result for known moves (player loses)", async () => {
    const input = await makeValidInput({ playerMove: "scissors", aiMove: "rock" });
    const result = await submitMove(input);
    expect(result.result).toBe("lose");
  });

  it("returns win when player beats AI", async () => {
    const aiMove = "rock" as const;
    const salt = "test-salt-456";
    const commitHash = await createCommitHash(aiMove, salt);
    const result = await submitMove({
      playerMove: "paper",
      aiMove,
      salt,
      commitHash,
      personality: "provocative",
      history: [],
      currentRound: 1,
    });
    expect(result.result).toBe("win");
  });

  it("returns draw when both moves are the same", async () => {
    const aiMove = "paper" as const;
    const salt = "salt-draw";
    const commitHash = await createCommitHash(aiMove, salt);
    const result = await submitMove({
      playerMove: "paper",
      aiMove,
      salt,
      commitHash,
      personality: "uncanny",
      history: [],
      currentRound: 1,
    });
    expect(result.result).toBe("draw");
  });

  it("commit hash verification passes for valid input", async () => {
    const input = await makeValidInput();
    const result = await submitMove(input);
    expect(result.commitProof.verified).toBe(true);
    expect(result.commitProof.hash).toBe(input.commitHash);
    expect(result.commitProof.salt).toBe(input.salt);
  });

  it("throws when commit hash verification fails for tampered move", async () => {
    const input = await makeValidInput({
      // aiMove in request is tampered - different from what was committed
      aiMove: "paper",
      // but commitHash was computed with "rock"
    });
    // Override commitHash back to "rock" to simulate server committed rock but returned paper
    const tamperedInput = {
      ...input,
      aiMove: "paper" as const,
      commitHash: await createCommitHash("rock", input.salt),
    };
    await expect(submitMove(tamperedInput)).rejects.toThrow(
      "Commit hash verification failed"
    );
  });

  it("thought is a non-empty string", async () => {
    const input = await makeValidInput();
    const result = await submitMove(input);
    expect(typeof result.thought).toBe("string");
    expect(result.thought.length).toBeGreaterThan(0);
  });

  it("returns aiMove in result", async () => {
    const aiMove = "scissors" as const;
    const salt = "aiMove-test-salt";
    const commitHash = await createCommitHash(aiMove, salt);
    const result = await submitMove({
      playerMove: "rock",
      aiMove,
      salt,
      commitHash,
      personality: "analytical",
      history: [],
      currentRound: 1,
    });
    expect(result.aiMove).toBe("scissors");
  });

  it("detects first_win milestone when player wins for the first time", async () => {
    const aiMove = "rock" as const;
    const salt = "milestone-salt";
    const commitHash = await createCommitHash(aiMove, salt);
    const result = await submitMove({
      playerMove: "paper",
      aiMove,
      salt,
      commitHash,
      personality: "analytical",
      history: [
        { playerMove: "rock", result: "lose", aiMove: "paper" },
        { playerMove: "scissors", result: "lose", aiMove: "rock" },
      ],
      currentRound: 3,
    });
    // Player wins for first time at round 3
    const firstWin = result.milestones.find((m) => m.type === "first_win");
    expect(firstWin).toBeDefined();
    expect(firstWin?.atRound).toBe(3);
  });

  it("returns empty milestones array on normal round with no special events", async () => {
    await makeValidInput({
      playerMove: "rock",
      aiMove: "scissors",
      currentRound: 2,
      history: [{ playerMove: "rock", result: "win", aiMove: "scissors" }],
    });
    // Re-sign with the correct aiMove/salt
    const aiMove = "scissors" as const;
    const salt = "normal-round-salt";
    const commitHash = await createCommitHash(aiMove, salt);
    const result = await submitMove({
      playerMove: "rock",
      aiMove,
      salt,
      commitHash,
      personality: "analytical",
      history: [{ playerMove: "rock", result: "win", aiMove: "scissors" }],
      currentRound: 2,
    });
    // round 2, player already won once before - no first_win milestone
    // no 3-streak, no multiple of 5
    expect(result.milestones).toEqual([]);
  });
});
