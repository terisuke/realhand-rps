"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Milestone } from "@/domain/game/milestone";

interface MilestoneToastProps {
  milestones: Milestone[];
  onDismiss?: () => void;
}

const TOAST_THEME: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  first_win: {
    bg: "bg-yellow-900/80",
    border: "border-yellow-500/50",
    text: "text-yellow-200",
    icon: "★",
  },
  three_streak_win: {
    bg: "bg-green-900/80",
    border: "border-green-500/50",
    text: "text-green-200",
    icon: "▲",
  },
  player_dominance: {
    bg: "bg-green-900/80",
    border: "border-green-500/50",
    text: "text-green-200",
    icon: "▲",
  },
  three_streak_lose: {
    bg: "bg-red-900/80",
    border: "border-red-500/50",
    text: "text-red-200",
    icon: "▼",
  },
  ai_dominance: {
    bg: "bg-red-900/80",
    border: "border-red-500/50",
    text: "text-red-200",
    icon: "▼",
  },
};

const DEFAULT_THEME = {
  bg: "bg-indigo-900/80",
  border: "border-indigo-500/50",
  text: "text-indigo-200",
  icon: "◆",
};

function getTheme(type: string) {
  return TOAST_THEME[type] ?? DEFAULT_THEME;
}

export default function MilestoneToast({ milestones, onDismiss }: MilestoneToastProps) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const buildKey = useCallback(
    (m: Milestone) => `${m.type}-${m.atRound}`,
    [],
  );

  useEffect(() => {
    if (milestones.length === 0) return;

    const newKeys = milestones.map(buildKey);
    setVisibleIds((prev) => {
      const next = new Set(prev);
      for (const key of newKeys) next.add(key);
      return next;
    });

    const timers = newKeys.map((key) =>
      setTimeout(() => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          if (next.size === 0) onDismiss?.();
          return next;
        });
      }, 3000),
    );

    return () => timers.forEach(clearTimeout);
  }, [milestones, buildKey, onDismiss]);

  if (milestones.length === 0) return null;

  const visibleMilestones = milestones.filter((m) => visibleIds.has(buildKey(m)));

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {visibleMilestones.map((milestone) => {
          const theme = getTheme(milestone.type);
          const key = buildKey(milestone);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${theme.bg} ${theme.border} ${theme.text}`}
            >
              <span className="text-lg">{theme.icon}</span>
              <span className="text-sm font-medium">{milestone.message}</span>
              <button
                type="button"
                onClick={() => {
                  setVisibleIds((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    if (next.size === 0) onDismiss?.();
                    return next;
                  });
                }}
                className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-xs"
                aria-label="閉じる"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
