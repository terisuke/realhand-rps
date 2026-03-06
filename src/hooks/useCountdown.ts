"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type CountdownPhase = "idle" | "janken" | "ken" | "pon" | "reveal";

export interface UseCountdownOptions {
  onComplete: () => void;
}

export interface UseCountdownResult {
  phase: CountdownPhase;
  label: string;
  start: () => void;
  reset: () => void;
  isActive: boolean;
}

const PHASE_LABELS: Record<CountdownPhase, string> = {
  idle: "",
  janken: "じゃん",
  ken: "けん",
  pon: "ぽん！",
  reveal: "",
};

const PHASE_DELAY = 500;

export function useCountdown(options: UseCountdownOptions): UseCountdownResult {
  const [phase, setPhase] = useState<CountdownPhase>("idle");
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef<CountdownPhase>("idle");
  const onCompleteRef = useRef(options.onComplete);
  useEffect(() => {
    onCompleteRef.current = options.onComplete;
  }, [options.onComplete]);

  const clearAllTimeouts = useCallback(() => {
    for (const id of timeoutIds.current) {
      clearTimeout(id);
    }
    timeoutIds.current = [];
  }, []);

  const reset = useCallback(() => {
    clearAllTimeouts();
    phaseRef.current = "idle";
    setPhase("idle");
  }, [clearAllTimeouts]);

  const start = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    clearAllTimeouts();

    phaseRef.current = "janken";
    setPhase("janken");

    const t1 = setTimeout(() => {
      phaseRef.current = "ken";
      setPhase("ken");
    }, PHASE_DELAY);

    const t2 = setTimeout(() => {
      phaseRef.current = "pon";
      setPhase("pon");
    }, PHASE_DELAY * 2);

    const t3 = setTimeout(() => {
      phaseRef.current = "reveal";
      setPhase("reveal");
      onCompleteRef.current();
    }, PHASE_DELAY * 3);

    timeoutIds.current = [t1, t2, t3];
  }, [clearAllTimeouts]);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  const isActive = phase === "janken" || phase === "ken" || phase === "pon";

  return {
    phase,
    label: PHASE_LABELS[phase],
    start,
    reset,
    isActive,
  };
}
