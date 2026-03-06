export interface Milestone {
  type: string;
  message: string;
  atRound: number;
}

type SimpleRound = { result: "win" | "lose" | "draw"; roundNumber: number };

function getLastNResults(rounds: SimpleRound[], n: number): Array<"win" | "lose" | "draw"> {
  return rounds.slice(-n).map((r) => r.result);
}

export function detectMilestones(rounds: SimpleRound[]): Milestone[] {
  if (rounds.length === 0) return [];

  const milestones: Milestone[] = [];
  const lastRound = rounds[rounds.length - 1];
  const currentRoundNumber = lastRound.roundNumber;

  const wins = rounds.filter((r) => r.result === "win").length;
  const losses = rounds.filter((r) => r.result === "lose").length;

  // first_win: first occurrence of a win
  const firstWinRound = rounds.find((r) => r.result === "win");
  if (firstWinRound && firstWinRound.roundNumber === currentRoundNumber) {
    milestones.push({
      type: "first_win",
      message: "初勝利！AIを出し抜いた！",
      atRound: currentRoundNumber,
    });
  }

  // three_streak_win: last 3 are all wins
  if (rounds.length >= 3) {
    const last3 = getLastNResults(rounds, 3);
    if (last3.every((r) => r === "win")) {
      milestones.push({
        type: "three_streak_win",
        message: "3連勝！AIが焦り始めている...",
        atRound: currentRoundNumber,
      });
    }
  }

  // three_streak_lose: last 3 are all losses
  if (rounds.length >= 3) {
    const last3 = getLastNResults(rounds, 3);
    if (last3.every((r) => r === "lose")) {
      milestones.push({
        type: "three_streak_lose",
        message: "3連敗...AIに読まれている",
        atRound: currentRoundNumber,
      });
    }
  }

  // five_rounds: every 5 rounds
  if (currentRoundNumber % 5 === 0) {
    milestones.push({
      type: "five_rounds",
      message: `${currentRoundNumber}戦完了！折り返し地点...`,
      atRound: currentRoundNumber,
    });
  }

  // ai_dominance: AI wins 5+ more than player
  if (losses - wins >= 5) {
    milestones.push({
      type: "ai_dominance",
      message: "AIが大きくリード。パターンを変えて！",
      atRound: currentRoundNumber,
    });
  }

  // player_dominance: player wins 5+ more than AI
  if (wins - losses >= 5) {
    milestones.push({
      type: "player_dominance",
      message: "あなたがリード！AIが対策を練っている...",
      atRound: currentRoundNumber,
    });
  }

  // halfway: round 15
  if (currentRoundNumber === 15) {
    milestones.push({
      type: "halfway",
      message: "折り返し地点！残り15戦",
      atRound: currentRoundNumber,
    });
  }

  // final_stretch: round 25
  if (currentRoundNumber === 25) {
    milestones.push({
      type: "final_stretch",
      message: "ラスト5戦！最終局面",
      atRound: currentRoundNumber,
    });
  }

  return milestones;
}
