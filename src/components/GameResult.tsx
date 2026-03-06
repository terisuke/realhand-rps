"use client";

import { motion } from "framer-motion";
import type { Move, Result } from "@/types";

interface Props {
  playerMove: Move;
  aiMove: Move;
  result: Result;
}

const EMOJI: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

const LABEL: Record<Move, string> = {
  rock: "グー",
  paper: "パー",
  scissors: "チョキ",
};

const RESULT_CONFIG: Record<Result, { text: string; color: string }> = {
  win: { text: "あなたの勝ち！", color: "text-green-400" },
  lose: { text: "AIの勝ち…", color: "text-red-400" },
  draw: { text: "引き分け", color: "text-yellow-400" },
};

export default function GameResult({ playerMove, aiMove, result }: Props) {
  const { text, color } = RESULT_CONFIG[result];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      data-testid="game-result"
      className="flex flex-col items-center gap-4"
    >
      <div className="flex items-center gap-8 text-center">
        {/* プレイヤー */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 mb-1">あなた</span>
          <span className="text-6xl">{EMOJI[playerMove]}</span>
          <span className="text-sm text-gray-300 mt-1">{LABEL[playerMove]}</span>
        </div>

        <span className="text-2xl text-gray-500">VS</span>

        {/* AI */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 mb-1">AI</span>
          <span className="text-6xl">{EMOJI[aiMove]}</span>
          <span className="text-sm text-gray-300 mt-1">{LABEL[aiMove]}</span>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`text-2xl font-bold ${color}`}
      >
        {text}
      </motion.p>
    </motion.div>
  );
}
