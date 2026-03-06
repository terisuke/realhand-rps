"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import {
  classifyGesture,
  stabilityScore,
  type Landmark,
} from "@/domain/input/gesture-classifier";
import type { MoveType } from "@/domain/game/move";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export interface UseMediaPipeOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
}

export interface UseMediaPipeResult {
  gesture: MoveType | null;
  stability: number;
  landmarks: Landmark[] | null;
  loading: boolean;
  error: string | null;
}

export function useMediaPipe(
  options: UseMediaPipeOptions
): UseMediaPipeResult {
  const { videoRef, canvasRef, enabled } = options;

  const [gesture, setGesture] = useState<MoveType | null>(null);
  const [stability, setStability] = useState(0);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const prevLandmarksRef = useRef<Landmark[] | null>(null);
  const enabledRef = useRef(enabled);
  const detectFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const hl = landmarkerRef.current;

    if (!video || !canvas || !hl || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectFnRef.current);
      return;
    }

    if (!enabledRef.current) {
      animFrameRef.current = requestAnimationFrame(detectFnRef.current);
      return;
    }

    const results = hl.detectForVideo(video, performance.now());

    if (results.landmarks.length > 0) {
      const lm = results.landmarks[0] as Landmark[];
      const detectedGesture = classifyGesture(lm);
      const score = stabilityScore(lm, prevLandmarksRef.current);
      prevLandmarksRef.current = lm;

      setGesture(detectedGesture);
      setStability(score);
      setLandmarks(lm);
    } else {
      prevLandmarksRef.current = null;
      setGesture(null);
      setStability(0);
      setLandmarks(null);
    }

    animFrameRef.current = requestAnimationFrame(detectFnRef.current);
  }, [videoRef, canvasRef]);

  useEffect(() => {
    detectFnRef.current = detect;
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadeddata = () => {
          detectFnRef.current();
        };
      }
    } catch {
      setError("カメラへのアクセスが拒否されました");
    }
  }, [videoRef]);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (cancelled) {
          hl.close();
          return;
        }

        landmarkerRef.current = hl;
        setLoading(false);
        await startCamera();
      } catch {
        if (!cancelled) {
          setError("カメラの初期化に失敗しました");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      // Clear video element
      if (video) {
        video.onloadeddata = null;
        video.srcObject = null;
      }
      // Close HandLandmarker
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [startCamera, videoRef]);

  return { gesture, stability, landmarks, loading, error };
}
