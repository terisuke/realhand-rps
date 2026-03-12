"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import type { MoveType } from "@/domain/game/move";
import type { Landmark } from "@/domain/input/gesture-classifier";

const STABLE_DURATION_MS = 1000;

interface Props {
  onGestureConfirmed: (move: MoveType) => void;
  disabled?: boolean;
}

export default function CameraInput({ onGestureConfirmed, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stableStartRef = useRef<number | null>(null);
  const confirmedRef = useRef(false);
  const progressRef = useRef(0);
  const subscribersRef = useRef(new Set<() => void>());
  const animProgressRef = useRef<number>(0);

  const subscribeProgress = useCallback((cb: () => void) => {
    subscribersRef.current.add(cb);
    return () => { subscribersRef.current.delete(cb); };
  }, []);
  const getProgressSnapshot = useCallback(() => progressRef.current, []);
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getProgressSnapshot);

  const setProgressValue = useCallback((val: number) => {
    if (progressRef.current !== val) {
      progressRef.current = val;
      for (const cb of subscribersRef.current) cb();
    }
  }, []);

  const { gesture, stability, landmarks, loading, error } = useMediaPipe({
    videoRef,
    canvasRef,
    enabled: !disabled,
  });

  const gestureRef = useRef(gesture);
  const stabilityRef = useRef(stability);
  const disabledRef = useRef(disabled);
  const onGestureConfirmedRef = useRef(onGestureConfirmed);
  useEffect(() => {
    gestureRef.current = gesture;
    stabilityRef.current = stability;
    disabledRef.current = disabled;
    onGestureConfirmedRef.current = onGestureConfirmed;
  });

  // Stability progress polling via requestAnimationFrame
  useEffect(() => {
    let running = true;

    const tick = () => {
      if (!running) return;

      if (disabledRef.current || confirmedRef.current) {
        stableStartRef.current = null;
        setProgressValue(0);
        animProgressRef.current = requestAnimationFrame(tick);
        return;
      }

      if (gestureRef.current && stabilityRef.current > 0.65) {
        if (stableStartRef.current === null) {
          stableStartRef.current = performance.now();
        }
        const elapsed = performance.now() - stableStartRef.current;
        const pct = Math.min(Math.round((elapsed / STABLE_DURATION_MS) * 100), 100);
        setProgressValue(pct);

        if (elapsed >= STABLE_DURATION_MS) {
          confirmedRef.current = true;
          onGestureConfirmedRef.current(gestureRef.current);
          stableStartRef.current = null;
          setProgressValue(0);
        }
      } else {
        stableStartRef.current = null;
        setProgressValue(0);
      }

      animProgressRef.current = requestAnimationFrame(tick);
    };

    animProgressRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animProgressRef.current);
    };
  }, [setProgressValue]);

  // Draw landmarks on canvas
  const drawLandmarks = useCallback(
    (lm: Landmark[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#818cf8";
      for (const point of lm) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  // Draw landmarks when they update
  useEffect(() => {
    if (landmarks) {
      drawLandmarks(landmarks);
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [landmarks, drawLandmarks]);

  // Reset confirmed state when disabled changes to false
  useEffect(() => {
    if (!disabled) confirmedRef.current = false;
  }, [disabled]);

  const moveLabel = (m: MoveType | null) => {
    if (!m) return "手をかざしてください";
    return m === "rock" ? "✊ グー" : m === "paper" ? "✋ パー" : "✌️ チョキ";
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-3">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-10">
          <p className="text-white animate-pulse">AI 視覚システム起動中…</p>
        </div>
      )}

      <div className="relative w-[320px] h-[240px] rounded-xl overflow-hidden border-2 border-indigo-500/60">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full scale-x-[-1]"
        />
      </div>

      <div className="text-xl font-bold text-white">{moveLabel(gesture)}</div>

      <div className="w-[320px] h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {progress > 0 ? `${(progress / 100).toFixed(1)}秒 / 1.0秒` : "1秒間安定させると確定"}
      </p>
    </div>
  );
}
