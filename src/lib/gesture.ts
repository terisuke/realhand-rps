import type { Move } from "@/types";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * MediaPipe Hand Landmarker の 21 点ランドマークから
 * グー / チョキ / パー を判定する。
 *
 * 参考：https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 *
 * 指先 ID: 親指=4, 人差し指=8, 中指=12, 薬指=16, 小指=20
 * 第二関節 ID: 親指=3, 人差し指=6, 中指=10, 薬指=14, 小指=18
 */

export function classifyGesture(landmarks: NormalizedLandmark[]): Move | null {
  if (!landmarks || landmarks.length < 21) return null;

  // 各指が「伸びているか」を判定
  // 他4本：tip.y < pip.y = 伸びている（y は上方向が小さい）
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  const extendedCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

  // パー：4本以上伸びている
  if (extendedCount >= 4) return "paper";

  // グー：全部曲がっている
  if (extendedCount === 0) return "rock";

  // チョキ：人差し指 + 中指だけ伸びている
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "scissors";

  return null;
}

/** ランドマーク配列の安定性スコアを計算（0〜1）。1 に近いほど安定 */
export function stabilityScore(
  current: NormalizedLandmark[],
  previous: NormalizedLandmark[] | null
): number {
  if (!previous || current.length !== previous.length) return 0;
  let totalDiff = 0;
  for (let i = 0; i < current.length; i++) {
    const dx = current[i].x - previous[i].x;
    const dy = current[i].y - previous[i].y;
    totalDiff += Math.sqrt(dx * dx + dy * dy);
  }
  const avgDiff = totalDiff / current.length;
  // avgDiff が 0.01 以下なら安定とみなす
  return Math.max(0, 1 - avgDiff / 0.01);
}
