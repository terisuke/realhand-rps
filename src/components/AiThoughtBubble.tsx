"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  thought: string | null;
}

export default function AiThoughtBubble({ thought }: Props) {
  return (
    <AnimatePresence mode="wait">
      {thought && (
        <motion.div
          key={thought}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          data-testid="ai-thought"
          className="relative max-w-xs rounded-2xl bg-indigo-950/80 border border-indigo-500/40 px-5 py-3 text-sm text-indigo-200 shadow-lg"
        >
          {/* 吹き出しの三角 */}
          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-indigo-950/80 border-r border-b border-indigo-500/40 rotate-45" />
          <span className="text-indigo-400 font-bold mr-1">AI:</span>
          {thought}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
