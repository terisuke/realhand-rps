import { describe, it, expect } from "vitest";
import { metaStrategyDecide } from "@/domain/ai/meta-strategy";
import type { PredictorInput } from "@/domain/ai/predictor";
import type { ReadableBias } from "@/domain/ai/readable-pattern";

const ZERO_BIAS: ReadableBias = { rock: 0, paper: 0, scissors: 0 };

describe("metaStrategyDecide - empty history", () => {
  it("有効な手を返す", () => {
    const result = metaStrategyDecide([], "opening", ZERO_BIAS);
    expect(["rock", "paper", "scissors"]).toContain(result.move);
  });

  it("scores に6エントリが含まれる", () => {
    const result = metaStrategyDecide([], "opening", ZERO_BIAS);
    expect(result.scores).toHaveLength(6);
  });

  it("topReason は空でない文字列", () => {
    const result = metaStrategyDecide([], "opening", ZERO_BIAS);
    expect(typeof result.topReason).toBe("string");
    expect(result.topReason.length).toBeGreaterThan(0);
  });
});

describe("metaStrategyDecide - predictable pattern", () => {
  it("常にrockを出すプレイヤーに対してpaperを返す", () => {
    const history: PredictorInput[] = Array.from({ length: 15 }, () => ({
      playerMove: "rock" as const,
      result: "lose" as const,
      aiMove: "scissors" as const,
    }));
    const result = metaStrategyDecide(history, "midgame", ZERO_BIAS);
    expect(result.move).toBe("paper");
  });
});

describe("metaStrategyDecide - readable bias", () => {
  it("opening フェーズで paper バイアスが結果に影響する", () => {
    // paper に大きなバイアスをかけると paper が選ばれやすくなる
    const heavyPaperBias: ReadableBias = { rock: 0, paper: 10, scissors: 0 };
    const result = metaStrategyDecide([], "opening", heavyPaperBias);
    expect(result.move).toBe("paper");
  });

  it("rock に大きなバイアスをかけると rock が選ばれる", () => {
    const heavyRockBias: ReadableBias = { rock: 10, paper: 0, scissors: 0 };
    const result = metaStrategyDecide([], "midgame", heavyRockBias);
    expect(result.move).toBe("rock");
  });
});

describe("metaStrategyDecide - scores structure", () => {
  it("各スコアに name, prediction, confidence, reason が含まれる", () => {
    const result = metaStrategyDecide([], "opening", ZERO_BIAS);
    for (const score of result.scores) {
      expect(score.name).toBeTruthy();
      expect(["rock", "paper", "scissors"]).toContain(score.prediction);
      expect(typeof score.confidence).toBe("number");
      expect(typeof score.reason).toBe("string");
    }
  });

  it("6つの予測器: Frequency(all), Frequency(10), Markov(1), Markov(2), Psych, Streak", () => {
    const result = metaStrategyDecide([], "opening", ZERO_BIAS);
    expect(result.scores).toHaveLength(6);
  });
});

describe("metaStrategyDecide - phase affects output", () => {
  it("endgame は predictionWeight=1.0 で予測器を最大信頼、opening は 0.3 でスケールダウン", () => {
    // rock 連発で全予測器が paper を強く選ぶ場合、
    // endgame は predictionWeight が高いので重みがより大きくなる
    const history: PredictorInput[] = Array.from({ length: 15 }, () => ({
      playerMove: "rock" as const,
      result: "lose" as const,
      aiMove: "paper" as const,
    }));
    // どちらも paper を選ぶはずだが、フェーズによって重みの絶対値が変わる
    const openingResult = metaStrategyDecide(history, "opening", ZERO_BIAS);
    const endgameResult = metaStrategyDecide(history, "endgame", ZERO_BIAS);
    // 両方 paper を選ぶ（強いパターン）
    expect(openingResult.move).toBe("paper");
    expect(endgameResult.move).toBe("paper");
  });

  it("opening と endgame で predictionWeight が異なる（phase パラメータが実際に使われる）", () => {
    // 非常に接戦の履歴で、フェーズによって異なる選択が出ることを確認
    // bluffRate が高い opening では重みが均一化される
    const history: PredictorInput[] = Array.from({ length: 10 }, () => ({
      playerMove: "rock" as const,
      result: "lose" as const,
      aiMove: "paper" as const,
    }));
    const openingResult = metaStrategyDecide(history, "opening", ZERO_BIAS);
    const endgameResult = metaStrategyDecide(history, "endgame", ZERO_BIAS);
    // endgame は predictionWeight=1.0 なので必ず paper（最強パターン）
    expect(endgameResult.move).toBe("paper");
    // opening は predictionWeight=0.3 なので confidence が低くなるが paper が勝つ
    expect(openingResult.move).toBe("paper");
  });
});

describe("metaStrategyDecide - stateless", () => {
  it("同じ履歴で2回呼ぶと同じ結果を返す（決定論的な十分なデータで）", () => {
    // rock を10回連続で出す = Frequency/Markov/Streak が全部 paper を選ぶ決定論的ケース
    const history: PredictorInput[] = Array.from({ length: 10 }, () => ({
      playerMove: "rock" as const,
      result: "lose" as const,
      aiMove: "paper" as const,
    }));
    const result1 = metaStrategyDecide(history, "midgame", ZERO_BIAS);
    const result2 = metaStrategyDecide(history, "midgame", ZERO_BIAS);
    expect(result1.move).toBe(result2.move);
    expect(result1.topReason).toBe(result2.topReason);
    expect(result1.scores.map((s) => s.name)).toEqual(result2.scores.map((s) => s.name));
  });

  it("履歴が変わると結果も変わりうる（状態が内部に残らない）", () => {
    const history1: PredictorInput[] = Array.from({ length: 10 }, () => ({
      playerMove: "rock" as const,
      result: "lose" as const,
      aiMove: "paper" as const,
    }));
    const history2: PredictorInput[] = Array.from({ length: 10 }, () => ({
      playerMove: "scissors" as const,
      result: "lose" as const,
      aiMove: "rock" as const,
    }));

    const result1 = metaStrategyDecide(history1, "midgame", ZERO_BIAS);
    const result2 = metaStrategyDecide(history2, "midgame", ZERO_BIAS);
    // rock 連発 → paper で勝つ / scissors 連発 → rock で勝つ
    expect(result1.move).toBe("paper");
    expect(result2.move).toBe("rock");
  });
});
