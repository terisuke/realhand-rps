import { Move } from "@/domain/game/move";

export type ResultType = "win" | "lose" | "draw";

/**
 * Judges the round result from the player's perspective.
 * "win" means the player wins.
 */
export function judge(player: Move, ai: Move): ResultType {
  if (player.equals(ai)) return "draw";
  if (player.beats(ai)) return "win";
  return "lose";
}
