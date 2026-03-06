"use client";

import { motion } from "framer-motion";
import type { AiPersonalityType } from "@/domain/ai/ai-personality";

interface AiPersonalityBadgeProps {
  personality: AiPersonalityType;
}

const PERSONALITY_CONFIG: Record<
  AiPersonalityType,
  { label: string; textColor: string; borderColor: string }
> = {
  provocative: {
    label: "挑発型",
    textColor: "text-red-400",
    borderColor: "border-red-500/50",
  },
  analytical: {
    label: "分析型",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/50",
  },
  uncanny: {
    label: "不気味型",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/50",
  },
};

export default function AiPersonalityBadge({
  personality,
}: AiPersonalityBadgeProps) {
  const config = PERSONALITY_CONFIG[personality];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800/80 border ${config.borderColor} ${config.textColor}`}
    >
      {config.label}
    </motion.span>
  );
}
