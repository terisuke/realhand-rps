import { describe, it, expect } from "vitest";
import { detectMilestones } from "@/domain/game/milestone";

type SimpleRound = { result: "win" | "lose" | "draw"; roundNumber: number };

function rounds(results: Array<"win" | "lose" | "draw">): SimpleRound[] {
  return results.map((result, i) => ({ result, roundNumber: i + 1 }));
}

describe("detectMilestones - first_win", () => {
  it("detects first_win on the first win", () => {
    const r = rounds(["win"]);
    const milestones = detectMilestones(r);
    expect(milestones.some((m) => m.type === "first_win")).toBe(true);
  });

  it("first_win message is correct", () => {
    const r = rounds(["win"]);
    const m = detectMilestones(r).find((m) => m.type === "first_win");
    expect(m?.message).toBe("初勝利！AIを出し抜いた！");
  });

  it("does not detect first_win if no wins", () => {
    const r = rounds(["lose", "draw"]);
    const milestones = detectMilestones(r);
    expect(milestones.some((m) => m.type === "first_win")).toBe(false);
  });

  it("does not repeat first_win after second win", () => {
    const r = rounds(["win", "win"]);
    // first_win should only appear once (for the first win)
    const milestones = detectMilestones(r);
    expect(milestones.filter((m) => m.type === "first_win").length).toBeLessThanOrEqual(1);
  });
});

describe("detectMilestones - three_streak_win", () => {
  it("detects three_streak_win after 3 consecutive wins", () => {
    const r = rounds(["win", "win", "win"]);
    const milestones = detectMilestones(r);
    expect(milestones.some((m) => m.type === "three_streak_win")).toBe(true);
  });

  it("three_streak_win message is correct", () => {
    const r = rounds(["win", "win", "win"]);
    const m = detectMilestones(r).find((m) => m.type === "three_streak_win");
    expect(m?.message).toBe("3連勝！AIが焦り始めている...");
  });

  it("does not detect three_streak_win without streak", () => {
    const r = rounds(["win", "lose", "win"]);
    expect(milestones_of_type(r, "three_streak_win")).toBe(false);
  });
});

describe("detectMilestones - three_streak_lose", () => {
  it("detects three_streak_lose after 3 consecutive losses", () => {
    const r = rounds(["lose", "lose", "lose"]);
    const milestones = detectMilestones(r);
    expect(milestones.some((m) => m.type === "three_streak_lose")).toBe(true);
  });

  it("three_streak_lose message is correct", () => {
    const r = rounds(["lose", "lose", "lose"]);
    const m = detectMilestones(r).find((m) => m.type === "three_streak_lose");
    expect(m?.message).toBe("3連敗...AIに読まれている");
  });

  it("does not detect three_streak_lose without streak", () => {
    const r = rounds(["lose", "win", "lose"]);
    expect(milestones_of_type(r, "three_streak_lose")).toBe(false);
  });
});

describe("detectMilestones - five_rounds", () => {
  it("detects five_rounds at round 5", () => {
    const r = rounds(["win", "lose", "draw", "win", "lose"]);
    expect(milestones_of_type(r, "five_rounds")).toBe(true);
  });

  it("detects five_rounds at round 10", () => {
    const r = rounds(Array(10).fill("draw") as Array<"draw">);
    expect(milestones_of_type(r, "five_rounds")).toBe(true);
  });

  it("does not detect five_rounds at round 4", () => {
    const r = rounds(["win", "lose", "draw", "win"]);
    expect(milestones_of_type(r, "five_rounds")).toBe(false);
  });
});

describe("detectMilestones - ai_dominance", () => {
  it("detects ai_dominance when AI wins 5+ more than player", () => {
    const r = rounds(["lose", "lose", "lose", "lose", "lose"]);
    expect(milestones_of_type(r, "ai_dominance")).toBe(true);
  });

  it("ai_dominance message is correct", () => {
    const r = rounds(["lose", "lose", "lose", "lose", "lose"]);
    const m = detectMilestones(r).find((m) => m.type === "ai_dominance");
    expect(m?.message).toBe("AIが大きくリード。パターンを変えて！");
  });

  it("does not detect ai_dominance if difference is less than 5", () => {
    const r = rounds(["lose", "lose", "lose", "lose"]);
    expect(milestones_of_type(r, "ai_dominance")).toBe(false);
  });
});

describe("detectMilestones - player_dominance", () => {
  it("detects player_dominance when player wins 5+ more than AI", () => {
    const r = rounds(["win", "win", "win", "win", "win"]);
    expect(milestones_of_type(r, "player_dominance")).toBe(true);
  });

  it("player_dominance message is correct", () => {
    const r = rounds(["win", "win", "win", "win", "win"]);
    const m = detectMilestones(r).find((m) => m.type === "player_dominance");
    expect(m?.message).toBe("あなたがリード！AIが対策を練っている...");
  });
});

describe("detectMilestones - halfway and final_stretch", () => {
  it("detects halfway at round 15", () => {
    const r = rounds(Array(15).fill("draw") as Array<"draw">);
    expect(milestones_of_type(r, "halfway")).toBe(true);
  });

  it("detects final_stretch at round 25", () => {
    const r = rounds(Array(25).fill("draw") as Array<"draw">);
    expect(milestones_of_type(r, "final_stretch")).toBe(true);
  });
});

describe("detectMilestones - atRound", () => {
  it("sets atRound correctly for first_win", () => {
    const r = rounds(["draw", "win"]);
    const m = detectMilestones(r).find((m) => m.type === "first_win");
    expect(m?.atRound).toBe(2);
  });
});

function milestones_of_type(
  r: SimpleRound[],
  type: string
): boolean {
  return detectMilestones(r).some((m) => m.type === type);
}
