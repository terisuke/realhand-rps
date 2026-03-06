import type { Move, MatchRecord, PredictorScore } from "@/types";

const MOVES: Move[] = ["rock", "paper", "scissors"];

/** playerMove を出されたとき AI が勝つ手を返す */
const BEATS: Record<Move, Move> = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
};

/** 乱数選択 */
function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * 3)];
}

// -------------------------------------------------------------------
// 予測器群
// -------------------------------------------------------------------

/** 全体 / 直近 N 手の頻度から「次も同じ手が多いはず」で予測 */
function frequencyPredictor(history: MatchRecord[], recent = 0): PredictorScore {
  const slice = recent > 0 ? history.slice(-recent) : history;
  if (slice.length === 0) {
    return { name: "Frequency", prediction: randomMove(), confidence: 0, reason: "データ不足" };
  }
  const counts: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };
  for (const h of slice) counts[h.player_move]++;
  const most = (Object.keys(counts) as Move[]).reduce((a, b) =>
    counts[a] >= counts[b] ? a : b
  );
  const confidence = counts[most] / slice.length;
  const label = recent > 0 ? `直近${recent}手` : "全体";
  return {
    name: "Frequency",
    prediction: BEATS[most],
    confidence,
    reason: `${label}で「${jpMove(most)}」が多い（${Math.round(confidence * 100)}%）`,
  };
}

/** 直前の手から次手を予測するマルコフ予測器 */
function markovPredictor(history: MatchRecord[], order = 1): PredictorScore {
  if (history.length <= order) {
    return { name: "Markov", prediction: randomMove(), confidence: 0, reason: "データ不足" };
  }
  const transitions: Record<string, Record<Move, number>> = {};
  for (let i = order; i < history.length; i++) {
    const key = history
      .slice(i - order, i)
      .map((h) => h.player_move)
      .join("_");
    if (!transitions[key]) transitions[key] = { rock: 0, paper: 0, scissors: 0 };
    transitions[key][history[i].player_move]++;
  }
  const currentKey = history
    .slice(-order)
    .map((h) => h.player_move)
    .join("_");
  const next = transitions[currentKey];
  if (!next) {
    return { name: "Markov", prediction: randomMove(), confidence: 0, reason: "パターン未観測" };
  }
  const predicted = (Object.keys(next) as Move[]).reduce((a, b) =>
    next[a] >= next[b] ? a : b
  );
  const total = Object.values(next).reduce((a, b) => a + b, 0);
  const confidence = next[predicted] / total;
  return {
    name: "Markov",
    prediction: BEATS[predicted],
    confidence,
    reason: `直前${order}手パターンから「${jpMove(predicted)}」を予測（${Math.round(confidence * 100)}%）`,
  };
}

/** 日本人特有の心理バイアスを利用した予測器 */
function psychPredictor(history: MatchRecord[]): PredictorScore {
  // 初手グー率 45%
  if (history.length === 0) {
    return {
      name: "Psych",
      prediction: "paper",
      confidence: 0.45,
      reason: "初手は統計的にグーが多い（45%）",
    };
  }
  const last = history[history.length - 1];

  // 負け後の手変更率 78% → 負け後は違う手を出すはず
  if (last.result === "win") {
    // プレイヤーが勝った（= AIが負けた）→ プレイヤーは同じ手を維持しやすい
    const sameMove = last.player_move;
    return {
      name: "Psych",
      prediction: BEATS[sameMove],
      confidence: 0.55,
      reason: `勝った後は同じ手を出しやすい（「${jpMove(sameMove)}」を継続予測）`,
    };
  }

  if (last.result === "lose") {
    // プレイヤーが負けた → 78% の確率で手を変える
    // 最もよく変える先：負けた手に勝つ手 or ランダム
    const avoidMove = last.player_move;
    const alternatives = MOVES.filter((m) => m !== avoidMove);
    const likely = alternatives.find((m) => BEATS[m] !== last.ai_move) ?? alternatives[0];
    return {
      name: "Psych",
      prediction: BEATS[likely],
      confidence: 0.6,
      reason: `負けた後は手を変えやすい（78%）。「${jpMove(likely)}」に変化を予測`,
    };
  }

  // 引き分け後 → どちらかと言えば違う手へ
  return {
    name: "Psych",
    prediction: randomMove(),
    confidence: 0.35,
    reason: "引き分け後は変化しやすい",
  };
}

/** 連勝・連敗ストリークを利用した予測器 */
function streakPredictor(history: MatchRecord[]): PredictorScore {
  if (history.length < 2) {
    return { name: "Streak", prediction: randomMove(), confidence: 0, reason: "データ不足" };
  }
  let streak = 1;
  const lastResult = history[history.length - 1].result;
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].result === lastResult) streak++;
    else break;
  }
  const last = history[history.length - 1];
  if (streak >= 3 && lastResult === "lose") {
    // 3 連敗 → フラストレーションで大きく変化
    const despMove: Move = "scissors"; // 統計的にパーが来やすい
    return {
      name: "Streak",
      prediction: BEATS[despMove],
      confidence: 0.65,
      reason: `${streak}連敗中。焦りでパーを出しやすいと予測`,
    };
  }
  if (streak >= 3 && lastResult === "win") {
    // 3 連勝 → 慢心で同じ手を維持
    return {
      name: "Streak",
      prediction: BEATS[last.player_move],
      confidence: 0.58,
      reason: `${streak}連勝中。自信から同じ手「${jpMove(last.player_move)}」を予測`,
    };
  }
  return {
    name: "Streak",
    prediction: randomMove(),
    confidence: 0.2,
    reason: "ストリーク短め",
  };
}

// -------------------------------------------------------------------
// メタ評価（Iocaine Powder スタイル）
// -------------------------------------------------------------------

interface PredictorState {
  name: string;
  predict: (h: MatchRecord[]) => PredictorScore;
  score: number;
}

export class JankenAI {
  private predictors: PredictorState[];

  constructor() {
    this.predictors = [
      { name: "Frequency(all)", predict: (h) => frequencyPredictor(h, 0), score: 0 },
      { name: "Frequency(10)", predict: (h) => frequencyPredictor(h, 10), score: 0 },
      { name: "Markov(1)", predict: (h) => markovPredictor(h, 1), score: 0 },
      { name: "Markov(2)", predict: (h) => markovPredictor(h, 2), score: 0 },
      { name: "Psych", predict: (h) => psychPredictor(h), score: 0 },
      { name: "Streak", predict: (h) => streakPredictor(h), score: 0 },
    ];
  }

  /** 全予測器を評価し最善手を返す */
  decide(history: MatchRecord[]): { move: Move; thought: string } {
    // スコアを前ラウンドの結果で更新
    if (history.length > 0) {
      this.updateScores(history);
    }

    // 各予測器のスコアを取得
    const scores = this.predictors.map((p) => ({
      predictor: p,
      result: p.predict(history),
    }));

    // 最高スコアの予測器を選択（重み付き）
    const weighted = scores.map(({ predictor, result }) => ({
      move: result.prediction,
      weight: predictor.score + result.confidence,
      reason: result.reason,
      name: predictor.name,
    }));

    // move ごとに重みを集計
    const moveWeights: Record<Move, { weight: number; reasons: string[] }> = {
      rock: { weight: 0, reasons: [] },
      paper: { weight: 0, reasons: [] },
      scissors: { weight: 0, reasons: [] },
    };
    for (const w of weighted) {
      moveWeights[w.move].weight += w.weight;
      moveWeights[w.move].reasons.push(w.reason);
    }

    const best = (Object.keys(moveWeights) as Move[]).reduce((a, b) =>
      moveWeights[a].weight >= moveWeights[b].weight ? a : b
    );

    // 上位の根拠を思考吹き出し用に整形
    const topReason = weighted
      .filter((w) => w.move === best)
      .sort((a, b) => b.weight - a.weight)[0];
    const thought = generateThought(topReason?.reason ?? "", history);

    return { move: best, thought };
  }

  private updateScores(history: MatchRecord[]) {
    if (history.length < 2) return;
    const prev = history.slice(0, -1);
    const lastActual = history[history.length - 1].player_move;

    for (const p of this.predictors) {
      const predicted = p.predict(prev);
      // 予測が当たったらスコア +1、外れたら -0.5
      if (predicted.prediction === BEATS[lastActual]) {
        p.score = Math.min(p.score + 1, 10);
      } else {
        p.score = Math.max(p.score - 0.5, -5);
      }
    }
  }
}

// -------------------------------------------------------------------
// 勝敗判定
// -------------------------------------------------------------------
export function judgeResult(
  player: Move,
  ai: Move
): "win" | "lose" | "draw" {
  if (player === ai) return "draw";
  if (BEATS[ai] === player) return "lose";
  return "win";
}

// -------------------------------------------------------------------
// ユーティリティ
// -------------------------------------------------------------------
function jpMove(m: Move): string {
  return m === "rock" ? "グー" : m === "paper" ? "パー" : "チョキ";
}

const THOUGHT_TEMPLATES = [
  (reason: string) => `ふむ…${reason}。まだ甘いな。`,
  (reason: string) => `読めているぞ…${reason}`,
  (reason: string) => `統計は嘘をつかない。${reason}`,
  (reason: string) => `面白い。でも${reason}`,
  (_: string, h: MatchRecord[]) =>
    h.length > 5 ? `あなたの癖、もう掴んだ。` : `まだデータが少ないが…`,
  (_: string, h: MatchRecord[]) => {
    const loses = h.filter((r) => r.result === "lose").length;
    return loses >= 3 ? `${loses}回も負けた。そろそろ焦ってきた？` : `慎重に分析中…`;
  },
];

function generateThought(reason: string, history: MatchRecord[]): string {
  const template = THOUGHT_TEMPLATES[Math.floor(Math.random() * THOUGHT_TEMPLATES.length)];
  return template(reason, history);
}
