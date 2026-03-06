import { describe, it, expect } from "vitest";
import {
  computePhase,
  getPhaseParams,
  type RoundAccuracy,
} from "@/domain/game/game-phase";

describe("computePhase", () => {
  it("empty history returns 'opening'", () => {
    expect(computePhase([], 0)).toBe("opening");
  });

  it("low accuracy (< 0.5) stays in 'opening'", () => {
    const rounds: RoundAccuracy[] = [
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
    ];
    expect(computePhase(rounds, 5)).toBe("opening");
  });

  it("transitions to 'midgame' when accuracy > 0.5 in window of 5", () => {
    const rounds: RoundAccuracy[] = [
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
    ];
    // accuracy = 3/5 = 0.6 > 0.5, but not > 0.65
    expect(computePhase(rounds, 5)).toBe("midgame");
  });

  it("transitions to 'endgame' when accuracy > 0.65", () => {
    const rounds: RoundAccuracy[] = [
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: false },
    ];
    // accuracy = 4/5 = 0.8 > 0.65
    expect(computePhase(rounds, 5)).toBe("endgame");
  });

  it("transitions to 'endgame' when round >= 25", () => {
    const rounds: RoundAccuracy[] = Array(5).fill({ aiPredictedCorrectly: false });
    expect(computePhase(rounds, 25)).toBe("endgame");
  });

  it("phase transitions are one-directional (cannot go back from midgame to opening)", () => {
    // After reaching midgame, even if accuracy drops, phase stays at least midgame
    const history: RoundAccuracy[] = [
      // First 5 rounds: accuracy = 3/5 = 0.6 → midgame
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: true },
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
      // Next rounds: all wrong, last window accuracy = 0/5 = 0 → would be opening without monotone
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
      { aiPredictedCorrectly: false },
    ];
    // At round 10, last 5 are all false → but phase should be at least midgame
    expect(computePhase(history, 10)).toBe("midgame");
  });
});

describe("getPhaseParams", () => {
  it("returns correct params for 'opening'", () => {
    const params = getPhaseParams("opening");
    expect(params).toEqual({
      predictionWeight: 0.3,
      bluffRate: 0.15,
      readablePatternStrength: 0.4,
    });
  });

  it("returns correct params for 'midgame'", () => {
    const params = getPhaseParams("midgame");
    expect(params).toEqual({
      predictionWeight: 0.7,
      bluffRate: 0.1,
      readablePatternStrength: 0.2,
    });
  });

  it("returns correct params for 'endgame'", () => {
    const params = getPhaseParams("endgame");
    expect(params).toEqual({
      predictionWeight: 1.0,
      bluffRate: 0.0,
      readablePatternStrength: 0.0,
    });
  });

  it("returns a copy (mutating result does not affect next call)", () => {
    const params = getPhaseParams("opening");
    params.predictionWeight = 999;
    const params2 = getPhaseParams("opening");
    expect(params2.predictionWeight).toBe(0.3);
  });
});
