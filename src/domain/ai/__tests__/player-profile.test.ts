import { describe, it, expect } from "vitest";
import { buildPlayerProfile, type RoundInput } from "@/domain/ai/player-profile";

describe("buildPlayerProfile with empty array", () => {
  it("空配列でゼロデフォルトを返す", () => {
    const profile = buildPlayerProfile([]);
    expect(profile.moveDistribution).toEqual({ rock: 0, paper: 0, scissors: 0 });
    expect(profile.moveRatios).toEqual({ rock: 0, paper: 0, scissors: 0 });
    expect(profile.afterLoseChangedRate).toBe(0);
    expect(profile.winRate).toBe(0);
    expect(profile.streakInfo).toEqual({ type: null, length: 0 });
  });

  it("空配列でも mostUsedMove は有効な手を返す", () => {
    const profile = buildPlayerProfile([]);
    expect(["rock", "paper", "scissors"]).toContain(profile.mostUsedMove);
  });
});

describe("buildPlayerProfile move distribution", () => {
  it("moveDistribution を正しく計算する", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "rock", result: "lose" },
      { playerMove: "paper", result: "draw" },
      { playerMove: "scissors", result: "win" },
      { playerMove: "rock", result: "lose" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(profile.moveDistribution).toEqual({ rock: 3, paper: 1, scissors: 1 });
  });

  it("moveRatios の合計は1（または空のとき0）になる", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "lose" },
      { playerMove: "scissors", result: "draw" },
      { playerMove: "rock", result: "win" },
    ];
    const profile = buildPlayerProfile(rounds);
    const total = profile.moveRatios.rock + profile.moveRatios.paper + profile.moveRatios.scissors;
    expect(total).toBeCloseTo(1, 5);
  });

  it("moveRatios は moveDistribution を総数で割ったもの", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "lose" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(profile.moveRatios.rock).toBeCloseTo(2 / 3, 5);
    expect(profile.moveRatios.paper).toBeCloseTo(1 / 3, 5);
    expect(profile.moveRatios.scissors).toBeCloseTo(0, 5);
  });
});

describe("buildPlayerProfile afterLoseChangedRate", () => {
  it("負けた後に手を変えた率を正しく計算する", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "lose" },
      { playerMove: "paper", result: "win" },  // changed after lose
      { playerMove: "paper", result: "lose" },
      { playerMove: "paper", result: "win" },  // NOT changed after lose
    ];
    const profile = buildPlayerProfile(rounds);
    // 2回負けた後：1回変えた、1回変えなかった → 0.5
    expect(profile.afterLoseChangedRate).toBeCloseTo(0.5, 5);
  });

  it("負けが一度もない場合は0を返す", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "win" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(profile.afterLoseChangedRate).toBe(0);
  });

  it("最後のラウンドが負けでも次の手がなければカウントしない", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "lose" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(profile.afterLoseChangedRate).toBe(0);
  });
});

describe("buildPlayerProfile winRate", () => {
  it("winRate を正しく計算する", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "lose" },
      { playerMove: "scissors", result: "win" },
      { playerMove: "rock", result: "draw" },
    ];
    const profile = buildPlayerProfile(rounds);
    // 2勝4試合 = 0.5
    expect(profile.winRate).toBeCloseTo(0.5, 5);
  });

  it("全勝なら1.0", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "win" },
    ];
    expect(buildPlayerProfile(rounds).winRate).toBeCloseTo(1.0, 5);
  });

  it("全敗なら0.0", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "lose" },
      { playerMove: "paper", result: "lose" },
    ];
    expect(buildPlayerProfile(rounds).winRate).toBeCloseTo(0.0, 5);
  });
});

describe("buildPlayerProfile mostUsedMove", () => {
  it("最も多く使った手を返す", () => {
    const rounds: RoundInput[] = [
      { playerMove: "scissors", result: "win" },
      { playerMove: "scissors", result: "lose" },
      { playerMove: "rock", result: "draw" },
      { playerMove: "scissors", result: "win" },
      { playerMove: "paper", result: "lose" },
    ];
    expect(buildPlayerProfile(rounds).mostUsedMove).toBe("scissors");
  });

  it("同数の場合でも有効な手を返す", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "lose" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(["rock", "paper", "scissors"]).toContain(profile.mostUsedMove);
  });
});

describe("buildPlayerProfile streakInfo", () => {
  it("現在の連勝ストリークを検出する", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "lose" },
      { playerMove: "paper", result: "win" },
      { playerMove: "scissors", result: "win" },
      { playerMove: "rock", result: "win" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(profile.streakInfo).toEqual({ type: "win", length: 3 });
  });

  it("現在の連敗ストリークを検出する", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "lose" },
      { playerMove: "scissors", result: "lose" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(profile.streakInfo).toEqual({ type: "lose", length: 2 });
  });

  it("ストリークなし（直前が引き分け後に変化）", () => {
    const rounds: RoundInput[] = [
      { playerMove: "rock", result: "win" },
      { playerMove: "paper", result: "draw" },
    ];
    const profile = buildPlayerProfile(rounds);
    expect(profile.streakInfo).toEqual({ type: "draw", length: 1 });
  });

  it("空配列では type=null, length=0", () => {
    const profile = buildPlayerProfile([]);
    expect(profile.streakInfo).toEqual({ type: null, length: 0 });
  });
});
