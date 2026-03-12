import type { AiPersonality, Situation } from "@/domain/ai/ai-personality";
import type { PredictorInput } from "@/domain/ai/predictor";
import { getTemplate } from "@/domain/ai/ai-personality";

export function determineSituation(history: PredictorInput[]): Situation {
  if (history.length === 0) return "opening";

  if (history.length >= 25) return "endgame";

  // Player repeating same move 3+ times (highest priority)
  if (history.length >= 3) {
    const last3 = history.slice(-3);
    if (last3.every((h) => h.playerMove === last3[0].playerMove)) return "player_predictable";
  }

  // Win rate based situations (from player perspective, excluding draws)
  // Check BEFORE streak so 5-5 splits are classified as close_game not winning_streak
  const decisive = history.filter((h) => h.result !== "draw");
  if (decisive.length >= 5) {
    const wins = decisive.filter((h) => h.result === "win").length;
    const winRate = wins / decisive.length;

    if (winRate >= 0.45 && winRate <= 0.55) return "close_game";
    if (winRate < 0.35) return "dominating";
    if (winRate > 0.65) return "being_dominated";
  }

  // Last 3 results streak check
  if (history.length >= 3) {
    const last3 = history.slice(-3);
    if (last3.every((h) => h.result === "lose")) return "winning_streak";
    if (last3.every((h) => h.result === "win")) return "losing_streak";
  }

  return "player_unpredictable";
}

export function generateThought(
  personality: AiPersonality,
  history: PredictorInput[],
  reason: string,
  currentResult: "win" | "lose" | "draw"
): string {
  const situation = determineSituation(history);
  const template = getTemplate(personality, situation, currentResult);
  if (reason && template.includes("{{reason}}")) {
    return template.replace("{{reason}}", reason);
  }
  return template;
}
