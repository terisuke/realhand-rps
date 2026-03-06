"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { classifyGesture, stabilityScore } from "@/lib/gesture";
import type { Move } from "@/types";

const STABLE_DURATION_MS = 1000; // 1秒安定で確定

interface Props {
  onGestureConfirmed: (move: Move) => void;
  disabled?: boolean;
}

export default function CameraRPS({ onGestureConfirmed, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animRef = useRef<number>(0);
  const stableStartRef = useRef<number | null>(null);
  const prevLandmarksRef = useRef<Parameters<typeof stabilityScore>[0] | null>(null);
  const confirmedRef = useRef(false);

  const [currentGesture, setCurrentGesture] = useState<Move | null>(null);
  const [progress, setProgress] = useState(0); // 0〜100
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectRef = useRef<() => void>(() => {});

  const detect = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const hl = landmarkerRef.current;
    if (!video || !canvas || !hl || video.readyState < 2) {
      animRef.current = requestAnimationFrame(detectRef.current);
      return;
    }

    const results = hl.detectForVideo(video, performance.now());
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks.length > 0) {
      const lm = results.landmarks[0];
      const gesture = classifyGesture(lm);

      // 安定度チェック
      const stable = stabilityScore(lm, prevLandmarksRef.current);
      prevLandmarksRef.current = lm;

      if (gesture && stable > 0.85 && !disabled && !confirmedRef.current) {
        setCurrentGesture(gesture);
        if (stableStartRef.current === null) {
          stableStartRef.current = performance.now();
        }
        const elapsed = performance.now() - stableStartRef.current;
        const pct = Math.min((elapsed / STABLE_DURATION_MS) * 100, 100);
        setProgress(pct);

        if (elapsed >= STABLE_DURATION_MS) {
          confirmedRef.current = true;
          onGestureConfirmed(gesture);
          stableStartRef.current = null;
          setProgress(0);
        }
      } else {
        stableStartRef.current = null;
        setProgress(0);
        if (!gesture) setCurrentGesture(null);
      }

      // ランドマーク描画
      drawLandmarks(ctx, lm, canvas.width, canvas.height);
    } else {
      prevLandmarksRef.current = null;
      stableStartRef.current = null;
      setCurrentGesture(null);
      setProgress(0);
    }

    animRef.current = requestAnimationFrame(detectRef.current);
  }, [disabled, onGestureConfirmed]);

  useEffect(() => {
    detectRef.current = detect;
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => detect();
      }
    } catch {
      setError("カメラへのアクセスが拒否されました");
    }
  }, [detect]);

  // MediaPipe 初期化
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (!cancelled) {
          landmarkerRef.current = hl;
          setLoading(false);
          startCamera();
        }
      } catch {
        if (!cancelled) setError("カメラの初期化に失敗しました");
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animRef.current);
    };
  }, [startCamera]);

  // disabled が false に戻ったら確定フラグをリセット
  useEffect(() => {
    if (!disabled) confirmedRef.current = false;
  }, [disabled]);

  const moveLabel = (m: Move | null) => {
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

      {/* ジェスチャー表示 */}
      <div className="text-xl font-bold text-white">{moveLabel(currentGesture)}</div>

      {/* 安定プログレスバー */}
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

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; z: number }[],
  w: number,
  h: number
) {
  ctx.fillStyle = "#818cf8";
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
