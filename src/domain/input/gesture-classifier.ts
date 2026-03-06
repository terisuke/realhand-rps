import type { MoveType } from "../game/move";

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export function classifyGesture(landmarks: Landmark[]): MoveType | null {
  if (!landmarks || landmarks.length < 21) return null;

  // Other 4 fingers: tip.y < pip.y = extended (y increases downward)
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  const extendedCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

  // Paper: 4+ fingers extended
  if (extendedCount >= 4) return "paper";

  // Rock: all curled
  if (extendedCount === 0) return "rock";

  // Scissors: index + middle only
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "scissors";

  return null;
}

export function stabilityScore(
  current: Landmark[],
  previous: Landmark[] | null
): number {
  if (!previous || current.length !== previous.length) return 0;

  let totalDiff = 0;
  for (let i = 0; i < current.length; i++) {
    const dx = current[i].x - previous[i].x;
    const dy = current[i].y - previous[i].y;
    totalDiff += Math.sqrt(dx * dx + dy * dy);
  }

  const avgDiff = totalDiff / current.length;
  return Math.max(0, 1 - avgDiff / 0.01);
}
