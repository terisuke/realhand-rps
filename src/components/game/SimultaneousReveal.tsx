"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { MoveType } from "@/domain/game/move";
import { JP_LABELS } from "@/domain/game/move";

interface SimultaneousRevealProps {
  playerMove: MoveType;
  aiMove: MoveType;
  result: "win" | "lose" | "draw";
  visible: boolean;
}

const MOVE_EMOJI: Record<MoveType, string> = {
  rock: "\u270A",
  paper: "\u270B",
  scissors: "\u270C\uFE0F",
};

const FLIP_DURATION = 0.6;

function glowClass(
  side: "player" | "ai",
  result: SimultaneousRevealProps["result"],
): string {
  if (result === "win" && side === "player") return "shadow-[0_0_30px_rgba(34,197,94,0.7)]";
  if (result === "lose" && side === "ai") return "shadow-[0_0_30px_rgba(239,68,68,0.7)]";
  if (result === "draw") return "shadow-[0_0_30px_rgba(234,179,8,0.7)]";
  return "";
}

function RevealCard({
  move,
  label,
  side,
  result,
}: {
  move: MoveType;
  label: string;
  side: "player" | "ai";
  result: SimultaneousRevealProps["result"];
}) {
  const glow = glowClass(side, result);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-lg font-semibold text-gray-300">{label}</span>
      <div className="relative h-40 w-32 [perspective:600px]">
        {/* Card flip container */}
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: FLIP_DURATION, ease: "easeInOut" }}
        >
          {/* Front face (revealed move) */}
          <motion.div
            className={[
              "absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gray-800 [backface-visibility:hidden]",
              glow,
            ].join(" ")}
            initial={{ boxShadow: "none" }}
            animate={{ boxShadow: undefined }}
            transition={{ delay: FLIP_DURATION }}
          >
            <span className="text-5xl">{MOVE_EMOJI[move]}</span>
            <span className="mt-2 text-xl font-bold text-white">
              {JP_LABELS[move]}
            </span>
          </motion.div>

          {/* Back face (hidden "?") */}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-700 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-5xl font-bold text-gray-400">?</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function SimultaneousReveal({
  playerMove,
  aiMove,
  result,
  visible,
}: SimultaneousRevealProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="simultaneous-reveal"
          className="flex items-center justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <RevealCard
            move={playerMove}
            label={"\u3042\u306A\u305F"}
            side="player"
            result={result}
          />
          <span className="text-3xl font-bold text-gray-500">VS</span>
          <RevealCard
            move={aiMove}
            label="AI"
            side="ai"
            result={result}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
