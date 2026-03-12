import { describe, it, expect } from "vitest";
import type { PredictorInput } from "@/domain/ai/predictor";
import { getPersonality } from "@/domain/ai/ai-personality";
import { determineSituation, generateThought } from "@/domain/ai/thought-generator";

function makeInput(
  playerMove: "rock" | "paper" | "scissors",
  result: "win" | "lose" | "draw",
  aiMove: "rock" | "paper" | "scissors"
): PredictorInput {
  return { playerMove, result, aiMove };
}

// ----------------------------------------------------------------
// determineSituation
// ----------------------------------------------------------------
describe("determineSituation", () => {
  it("履歴なし → opening", () => {
    expect(determineSituation([])).toBe("opening");
  });

  it("直近3手がすべて player=lose (AI連勝) → winning_streak", () => {
    // 手がバラバラ (player_predictable にならない) で3連敗
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "lose", "scissors"),
      makeInput("scissors", "lose", "rock"),
    ];
    expect(determineSituation(history)).toBe("winning_streak");
  });

  it("直近3手がすべて player=win (AI連敗) → losing_streak", () => {
    // 手がバラバラ (player_predictable にならない) で3連勝
    const history: PredictorInput[] = [
      makeInput("paper", "win", "rock"),
      makeInput("scissors", "win", "paper"),
      makeInput("rock", "win", "scissors"),
    ];
    expect(determineSituation(history)).toBe("losing_streak");
  });

  it("win rate > 0.65 → dominating (AI視点: player win rate < 0.35 = AI dominating)", () => {
    // player の負けが多い = AI が優位 = dominating
    // 10手中 player win が 2 (20%) → AI win rate が 80% → dominating
    const history: PredictorInput[] = Array(8)
      .fill(makeInput("rock", "lose", "paper"))
      .concat(Array(2).fill(makeInput("paper", "win", "rock")));
    expect(determineSituation(history)).toBe("dominating");
  });

  it("win rate < 0.35 → being_dominated (player win rate > 0.65)", () => {
    // player が多く勝っている = AI が負けている = being_dominated
    const history: PredictorInput[] = Array(8)
      .fill(makeInput("paper", "win", "rock"))
      .concat(Array(2).fill(makeInput("rock", "lose", "paper")));
    expect(determineSituation(history)).toBe("being_dominated");
  });

  it("win rate 0.45-0.55 → close_game", () => {
    // 手をバラバラにして player_predictable にならないよう注意
    // win/lose 交互 10手 → win rate = 50%
    const history: PredictorInput[] = [
      makeInput("rock", "win", "scissors"),
      makeInput("paper", "lose", "scissors"),
      makeInput("scissors", "win", "paper"),
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "win", "rock"),
      makeInput("scissors", "lose", "rock"),
      makeInput("rock", "win", "scissors"),
      makeInput("paper", "lose", "scissors"),
      makeInput("scissors", "win", "paper"),
      makeInput("rock", "lose", "paper"),
    ];
    expect(determineSituation(history)).toBe("close_game");
  });

  it("history.length >= 25 → endgame", () => {
    const history: PredictorInput[] = Array(25).fill(makeInput("rock", "draw", "rock"));
    expect(determineSituation(history)).toBe("endgame");
  });

  it("直近3手同じ手 → player_predictable", () => {
    const history: PredictorInput[] = [
      makeInput("scissors", "win", "rock"),
      makeInput("rock", "draw", "rock"),
      makeInput("rock", "lose", "paper"),
      makeInput("rock", "lose", "paper"),
      makeInput("rock", "lose", "paper"),
    ];
    expect(determineSituation(history)).toBe("player_predictable");
  });

  it("win rate 0.4 → player_unpredictable", () => {
    // win:2, lose:3 → winRate 0.4 → player_unpredictable
    // 手がバラバラで streak もなし
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "win", "rock"),
      makeInput("scissors", "lose", "rock"),
      makeInput("rock", "win", "scissors"),
      makeInput("paper", "lose", "scissors"),
    ];
    expect(determineSituation(history)).toBe("player_unpredictable");
  });
});

// ----------------------------------------------------------------
// generateThought
// ----------------------------------------------------------------
describe("generateThought", () => {
  it("文字列を返す", () => {
    const personality = getPersonality("analytical");
    const result = generateThought(personality, [], "test reason", "win");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("provocative personality は provocative のテンプレートから返す", () => {
    const personality = getPersonality("provocative");
    const allTemplates = Object.values(personality.thoughtTemplates).flatMap(
      (rt) => [...rt.win, ...rt.lose, ...rt.draw]
    );
    const result = generateThought(personality, [], "reason", "draw");
    expect(allTemplates).toContain(result);
  });

  it("analytical personality は analytical のテンプレートから返す", () => {
    const personality = getPersonality("analytical");
    const allTemplates = Object.values(personality.thoughtTemplates).flatMap(
      (rt) => [...rt.win, ...rt.lose, ...rt.draw]
    );
    const result = generateThought(personality, [], "reason", "lose");
    expect(allTemplates).toContain(result);
  });

  it("uncanny personality は uncanny のテンプレートから返す", () => {
    const personality = getPersonality("uncanny");
    const allTemplates = Object.values(personality.thoughtTemplates).flatMap(
      (rt) => [...rt.win, ...rt.lose, ...rt.draw]
    );
    const result = generateThought(personality, [], "reason", "win");
    expect(allTemplates).toContain(result);
  });

  it("異なるパーソナリティは異なるテンプレートプールを使う", () => {
    const provocative = getPersonality("provocative");
    const analytical = getPersonality("analytical");
    const provocativeTemplates = Object.values(provocative.thoughtTemplates).flatMap(
      (rt) => [...rt.win, ...rt.lose, ...rt.draw]
    );
    const analyticalTemplates = Object.values(analytical.thoughtTemplates).flatMap(
      (rt) => [...rt.win, ...rt.lose, ...rt.draw]
    );
    const hasOverlap = provocativeTemplates.some((t) => analyticalTemplates.includes(t));
    expect(hasOverlap).toBe(false);
  });

  it("winning_streak 状況では winning_streak テンプレートを使う", () => {
    const personality = getPersonality("provocative");
    // 手がバラバラで3連敗 (player_predictable にならない)
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "lose", "scissors"),
      makeInput("scissors", "lose", "rock"),
    ];
    const result = generateThought(personality, history, "reason", "lose");
    expect(personality.thoughtTemplates.winning_streak.lose).toContain(result);
  });

  it("opening 状況では opening テンプレートを使う", () => {
    const personality = getPersonality("uncanny");
    const result = generateThought(personality, [], "reason", "win");
    expect(personality.thoughtTemplates.opening.win).toContain(result);
  });

  it("returns result-appropriate template for each result type", () => {
    const personality = getPersonality("provocative");
    const winResult = generateThought(personality, [], "", "win");
    expect(personality.thoughtTemplates.opening.win).toContain(winResult);

    const loseResult = generateThought(personality, [], "", "lose");
    expect(personality.thoughtTemplates.opening.lose).toContain(loseResult);

    const drawResult = generateThought(personality, [], "", "draw");
    expect(personality.thoughtTemplates.opening.draw).toContain(drawResult);
  });
});
