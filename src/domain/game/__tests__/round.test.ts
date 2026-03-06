import { describe, it, expect } from "vitest";
import { Round } from "@/domain/game/round";
import { Move } from "@/domain/game/move";

describe("Round.create", () => {
  const baseParams = {
    roundNumber: 1,
    playerMove: Move.of("rock"),
    aiMove: Move.of("scissors"),
    thought: "AI予測テスト",
    phase: "opening" as const,
    aiPredictedCorrectly: false,
  };

  it("creates a round with all valid params", () => {
    const round = Round.create(baseParams);
    expect(round).toBeDefined();
  });

  it("roundNumber getter returns correct value", () => {
    const round = Round.create(baseParams);
    expect(round.roundNumber).toBe(1);
  });

  it("playerMove getter returns the MoveType", () => {
    const round = Round.create(baseParams);
    expect(round.playerMove).toBe("rock");
  });

  it("aiMove getter returns the MoveType", () => {
    const round = Round.create(baseParams);
    expect(round.aiMove).toBe("scissors");
  });

  it("result is auto-computed: player rock vs ai scissors = win", () => {
    const round = Round.create(baseParams);
    expect(round.result).toBe("win");
  });

  it("result is auto-computed: player rock vs ai paper = lose", () => {
    const round = Round.create({
      ...baseParams,
      playerMove: Move.of("rock"),
      aiMove: Move.of("paper"),
    });
    expect(round.result).toBe("lose");
  });

  it("result is auto-computed: player rock vs ai rock = draw", () => {
    const round = Round.create({
      ...baseParams,
      playerMove: Move.of("rock"),
      aiMove: Move.of("rock"),
    });
    expect(round.result).toBe("draw");
  });

  it("thought getter returns correct value", () => {
    const round = Round.create(baseParams);
    expect(round.thought).toBe("AI予測テスト");
  });

  it("phase getter returns correct value", () => {
    const round = Round.create(baseParams);
    expect(round.phase).toBe("opening");
  });

  it("aiPredictedCorrectly getter returns correct value", () => {
    const round = Round.create(baseParams);
    expect(round.aiPredictedCorrectly).toBe(false);
  });

  it("aiPredictedCorrectly returns true when set to true", () => {
    const round = Round.create({ ...baseParams, aiPredictedCorrectly: true });
    expect(round.aiPredictedCorrectly).toBe(true);
  });
});

describe("Round immutability", () => {
  const baseParams = {
    roundNumber: 1,
    playerMove: Move.of("rock"),
    aiMove: Move.of("scissors"),
    thought: "テスト",
    phase: "opening" as const,
    aiPredictedCorrectly: false,
  };

  it("data getter returns a frozen copy (mutations do not affect internal state)", () => {
    const round = Round.create(baseParams);
    const data = round.data;
    // attempt to mutate the returned data
    try {
      (data as { thought: string }).thought = "mutated";
    } catch {
      // strict mode throws on frozen object mutation
    }
    // internal state must remain unchanged
    expect(round.thought).toBe("テスト");
  });

  it("data getter returns a new object each call (not shared reference)", () => {
    const round = Round.create(baseParams);
    const data1 = round.data;
    const data2 = round.data;
    expect(data1).not.toBe(data2);
  });
});
