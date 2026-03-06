import { describe, it, expect } from "vitest";
import {
  getReadableBias,
  applyBias,
  type ReadableBias,
} from "@/domain/ai/readable-pattern";

describe("getReadableBias - opening phase", () => {
  it("paper に +0.15 のバイアスがある", () => {
    const bias = getReadableBias("opening");
    expect(bias.paper).toBeCloseTo(0.15, 5);
  });

  it("rock と scissors のバイアスは 0", () => {
    const bias = getReadableBias("opening");
    expect(bias.rock).toBeCloseTo(0, 5);
    expect(bias.scissors).toBeCloseTo(0, 5);
  });

  it("lastAiMove がない場合でも paper バイアスを返す", () => {
    const bias = getReadableBias("opening", undefined);
    expect(bias.paper).toBeCloseTo(0.15, 5);
  });
});

describe("getReadableBias - midgame phase", () => {
  it("lastAiMove が rock なら rock に +0.1 バイアス", () => {
    const bias = getReadableBias("midgame", "rock");
    expect(bias.rock).toBeCloseTo(0.1, 5);
    expect(bias.paper).toBeCloseTo(0, 5);
    expect(bias.scissors).toBeCloseTo(0, 5);
  });

  it("lastAiMove が paper なら paper に +0.1 バイアス", () => {
    const bias = getReadableBias("midgame", "paper");
    expect(bias.paper).toBeCloseTo(0.1, 5);
    expect(bias.rock).toBeCloseTo(0, 5);
    expect(bias.scissors).toBeCloseTo(0, 5);
  });

  it("lastAiMove が scissors なら scissors に +0.1 バイアス", () => {
    const bias = getReadableBias("midgame", "scissors");
    expect(bias.scissors).toBeCloseTo(0.1, 5);
    expect(bias.rock).toBeCloseTo(0, 5);
    expect(bias.paper).toBeCloseTo(0, 5);
  });

  it("lastAiMove がない場合はゼロバイアス", () => {
    const bias = getReadableBias("midgame");
    expect(bias.rock).toBeCloseTo(0, 5);
    expect(bias.paper).toBeCloseTo(0, 5);
    expect(bias.scissors).toBeCloseTo(0, 5);
  });
});

describe("getReadableBias - endgame phase", () => {
  it("すべてゼロバイアスを返す", () => {
    const bias = getReadableBias("endgame");
    expect(bias.rock).toBeCloseTo(0, 5);
    expect(bias.paper).toBeCloseTo(0, 5);
    expect(bias.scissors).toBeCloseTo(0, 5);
  });

  it("lastAiMove があってもゼロバイアス", () => {
    const bias = getReadableBias("endgame", "rock");
    expect(bias.rock).toBeCloseTo(0, 5);
    expect(bias.paper).toBeCloseTo(0, 5);
    expect(bias.scissors).toBeCloseTo(0, 5);
  });
});

describe("getReadableBias - bias values are reasonable", () => {
  it("すべてのバイアス値は 0〜0.2 の範囲内", () => {
    const phases = ["opening", "midgame", "endgame"] as const;
    const moves = ["rock", "paper", "scissors"] as const;

    for (const phase of phases) {
      for (const lastMove of moves) {
        const bias = getReadableBias(phase, lastMove);
        expect(bias.rock).toBeGreaterThanOrEqual(0);
        expect(bias.rock).toBeLessThanOrEqual(0.2);
        expect(bias.paper).toBeGreaterThanOrEqual(0);
        expect(bias.paper).toBeLessThanOrEqual(0.2);
        expect(bias.scissors).toBeGreaterThanOrEqual(0);
        expect(bias.scissors).toBeLessThanOrEqual(0.2);
      }
    }
  });
});

describe("applyBias", () => {
  it("ベースウェイトにバイアスを加算する", () => {
    const baseWeights = { rock: 1.0, paper: 1.0, scissors: 1.0 };
    const bias: ReadableBias = { rock: 0, paper: 0.15, scissors: 0 };
    const result = applyBias(baseWeights, bias);
    expect(result.rock).toBeCloseTo(1.0, 5);
    expect(result.paper).toBeCloseTo(1.15, 5);
    expect(result.scissors).toBeCloseTo(1.0, 5);
  });

  it("元のオブジェクトをミューテーションしない", () => {
    const baseWeights = { rock: 1.0, paper: 1.0, scissors: 1.0 };
    const bias: ReadableBias = { rock: 0.1, paper: 0.0, scissors: 0.0 };
    applyBias(baseWeights, bias);
    expect(baseWeights.rock).toBeCloseTo(1.0, 5);
  });

  it("ゼロバイアスではベースウェイトをそのまま返す", () => {
    const baseWeights = { rock: 2.5, paper: 1.3, scissors: 0.7 };
    const bias: ReadableBias = { rock: 0, paper: 0, scissors: 0 };
    const result = applyBias(baseWeights, bias);
    expect(result.rock).toBeCloseTo(2.5, 5);
    expect(result.paper).toBeCloseTo(1.3, 5);
    expect(result.scissors).toBeCloseTo(0.7, 5);
  });
});
