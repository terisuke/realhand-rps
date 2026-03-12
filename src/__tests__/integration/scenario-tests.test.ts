import { describe, it, expect } from "vitest";
import { GameSession } from "@/domain/game/game-session";
import { Move, type MoveType, MOVES } from "@/domain/game/move";
import { computePhase, type GamePhase } from "@/domain/game/game-phase";
import { metaStrategyDecide } from "@/domain/ai/meta-strategy";
import { judge } from "@/domain/game/round-result";
import type { PredictorInput } from "@/domain/ai/predictor";
import {
  createCommitHash,
  verifyCommitHash,
  generateSalt,
} from "@/infrastructure/crypto/commit-hash";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomMove(): MoveType {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

/**
 * Simulate a full game round: AI commits first (pre-commit), then player
 * submits a move, then result is determined.
 */
async function playRound(
  session: GameSession,
  playerMoveType: MoveType,
  history: PredictorInput[]
): Promise<{
  session: GameSession;
  history: PredictorInput[];
  commitHash: string;
  commitVerified: boolean;
  aiMoveType: MoveType;
  result: "win" | "lose" | "draw";
  phase: GamePhase;
}> {
  const phase = session.getRoundCount() >= 25
    ? "endgame"
    : session.getCurrentPhase();

  // AI decides (pre-commit model)
  const bias = { rock: 0, paper: 0, scissors: 0 };
  const decision = metaStrategyDecide(history, phase, bias);
  const aiMoveType = decision.move;

  // Create commit hash before player reveals
  const salt = generateSalt();
  const commitHash = await createCommitHash(aiMoveType, salt);

  // Player reveals move
  const playerMove = Move.of(playerMoveType);
  const aiMove = Move.of(aiMoveType);
  const result = judge(playerMove, aiMove);

  // Verify commit integrity
  const commitVerified = await verifyCommitHash(aiMoveType, salt, commitHash);

  // Update session
  const aiPredictedCorrectly = decision.move === playerMoveType;
  const updatedSession = session.addRound({
    playerMove,
    aiMove,
    thought: decision.topReason,
    phase,
    aiPredictedCorrectly,
  });

  // Update predictor history
  const updatedHistory: PredictorInput[] = [
    ...history,
    { playerMove: playerMoveType, result, aiMove: aiMoveType },
  ];

  return {
    session: updatedSession,
    history: updatedHistory,
    commitHash,
    commitVerified,
    aiMoveType,
    result,
    phase,
  };
}

// ---------------------------------------------------------------------------
// Full 30-round game scenario
// ---------------------------------------------------------------------------

describe("Full 30-round game scenario", () => {
  it("completes 30 rounds with valid state transitions", async () => {
    let session = GameSession.create("analytical");
    let history: PredictorInput[] = [];
    const phasesSeen = new Set<GamePhase>();

    for (let i = 0; i < 30; i++) {
      const playerMoveType = randomMove();
      const result = await playRound(session, playerMoveType, history);
      session = result.session;
      history = result.history;
      phasesSeen.add(result.phase);

      expect(session.getRoundCount()).toBe(i + 1);
      expect(result.commitVerified).toBe(true);
      expect(["win", "lose", "draw"]).toContain(result.result);
      expect(MOVES).toContain(result.aiMoveType);
    }

    expect(session.isComplete()).toBe(true);
    expect(session.getRoundCount()).toBe(30);

    // Score totals must be consistent
    const wins = session.getWins();
    const losses = session.getLosses();
    const draws = session.getDraws();
    expect(wins + losses + draws).toBe(30);

    // At minimum opening phase should appear (first rounds)
    expect(phasesSeen.has("opening")).toBe(true);
  });

  it("enforces MAX_ROUNDS=30 by throwing on round 31", async () => {
    let session = GameSession.create("provocative");
    let history: PredictorInput[] = [];

    for (let i = 0; i < 30; i++) {
      const result = await playRound(session, randomMove(), history);
      session = result.session;
      history = result.history;
    }

    expect(session.isComplete()).toBe(true);

    // Attempting a 31st round should throw
    expect(() => {
      session.addRound({
        playerMove: Move.of("rock"),
        aiMove: Move.of("paper"),
        thought: "test",
        phase: "endgame",
        aiPredictedCorrectly: false,
      });
    }).toThrow("30");
  });

  it("transitions through game phases (opening -> midgame/endgame)", () => {
    // Build a scenario where AI predictions are highly accurate to trigger
    // phase transitions via computePhase
    const roundsWithHighAccuracy = Array.from({ length: 30 }, (_, i) => ({
      aiPredictedCorrectly: i >= 3, // accurate from round 4 onward
    }));

    // Check that phase progresses monotonically
    let prevPhaseRank = 0;
    const phaseRank: Record<GamePhase, number> = {
      opening: 0,
      midgame: 1,
      endgame: 2,
    };

    for (let round = 1; round <= 30; round++) {
      const slice = roundsWithHighAccuracy.slice(0, round);
      const phase = computePhase(slice, round);
      const rank = phaseRank[phase];
      expect(rank).toBeGreaterThanOrEqual(prevPhaseRank);
      prevPhaseRank = rank;
    }

    // At round 25+, phase must be endgame regardless of accuracy
    const lowAccuracy = Array.from({ length: 26 }, () => ({
      aiPredictedCorrectly: false,
    }));
    expect(computePhase(lowAccuracy, 26)).toBe("endgame");
  });
});

// ---------------------------------------------------------------------------
// Concurrent sessions
// ---------------------------------------------------------------------------

describe("Concurrent sessions", () => {
  it("two sessions do not interfere with each other", async () => {
    let sessionA = GameSession.create("provocative");
    let sessionB = GameSession.create("analytical");
    let historyA: PredictorInput[] = [];
    let historyB: PredictorInput[] = [];

    // Play 10 rounds on each session, interleaving
    for (let i = 0; i < 10; i++) {
      const resultA = await playRound(sessionA, "rock", historyA);
      sessionA = resultA.session;
      historyA = resultA.history;

      const resultB = await playRound(sessionB, "scissors", historyB);
      sessionB = resultB.session;
      historyB = resultB.history;
    }

    expect(sessionA.getRoundCount()).toBe(10);
    expect(sessionB.getRoundCount()).toBe(10);

    // Sessions should have different personalities
    expect(sessionA.personality).toBe("provocative");
    expect(sessionB.personality).toBe("analytical");

    // Both sessions can independently continue
    const resultA11 = await playRound(sessionA, "paper", historyA);
    expect(resultA11.session.getRoundCount()).toBe(11);

    const resultB11 = await playRound(sessionB, "paper", historyB);
    expect(resultB11.session.getRoundCount()).toBe(11);
  });

  it("session state is isolated - history from A does not affect B", async () => {
    let sessionA = GameSession.create("uncanny");
    let sessionB = GameSession.create("uncanny");
    let historyA: PredictorInput[] = [];
    let historyB: PredictorInput[] = [];

    // Session A plays 5 rounds of only rock
    for (let i = 0; i < 5; i++) {
      const result = await playRound(sessionA, "rock", historyA);
      sessionA = result.session;
      historyA = result.history;
    }

    // Session B plays 5 rounds of only scissors
    for (let i = 0; i < 5; i++) {
      const result = await playRound(sessionB, "scissors", historyB);
      sessionB = result.session;
      historyB = result.history;
    }

    // Verify A's rounds only have rock as player move
    const roundsA = sessionA.getRounds();
    expect(roundsA.every((r) => r.playerMove === "rock")).toBe(true);

    // Verify B's rounds only have scissors as player move
    const roundsB = sessionB.getRounds();
    expect(roundsB.every((r) => r.playerMove === "scissors")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("Edge cases", () => {
  it("first round works with empty history", async () => {
    const session = GameSession.create("analytical");
    const result = await playRound(session, "rock", []);

    expect(result.session.getRoundCount()).toBe(1);
    expect(result.commitVerified).toBe(true);
    expect(MOVES).toContain(result.aiMoveType);
  });

  it("invalid move type throws", () => {
    expect(() => Move.of("invalid" as MoveType)).toThrow("Invalid move type");
  });

  it("GameSession.fromHistory reconstructs correctly", async () => {
    let session = GameSession.create("provocative");
    let history: PredictorInput[] = [];

    for (let i = 0; i < 5; i++) {
      const result = await playRound(session, randomMove(), history);
      session = result.session;
      history = result.history;
    }

    const roundsData = session.getRounds();
    const reconstructed = GameSession.fromHistory(
      [...roundsData],
      "provocative"
    );

    expect(reconstructed.getRoundCount()).toBe(5);
    expect(reconstructed.getWins()).toBe(session.getWins());
    expect(reconstructed.getLosses()).toBe(session.getLosses());
    expect(reconstructed.getDraws()).toBe(session.getDraws());
  });

  it("all three moves produce valid results when played against each other", () => {
    const moves: MoveType[] = ["rock", "paper", "scissors"];
    for (const p of moves) {
      for (const a of moves) {
        const result = judge(Move.of(p), Move.of(a));
        expect(["win", "lose", "draw"]).toContain(result);
        if (p === a) expect(result).toBe("draw");
      }
    }
  });

  it("judge result is consistent with Move.beats()", () => {
    // rock beats scissors, paper beats rock, scissors beats paper
    expect(judge(Move.of("rock"), Move.of("scissors"))).toBe("win");
    expect(judge(Move.of("paper"), Move.of("rock"))).toBe("win");
    expect(judge(Move.of("scissors"), Move.of("paper"))).toBe("win");
    expect(judge(Move.of("scissors"), Move.of("rock"))).toBe("lose");
    expect(judge(Move.of("rock"), Move.of("paper"))).toBe("lose");
    expect(judge(Move.of("paper"), Move.of("scissors"))).toBe("lose");
  });
});

// ---------------------------------------------------------------------------
// Commit integrity across full game
// ---------------------------------------------------------------------------

describe("Commit integrity", () => {
  it("every round commit hash verifies correctly", async () => {
    let session = GameSession.create("analytical");
    let history: PredictorInput[] = [];
    const commitHashes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const result = await playRound(session, randomMove(), history);
      session = result.session;
      history = result.history;
      commitHashes.push(result.commitHash);

      expect(result.commitVerified).toBe(true);
    }

    // All hashes are unique (extremely high probability with random salts)
    const unique = new Set(commitHashes);
    expect(unique.size).toBe(10);

    // All hashes are valid 64-char hex
    for (const hash of commitHashes) {
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("tampered move fails verification", async () => {
    const salt = generateSalt();
    const hash = await createCommitHash("rock", salt);

    // Verify correct move passes
    expect(await verifyCommitHash("rock", salt, hash)).toBe(true);

    // Tampered move fails
    expect(await verifyCommitHash("paper", salt, hash)).toBe(false);
    expect(await verifyCommitHash("scissors", salt, hash)).toBe(false);
  });

  it("tampered salt fails verification", async () => {
    const salt = generateSalt();
    const hash = await createCommitHash("rock", salt);
    const tamperedSalt = generateSalt();

    expect(await verifyCommitHash("rock", tamperedSalt, hash)).toBe(false);
  });

  it("tampered hash fails verification", async () => {
    const salt = generateSalt();
    await createCommitHash("rock", salt);
    const tampered = "a".repeat(64);

    expect(await verifyCommitHash("rock", salt, tampered)).toBe(false);
  });
});
