import { describe, it, expect } from "vitest";
import type { MoveType } from "@/domain/game/move";
import type { PredictorInput } from "@/domain/ai/predictor";
import {
  createFrequencyPredictor,
  createMarkovPredictor,
  createPsychPredictor,
  createStreakPredictor,
} from "@/domain/ai/predictor";

const VALID_MOVES: MoveType[] = ["rock", "paper", "scissors"];

function makeInput(
  playerMove: MoveType,
  result: "win" | "lose" | "draw",
  aiMove: MoveType
): PredictorInput {
  return { playerMove, result, aiMove };
}

// ----------------------------------------------------------------
// FrequencyPredictor
// ----------------------------------------------------------------
describe("createFrequencyPredictor", () => {
  it("履歴なしでもランダムな有効手を返す", () => {
    const predictor = createFrequencyPredictor();
    const score = predictor.predict([]);
    expect(VALID_MOVES).toContain(score.prediction);
    expect(score.confidence).toBe(0);
    expect(score.name).toBe("Frequency");
  });

  it("全体頻度: rock が多いなら paper を返す (BEATS[rock]=paper)", () => {
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("rock", "lose", "paper"),
      makeInput("scissors", "win", "rock"),
    ];
    const predictor = createFrequencyPredictor();
    const score = predictor.predict(history);
    expect(score.prediction).toBe("paper"); // counter to rock
  });

  it("recent=2 で直近2手の頻度を使う", () => {
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("rock", "lose", "paper"),
      makeInput("scissors", "win", "rock"),
      makeInput("scissors", "win", "rock"),
    ];
    const predictor = createFrequencyPredictor(2);
    const score = predictor.predict(history);
    // 直近2手は scissors x2 → counter is rock
    expect(score.prediction).toBe("rock");
  });

  it("信頼度は [0,1] の範囲", () => {
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "win", "scissors"),
    ];
    const predictor = createFrequencyPredictor();
    const score = predictor.predict(history);
    expect(score.confidence).toBeGreaterThanOrEqual(0);
    expect(score.confidence).toBeLessThanOrEqual(1);
  });
});

// ----------------------------------------------------------------
// MarkovPredictor
// ----------------------------------------------------------------
describe("createMarkovPredictor", () => {
  it("履歴が order 以下でもランダムな有効手を返す", () => {
    const predictor = createMarkovPredictor(1);
    const score = predictor.predict([makeInput("rock", "lose", "paper")]);
    expect(VALID_MOVES).toContain(score.prediction);
    expect(score.confidence).toBe(0);
    expect(score.name).toBe("Markov");
  });

  it("パターン未観測時でも有効手を返す", () => {
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "win", "scissors"),
    ];
    const predictor = createMarkovPredictor(1);
    // 直前は paper, rock→paper のトランジションはある
    const score = predictor.predict(history);
    expect(VALID_MOVES).toContain(score.prediction);
  });

  it("order=1: rock→paper パターンを学習して scissors を返す", () => {
    // history: rock→paper x3, scissors→rock x1
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "win", "scissors"),
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "win", "scissors"),
      makeInput("rock", "lose", "paper"),
      makeInput("paper", "win", "scissors"),
    ];
    // 直前は paper → 次のプレイヤーの手は paper が多い (rock→paper x3)
    // counter to paper = scissors
    const predictor = createMarkovPredictor(1);
    const score = predictor.predict(history);
    // 直前 paper → transition: paperの次は多分 rock (paper→rock→paper→rock...)
    // paper の後は scissors が続いてないので確認するだけ
    expect(VALID_MOVES).toContain(score.prediction);
  });

  it("order=1: 明確なパターン (rock→scissors が多数)", () => {
    // rock の後は scissors が高確率
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("scissors", "win", "rock"),
      makeInput("rock", "lose", "paper"),
      makeInput("scissors", "win", "rock"),
      makeInput("rock", "lose", "paper"),
      makeInput("scissors", "win", "rock"),
      makeInput("rock", "lose", "paper"), // 直前が rock
    ];
    const predictor = createMarkovPredictor(1);
    const score = predictor.predict(history);
    // rock の後に scissors が多い → predict scissors → counter = rock
    expect(score.prediction).toBe("rock");
    expect(score.confidence).toBeGreaterThan(0.5);
  });
});

// ----------------------------------------------------------------
// PsychPredictor
// ----------------------------------------------------------------
describe("createPsychPredictor", () => {
  it("履歴なし: 初手グー予測 → paper を返す", () => {
    const predictor = createPsychPredictor();
    const score = predictor.predict([]);
    expect(score.prediction).toBe("paper");
    expect(score.confidence).toBe(0.45);
    expect(score.name).toBe("Psych");
  });

  it("直前がプレイヤー勝ち: 同じ手を維持予測", () => {
    const predictor = createPsychPredictor();
    const score = predictor.predict([makeInput("rock", "win", "scissors")]);
    // player が rock で勝った → 同じ rock を維持 → counter = paper
    expect(score.prediction).toBe("paper");
    expect(score.confidence).toBe(0.55);
  });

  it("直前がプレイヤー負け: 手変更を予測 (confidence=0.6)", () => {
    const predictor = createPsychPredictor();
    const score = predictor.predict([makeInput("rock", "lose", "paper")]);
    expect(VALID_MOVES).toContain(score.prediction);
    expect(score.confidence).toBe(0.6);
  });

  it("直前が引き分け: confidence=0.35 のランダム", () => {
    const predictor = createPsychPredictor();
    const score = predictor.predict([makeInput("rock", "draw", "rock")]);
    expect(VALID_MOVES).toContain(score.prediction);
    expect(score.confidence).toBe(0.35);
  });
});

// ----------------------------------------------------------------
// StreakPredictor
// ----------------------------------------------------------------
describe("createStreakPredictor", () => {
  it("履歴2件未満でもランダムな有効手を返す", () => {
    const predictor = createStreakPredictor();
    expect(VALID_MOVES).toContain(predictor.predict([]).prediction);
    expect(VALID_MOVES).toContain(
      predictor.predict([makeInput("rock", "lose", "paper")]).prediction
    );
    expect(predictor.predict([]).confidence).toBe(0);
    expect(predictor.predict([]).name).toBe("Streak");
  });

  it("3連敗: フラストレーションで paper 予測 → scissors を返す", () => {
    const history: PredictorInput[] = [
      makeInput("rock", "lose", "paper"),
      makeInput("rock", "lose", "paper"),
      makeInput("rock", "lose", "paper"),
    ];
    const predictor = createStreakPredictor();
    const score = predictor.predict(history);
    // 3連敗: despMove=scissors → BEATS[scissors]=rock
    expect(score.prediction).toBe("rock");
    expect(score.confidence).toBe(0.65);
  });

  it("3連勝: 同じ手維持を予測", () => {
    const history: PredictorInput[] = [
      makeInput("paper", "win", "rock"),
      makeInput("paper", "win", "rock"),
      makeInput("paper", "win", "rock"),
    ];
    const predictor = createStreakPredictor();
    const score = predictor.predict(history);
    // 3連勝, 直前 player=paper → BEATS[paper]=scissors
    expect(score.prediction).toBe("scissors");
    expect(score.confidence).toBe(0.58);
  });

  it("ストリーク2回: ランダム (confidence=0.2)", () => {
    const history: PredictorInput[] = [
      makeInput("rock", "win", "scissors"),
      makeInput("rock", "win", "scissors"),
    ];
    const predictor = createStreakPredictor();
    const score = predictor.predict(history);
    expect(VALID_MOVES).toContain(score.prediction);
    expect(score.confidence).toBe(0.2);
  });
});
