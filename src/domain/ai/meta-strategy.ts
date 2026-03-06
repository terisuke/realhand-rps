import { MOVES, BEATS, type MoveType } from "@/domain/game/move";
import { getPhaseParams, type GamePhase } from "@/domain/game/game-phase";
import {
  createFrequencyPredictor,
  createMarkovPredictor,
  createPsychPredictor,
  createStreakPredictor,
  type PredictorInput,
  type PredictorScore,
} from "@/domain/ai/predictor";
import { applyBias, type ReadableBias } from "@/domain/ai/readable-pattern";

export interface MetaStrategyResult {
  move: MoveType;
  scores: PredictorScore[];
  topReason: string;
}

function buildPredictors() {
  return [
    createFrequencyPredictor(0),
    createFrequencyPredictor(10),
    createMarkovPredictor(1),
    createMarkovPredictor(2),
    createPsychPredictor(),
    createStreakPredictor(),
  ];
}

/**
 * Compute accuracy score for a predictor by replaying history statelessly.
 * For each round i (1..n-1): predict on history[0..i-1], check if prediction === BEATS[actual[i].playerMove]
 */
function computeAccuracyScore(
  predictor: ReturnType<typeof createFrequencyPredictor>,
  history: PredictorInput[]
): number {
  let score = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history.slice(0, i);
    const predicted = predictor.predict(prev);
    const actual = history[i].playerMove;
    if (predicted.prediction === BEATS[actual]) {
      score = Math.min(score + 1, 10);
    } else {
      score = Math.max(score - 0.5, -5);
    }
  }
  return score;
}

export function metaStrategyDecide(
  history: PredictorInput[],
  phase: GamePhase,
  readableBias: ReadableBias
): MetaStrategyResult {
  const { predictionWeight, bluffRate } = getPhaseParams(phase);
  const predictors = buildPredictors();

  // Get predictions and accuracy scores for each predictor.
  // predictionWeight scales the confidence: opening trusts predictors less (0.3), endgame fully (1.0).
  const weightedPredictions = predictors.map((p) => {
    const accuracyScore = computeAccuracyScore(p, history);
    const score = p.predict(history);
    return {
      score,
      weight: accuracyScore + score.confidence * predictionWeight,
    };
  });

  // Aggregate weights per move
  const baseWeights: Record<MoveType, number> = { rock: 0, paper: 0, scissors: 0 };
  const moveReasons: Record<MoveType, { weight: number; reason: string }> = {
    rock: { weight: 0, reason: "" },
    paper: { weight: 0, reason: "" },
    scissors: { weight: 0, reason: "" },
  };

  for (const { score, weight } of weightedPredictions) {
    baseWeights[score.prediction] += weight;
    if (weight > moveReasons[score.prediction].weight) {
      moveReasons[score.prediction] = { weight, reason: score.reason };
    }
  }

  // Apply readable bias
  const biasedWeights = applyBias(baseWeights, readableBias);

  // Apply bluffRate: reduce best move's weight advantage to make selection more uniform during opening.
  // bluffRate=0 (endgame) → no change; bluffRate=0.15 (opening) → slight dampening of best move.
  const bestBeforeDamp = MOVES.reduce((a, b) =>
    biasedWeights[a] >= biasedWeights[b] ? a : b
  );
  const finalWeights = { ...biasedWeights };
  finalWeights[bestBeforeDamp] = biasedWeights[bestBeforeDamp] * (1 - bluffRate);

  // Select best move
  const bestMove = MOVES.reduce((a, b) =>
    finalWeights[a] >= finalWeights[b] ? a : b
  );

  // Find top reason from the best predictor for the winning move
  const topWeighted = weightedPredictions
    .filter((w) => w.score.prediction === bestMove)
    .sort((a, b) => b.weight - a.weight)[0];

  const topReason = topWeighted?.score.reason ?? weightedPredictions[0].score.reason;

  return {
    move: bestMove,
    scores: weightedPredictions.map((w) => w.score),
    topReason,
  };
}
