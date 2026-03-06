"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ScoreBoardProps {
  wins: number;
  losses: number;
  draws: number;
}

function AnimatedCount({ value, color }: { value: number; color: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className={`text-lg font-bold tabular-nums ${color}`}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

export default function ScoreBoard({ wins, losses, draws }: ScoreBoardProps) {
  return (
    <div data-testid="scoreboard" className="flex items-center gap-3 text-sm">
      <div data-testid="score-wins" className="flex items-center gap-1">
        <span className="text-gray-400">W</span>
        <AnimatedCount value={wins} color="text-green-400" />
      </div>
      <div data-testid="score-losses" className="flex items-center gap-1">
        <span className="text-gray-400">L</span>
        <AnimatedCount value={losses} color="text-red-400" />
      </div>
      <div data-testid="score-draws" className="flex items-center gap-1">
        <span className="text-gray-400">D</span>
        <AnimatedCount value={draws} color="text-yellow-400" />
      </div>
    </div>
  );
}
