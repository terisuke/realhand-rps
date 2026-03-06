export type GamePhase = "opening" | "midgame" | "endgame";

export interface PhaseParams {
  predictionWeight: number;
  bluffRate: number;
  readablePatternStrength: number;
}

export interface RoundAccuracy {
  aiPredictedCorrectly: boolean;
}

const PHASE_ORDER: GamePhase[] = ["opening", "midgame", "endgame"];

function phaseRank(phase: GamePhase): number {
  return PHASE_ORDER.indexOf(phase);
}

function maxPhase(a: GamePhase, b: GamePhase): GamePhase {
  return phaseRank(a) >= phaseRank(b) ? a : b;
}

const WINDOW_SIZE = 5;

function accuracyInWindow(rounds: RoundAccuracy[]): number {
  const window = rounds.slice(-WINDOW_SIZE);
  if (window.length < WINDOW_SIZE) return 0;
  const correct = window.filter((r) => r.aiPredictedCorrectly).length;
  return correct / window.length;
}

export function computePhase(rounds: RoundAccuracy[], currentRound: number): GamePhase {
  // Enforce monotonicity: scan each complete window and keep the highest phase ever reached
  let highest: GamePhase = "opening";

  for (let i = WINDOW_SIZE; i <= rounds.length; i++) {
    const subHistory = rounds.slice(0, i);
    const accuracy = accuracyInWindow(subHistory);

    let phase: GamePhase = "opening";
    if (accuracy > 0.65) phase = "endgame";
    else if (accuracy > 0.5) phase = "midgame";

    highest = maxPhase(highest, phase);
  }

  // endgame by round number (independent of accuracy)
  if (currentRound >= 25) {
    highest = maxPhase(highest, "endgame");
  }

  return highest;
}

const PHASE_PARAMS: Record<GamePhase, PhaseParams> = {
  opening: { predictionWeight: 0.3, bluffRate: 0.15, readablePatternStrength: 0.4 },
  midgame: { predictionWeight: 0.7, bluffRate: 0.1, readablePatternStrength: 0.2 },
  endgame: { predictionWeight: 1.0, bluffRate: 0.0, readablePatternStrength: 0.0 },
};

export function getPhaseParams(phase: GamePhase): PhaseParams {
  return { ...PHASE_PARAMS[phase] };
}
