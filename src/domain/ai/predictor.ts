import { MOVES, BEATS, JP_LABELS, type MoveType } from "@/domain/game/move";

export interface PredictorInput {
  playerMove: MoveType;
  result: "win" | "lose" | "draw";
  aiMove: MoveType;
}

export interface PredictorScore {
  name: string;
  prediction: MoveType;
  confidence: number;
  reason: string;
}

export interface Predictor {
  name: string;
  predict(history: PredictorInput[]): PredictorScore;
}

function randomMove(): MoveType {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

function jpMove(m: MoveType): string {
  return JP_LABELS[m];
}


export function createFrequencyPredictor(recent = 0): Predictor {
  return {
    name: "Frequency",
    predict(history: PredictorInput[]): PredictorScore {
      const slice = recent > 0 ? history.slice(-recent) : history;
      if (slice.length === 0) {
        return { name: "Frequency", prediction: randomMove(), confidence: 0, reason: "データ不足" };
      }
      const counts: Record<MoveType, number> = { rock: 0, paper: 0, scissors: 0 };
      for (const h of slice) counts[h.playerMove]++;
      const most = (Object.keys(counts) as MoveType[]).reduce((a, b) =>
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
    },
  };
}

export function createMarkovPredictor(order = 1): Predictor {
  return {
    name: "Markov",
    predict(history: PredictorInput[]): PredictorScore {
      if (history.length <= order) {
        return { name: "Markov", prediction: randomMove(), confidence: 0, reason: "データ不足" };
      }
      const transitions: Record<string, Record<MoveType, number>> = {};
      for (let i = order; i < history.length; i++) {
        const key = history
          .slice(i - order, i)
          .map((h) => h.playerMove)
          .join("_");
        if (!transitions[key]) transitions[key] = { rock: 0, paper: 0, scissors: 0 };
        transitions[key][history[i].playerMove]++;
      }
      const currentKey = history
        .slice(-order)
        .map((h) => h.playerMove)
        .join("_");
      const next = transitions[currentKey];
      if (!next) {
        return { name: "Markov", prediction: randomMove(), confidence: 0, reason: "パターン未観測" };
      }
      const predicted = (Object.keys(next) as MoveType[]).reduce((a, b) =>
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
    },
  };
}

export function createPsychPredictor(): Predictor {
  return {
    name: "Psych",
    predict(history: PredictorInput[]): PredictorScore {
      if (history.length === 0) {
        return {
          name: "Psych",
          prediction: "paper",
          confidence: 0.45,
          reason: "初手は統計的にグーが多い（45%）",
        };
      }
      const last = history[history.length - 1];

      if (last.result === "win") {
        const sameMove = last.playerMove;
        return {
          name: "Psych",
          prediction: BEATS[sameMove],
          confidence: 0.55,
          reason: `勝った後は同じ手を出しやすい（「${jpMove(sameMove)}」を継続予測）`,
        };
      }

      if (last.result === "lose") {
        const avoidMove = last.playerMove;
        const alternatives = MOVES.filter((m) => m !== avoidMove);
        const likely = alternatives.find((m) => BEATS[m] !== last.aiMove) ?? alternatives[0];
        return {
          name: "Psych",
          prediction: BEATS[likely],
          confidence: 0.6,
          reason: `負けた後は手を変えやすい（78%）。「${jpMove(likely)}」に変化を予測`,
        };
      }

      return {
        name: "Psych",
        prediction: randomMove(),
        confidence: 0.35,
        reason: "引き分け後は変化しやすい",
      };
    },
  };
}

export function createStreakPredictor(): Predictor {
  return {
    name: "Streak",
    predict(history: PredictorInput[]): PredictorScore {
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
        const despMove: MoveType = "scissors";
        return {
          name: "Streak",
          prediction: BEATS[despMove],
          confidence: 0.65,
          reason: `${streak}連敗中。焦りでパーを出しやすいと予測`,
        };
      }
      if (streak >= 3 && lastResult === "win") {
        return {
          name: "Streak",
          prediction: BEATS[last.playerMove],
          confidence: 0.58,
          reason: `${streak}連勝中。自信から同じ手「${jpMove(last.playerMove)}」を予測`,
        };
      }
      return {
        name: "Streak",
        prediction: randomMove(),
        confidence: 0.2,
        reason: "ストリーク短め",
      };
    },
  };
}
