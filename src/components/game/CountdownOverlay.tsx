"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { CountdownPhase } from "@/hooks/useCountdown";

interface CountdownOverlayProps {
  phase: CountdownPhase;
  label: string;
  isActive: boolean;
}

export function CountdownOverlay({
  phase,
  label,
  isActive,
}: CountdownOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="countdown-overlay"
          data-testid="countdown-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              className="text-7xl font-bold text-white sm:text-8xl"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 15,
                duration: 0.3,
              }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
