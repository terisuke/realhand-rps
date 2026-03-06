import { describe, it, expect } from "vitest";
import {
  classifyGesture,
  stabilityScore,
  type Landmark,
} from "@/domain/input/gesture-classifier";

// Helper: build 21 landmarks all at (0,0,0)
function makeLandmarks(overrides: Record<number, Partial<Landmark>> = {}): Landmark[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: 0,
    y: 0,
    z: 0,
    ...overrides[i],
  }));
}

// Rock: all fingers curled (tip.y > pip.y, thumb: tip.x > pip.x)
function rockLandmarks(): Landmark[] {
  return makeLandmarks({
    // thumb curled: tip.x > pip.x
    3: { x: 0.3, y: 0.5 },
    4: { x: 0.4, y: 0.5 },
    // index curled: tip.y > pip.y
    6: { x: 0, y: 0.3 },
    8: { x: 0, y: 0.5 },
    // middle curled
    10: { x: 0, y: 0.3 },
    12: { x: 0, y: 0.5 },
    // ring curled
    14: { x: 0, y: 0.3 },
    16: { x: 0, y: 0.5 },
    // pinky curled
    18: { x: 0, y: 0.3 },
    20: { x: 0, y: 0.5 },
  });
}

// Paper: all 4 fingers extended (tip.y < pip.y)
function paperLandmarks(): Landmark[] {
  return makeLandmarks({
    // thumb (doesn't matter for paper count)
    3: { x: 0.4, y: 0.5 },
    4: { x: 0.3, y: 0.5 },
    // index extended
    6: { x: 0, y: 0.5 },
    8: { x: 0, y: 0.3 },
    // middle extended
    10: { x: 0, y: 0.5 },
    12: { x: 0, y: 0.3 },
    // ring extended
    14: { x: 0, y: 0.5 },
    16: { x: 0, y: 0.3 },
    // pinky extended
    18: { x: 0, y: 0.5 },
    20: { x: 0, y: 0.3 },
  });
}

// Scissors: index + middle extended, ring + pinky curled
function scissorsLandmarks(): Landmark[] {
  return makeLandmarks({
    // index extended
    6: { x: 0, y: 0.5 },
    8: { x: 0, y: 0.3 },
    // middle extended
    10: { x: 0, y: 0.5 },
    12: { x: 0, y: 0.3 },
    // ring curled
    14: { x: 0, y: 0.3 },
    16: { x: 0, y: 0.5 },
    // pinky curled
    18: { x: 0, y: 0.3 },
    20: { x: 0, y: 0.5 },
  });
}

describe("classifyGesture", () => {
  it("returns null for empty array", () => {
    expect(classifyGesture([])).toBeNull();
  });

  it("returns null for fewer than 21 landmarks", () => {
    expect(classifyGesture(Array(20).fill({ x: 0, y: 0, z: 0 }))).toBeNull();
  });

  it("returns 'rock' for all fingers curled", () => {
    expect(classifyGesture(rockLandmarks())).toBe("rock");
  });

  it("returns 'paper' for all fingers extended", () => {
    expect(classifyGesture(paperLandmarks())).toBe("paper");
  });

  it("returns 'scissors' for index + middle only extended", () => {
    expect(classifyGesture(scissorsLandmarks())).toBe("scissors");
  });

  it("returns null for ambiguous gesture (only ring extended)", () => {
    // only ring extended — doesn't match rock, paper, or scissors
    const ambiguous = makeLandmarks({
      // index curled
      6: { x: 0, y: 0.3 },
      8: { x: 0, y: 0.5 },
      // middle curled
      10: { x: 0, y: 0.3 },
      12: { x: 0, y: 0.5 },
      // ring extended
      14: { x: 0, y: 0.5 },
      16: { x: 0, y: 0.3 },
      // pinky curled
      18: { x: 0, y: 0.3 },
      20: { x: 0, y: 0.5 },
    });
    expect(classifyGesture(ambiguous)).toBeNull();
  });
});

describe("stabilityScore", () => {
  it("returns 0 when previous is null", () => {
    const landmarks = makeLandmarks();
    expect(stabilityScore(landmarks, null)).toBe(0);
  });

  it("returns 1 for identical landmarks", () => {
    const landmarks = makeLandmarks();
    expect(stabilityScore(landmarks, landmarks)).toBe(1);
  });

  it("returns between 0 and 1 for slightly different landmarks", () => {
    const current = makeLandmarks({ 0: { x: 0.005, y: 0.005 } });
    const previous = makeLandmarks({ 0: { x: 0, y: 0 } });
    const score = stabilityScore(current, previous);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("returns 0 when landmarks are very different", () => {
    const current = makeLandmarks({ 0: { x: 1, y: 1 } });
    const previous = makeLandmarks({ 0: { x: 0, y: 0 } });
    const score = stabilityScore(current, previous);
    expect(score).toBe(0);
  });
});
