import { describe, it, expect } from "vitest";
import { GameSession } from "@/domain/game/game-session";
import { Move } from "@/domain/game/move";

const defaultRoundParams = {
  playerMove: Move.of("rock"),
  aiMove: Move.of("scissors"),
  thought: "テスト用思考",
  phase: "opening" as const,
  aiPredictedCorrectly: false,
};

describe("GameSession.create", () => {
  it("starts with empty rounds", () => {
    const session = GameSession.create("provocative");
    expect(session.getRoundCount()).toBe(0);
    expect(session.getRounds()).toHaveLength(0);
  });

  it("stores the personality", () => {
    const session = GameSession.create("analytical");
    expect(session.personality).toBe("analytical");
  });
});

describe("GameSession.addRound", () => {
  it("returns a new session with the additional round", () => {
    const session = GameSession.create("provocative");
    const next = session.addRound(defaultRoundParams);
    expect(next.getRoundCount()).toBe(1);
  });

  it("does not mutate the original session (immutability)", () => {
    const session = GameSession.create("provocative");
    session.addRound(defaultRoundParams);
    expect(session.getRoundCount()).toBe(0);
  });

  it("accumulates rounds across multiple addRound calls", () => {
    const session = GameSession.create("provocative")
      .addRound(defaultRoundParams)
      .addRound({ ...defaultRoundParams, playerMove: Move.of("paper"), aiMove: Move.of("rock") })
      .addRound({ ...defaultRoundParams, playerMove: Move.of("scissors"), aiMove: Move.of("paper") });
    expect(session.getRoundCount()).toBe(3);
  });

  it("throws when adding a round beyond 30", () => {
    let session = GameSession.create("provocative");
    for (let i = 0; i < 30; i++) {
      session = session.addRound(defaultRoundParams);
    }
    expect(() => session.addRound(defaultRoundParams)).toThrow();
  });
});

describe("GameSession.isComplete", () => {
  it("returns false when rounds < 30", () => {
    const session = GameSession.create("provocative").addRound(defaultRoundParams);
    expect(session.isComplete()).toBe(false);
  });

  it("returns true at 30 rounds", () => {
    let session = GameSession.create("provocative");
    for (let i = 0; i < 30; i++) {
      session = session.addRound(defaultRoundParams);
    }
    expect(session.isComplete()).toBe(true);
  });
});

describe("GameSession win/loss/draw counts", () => {
  it("counts wins correctly", () => {
    // rock vs scissors = win
    const session = GameSession.create("provocative")
      .addRound({ ...defaultRoundParams, playerMove: Move.of("rock"), aiMove: Move.of("scissors") })
      .addRound({ ...defaultRoundParams, playerMove: Move.of("paper"), aiMove: Move.of("rock") });
    expect(session.getWins()).toBe(2);
  });

  it("counts losses correctly", () => {
    // rock vs paper = lose
    const session = GameSession.create("provocative")
      .addRound({ ...defaultRoundParams, playerMove: Move.of("rock"), aiMove: Move.of("paper") })
      .addRound({ ...defaultRoundParams, playerMove: Move.of("scissors"), aiMove: Move.of("rock") });
    expect(session.getLosses()).toBe(2);
  });

  it("counts draws correctly", () => {
    // rock vs rock = draw
    const session = GameSession.create("provocative")
      .addRound({ ...defaultRoundParams, playerMove: Move.of("rock"), aiMove: Move.of("rock") });
    expect(session.getDraws()).toBe(1);
  });
});

describe("GameSession.getCurrentPhase", () => {
  it("returns opening for empty session", () => {
    const session = GameSession.create("provocative");
    expect(session.getCurrentPhase()).toBe("opening");
  });

  it("returns a valid GamePhase", () => {
    const session = GameSession.create("provocative").addRound(defaultRoundParams);
    const phase = session.getCurrentPhase();
    expect(["opening", "midgame", "endgame"]).toContain(phase);
  });
});

describe("GameSession.fromHistory", () => {
  it("reconstructs a session with the same round count", () => {
    const original = GameSession.create("uncanny")
      .addRound(defaultRoundParams)
      .addRound(defaultRoundParams);
    const rounds = original.getRounds();
    const restored = GameSession.fromHistory([...rounds], "uncanny");
    expect(restored.getRoundCount()).toBe(2);
  });

  it("reconstructs the same personality", () => {
    const original = GameSession.create("uncanny").addRound(defaultRoundParams);
    const restored = GameSession.fromHistory([...original.getRounds()], "uncanny");
    expect(restored.personality).toBe("uncanny");
  });

  it("reconstructs win/loss counts accurately", () => {
    const original = GameSession.create("provocative")
      .addRound({ ...defaultRoundParams, playerMove: Move.of("rock"), aiMove: Move.of("scissors") })
      .addRound({ ...defaultRoundParams, playerMove: Move.of("rock"), aiMove: Move.of("paper") });
    const restored = GameSession.fromHistory([...original.getRounds()], "provocative");
    expect(restored.getWins()).toBe(1);
    expect(restored.getLosses()).toBe(1);
  });
});

describe("GameSession immutability", () => {
  it("getRounds() returns a new array each call", () => {
    const session = GameSession.create("provocative").addRound(defaultRoundParams);
    const r1 = session.getRounds();
    const r2 = session.getRounds();
    expect(r1).not.toBe(r2);
  });

  it("returned RoundData is frozen (mutations throw in strict mode)", () => {
    const session = GameSession.create("provocative").addRound(defaultRoundParams);
    const rounds = session.getRounds();
    expect(() => {
      (rounds[0] as { thought: string }).thought = "mutated";
    }).toThrow();
  });
});

describe("GameSession.checkMilestones", () => {
  it("returns an array", () => {
    const session = GameSession.create("provocative").addRound(defaultRoundParams);
    expect(Array.isArray(session.checkMilestones())).toBe(true);
  });

  it("detects first_win milestone after first win", () => {
    // rock beats scissors = win
    const session = GameSession.create("provocative")
      .addRound({ ...defaultRoundParams, playerMove: Move.of("rock"), aiMove: Move.of("scissors") });
    const milestones = session.checkMilestones();
    expect(milestones.some((m) => m.type === "first_win")).toBe(true);
  });

  it("returns empty array when no milestones apply", () => {
    // A single draw produces no notable milestone
    const session = GameSession.create("provocative")
      .addRound({ ...defaultRoundParams, playerMove: Move.of("rock"), aiMove: Move.of("rock") });
    const milestones = session.checkMilestones();
    expect(milestones.some((m) => m.type === "first_win")).toBe(false);
  });
});
