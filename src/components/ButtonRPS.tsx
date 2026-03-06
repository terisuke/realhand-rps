"use client";

import { motion } from "framer-motion";
import type { Move } from "@/types";

interface Props {
  onSelect: (move: Move) => void;
  disabled?: boolean;
}

const BUTTONS: { move: Move; emoji: string; label: string }[] = [
  { move: "rock", emoji: "✊", label: "グー" },
  { move: "scissors", emoji: "✌️", label: "チョキ" },
  { move: "paper", emoji: "✋", label: "パー" },
];

export default function ButtonRPS({ onSelect, disabled }: Props) {
  return (
    <div className="flex gap-6 justify-center">
      {BUTTONS.map(({ move, emoji, label }) => (
        <motion.button
          key={move}
          whileHover={{ scale: disabled ? 1 : 1.12 }}
          whileTap={{ scale: disabled ? 1 : 0.92 }}
          onClick={() => !disabled && onSelect(move)}
          disabled={disabled}
          className={`
            flex flex-col items-center justify-center
            w-24 h-24 rounded-2xl text-4xl
            border-2 border-indigo-500/60 bg-gray-800/70
            transition-opacity duration-200
            ${disabled ? "opacity-30 cursor-not-allowed" : "hover:border-indigo-400 cursor-pointer"}
          `}
          aria-label={label}
        >
          {emoji}
          <span className="text-xs text-gray-300 mt-1">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}
