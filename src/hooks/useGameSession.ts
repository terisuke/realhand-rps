"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { MoveType } from "@/domain/game/move";
import type { AiPersonalityType } from "@/domain/ai/ai-personality";
import { randomPersonalityType } from "@/domain/ai/ai-personality";
import type { GamePhase } from "@/domain/game/game-phase";
import type { RoundData } from "@/domain/game/round";
import type { Milestone } from "@/domain/game/milestone";
import type { SessionReport } from "@/domain/game/session-report";
import type { PredictorInput } from "@/domain/ai/predictor";
import { generateReport } from "@/application/use-cases/generate-report";

const TOTAL_ROUNDS = 30;

function roundsToHistory(rounds: RoundData[]): PredictorInput[] {
  return rounds.map((r) => ({
    playerMove: r.playerMove,
    aiMove: r.aiMove,
    result: r.result,
  }));
}

export interface GameState {
  sessionId: string;
  personality: AiPersonalityType;
  rounds: RoundData[];
  currentRound: number;
  phase: GamePhase;
  commitHash: string | null;
  lastResult: {
    playerMove: MoveType;
    aiMove: MoveType;
    result: "win" | "lose" | "draw";
    thought: string;
  } | null;
  milestones: Milestone[];
  pending: boolean;
  error: string | null;
  mode: "camera" | "button";
}

export interface GameActions {
  startRound: () => Promise<void>;
  submitMove: (playerMove: MoveType) => Promise<void>;
  toggleMode: () => void;
  reset: () => void;
}

interface StartRoundResponse {
  round_number: number;
  commit_hash: string;
}

interface SubmitMoveResponse {
  ai_move: MoveType;
  result: "win" | "lose" | "draw";
  thought: string;
  milestones: Milestone[];
  commit_proof: string;
}

export function useGameSession(): {
  state: GameState;
  actions: GameActions;
  isComplete: boolean;
  report: SessionReport | null;
} {
  const [sessionId, setSessionId] = useState("");
  const [personality, setPersonality] = useState<AiPersonalityType>("analytical");

  // Hydration-safe: initialize sessionId and personality only on client
  // sessionId: fresh UUID per page load (no localStorage) to avoid stale round_commits conflicts
  // personality: random on client only to avoid SSR/client mismatch (#418)
  useEffect(() => {
    setSessionId(uuidv4());
    setPersonality(randomPersonalityType());
  }, []);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<GamePhase>("opening");
  const [commitHash, setCommitHash] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GameState["lastResult"]>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "button">("camera");

  const isComplete = rounds.length >= TOTAL_ROUNDS;

  const report = useMemo<SessionReport | null>(() => {
    if (!isComplete) return null;
    return generateReport({ rounds });
  }, [isComplete, rounds]);

  const startingRef = useRef(false);

  const startRound = useCallback(async () => {
    if (isComplete || startingRef.current || !sessionId) return;
    startingRef.current = true;
    setError(null);

    try {
      const res = await fetch("/api/start-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          rounds: roundsToHistory(rounds),
          personality,
          current_round: currentRound,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errBody.error ?? `Start round failed: ${res.status}`);
      }

      const data: StartRoundResponse = await res.json();
      setCurrentRound(data.round_number);
      setCommitHash(data.commit_hash);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to start round";
      setError(message);
    } finally {
      startingRef.current = false;
    }
  }, [isComplete, sessionId, rounds, personality, currentRound]);

  const submitMove = useCallback(
    async (playerMove: MoveType) => {
      if (pending || isComplete || !sessionId) return;
      setPending(true);
      setError(null);
      setLastResult(null);

      try {
        const res = await fetch("/api/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            round_number: currentRound,
            player_move: playerMove,
            personality,
            rounds: roundsToHistory(rounds),
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errBody.error ?? `Submit move failed: ${res.status}`);
        }

        const data: SubmitMoveResponse = await res.json();

        const newRound: RoundData = {
          roundNumber: currentRound,
          playerMove,
          aiMove: data.ai_move,
          result: data.result,
          thought: data.thought,
          phase,
          aiPredictedCorrectly: data.result === "lose",
        };

        const newRounds = [...rounds, newRound];
        setRounds(newRounds);
        setLastResult({
          playerMove,
          aiMove: data.ai_move,
          result: data.result,
          thought: data.thought,
        });
        setMilestones(data.milestones);
        setCommitHash(null);

        if (newRounds.length < TOTAL_ROUNDS) {
          setCurrentRound(currentRound + 1);
          // Auto-start next round
          try {
            const nextRes = await fetch("/api/start-round", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: sessionId,
                rounds: roundsToHistory(newRounds),
                personality,
                current_round: currentRound + 1,
              }),
            });

            if (nextRes.ok) {
              const nextData: StartRoundResponse = await nextRes.json();
              setCurrentRound(nextData.round_number);
              setCommitHash(nextData.commit_hash);
            }
          } catch {
            setError("次のラウンドの開始に失敗しました。もう一度お試しください。");
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to submit move";
        setError(message);
      } finally {
        setPending(false);
      }
    },
    [pending, isComplete, sessionId, currentRound, rounds, personality, phase]
  );

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "camera" ? "button" : "camera"));
  }, []);

  const reset = useCallback(() => {
    setRounds([]);
    setCurrentRound(1);
    setPhase("opening");
    setCommitHash(null);
    setLastResult(null);
    setMilestones([]);
    setPending(false);
    setError(null);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  const state: GameState = {
    sessionId,
    personality,
    rounds,
    currentRound,
    phase,
    commitHash,
    lastResult,
    milestones,
    pending,
    error,
    mode,
  };

  const actions: GameActions = {
    startRound,
    submitMove,
    toggleMode,
    reset,
  };

  return { state, actions, isComplete, report };
}
