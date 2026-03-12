"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameSession } from "@/hooks/useGameSession";
import { useCountdown } from "@/hooks/useCountdown";
import type { MoveType } from "@/domain/game/move";
import CameraInput from "@/components/input/CameraInput";
import ButtonInput from "@/components/input/ButtonInput";
import AiThoughtBubble from "@/components/AiThoughtBubble";
import GameResult from "@/components/GameResult";
import ReportModal from "@/components/ReportModal";
import ScoreBoard from "@/components/game/ScoreBoard";
import AiPersonalityBadge from "@/components/ai/AiPersonalityBadge";
import { CountdownOverlay } from "@/components/game/CountdownOverlay";
import MilestoneToast from "@/components/report/MilestoneToast";

const TOTAL_ROUNDS = 30;

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        data-testid="progress-bar"
        className="h-full bg-indigo-500"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

export default function GameBoard() {
  const { state, actions, isComplete, report } = useGameSession();
  const pendingMoveRef = useRef<MoveType | null>(null);
  const [showReport, setShowReport] = useState(false);

  const handleCountdownComplete = useCallback(() => {
    const move = pendingMoveRef.current;
    if (!move) return;
    pendingMoveRef.current = null;
    actions.submitMove(move);
  }, [actions]);

  const countdown = useCountdown({ onComplete: handleCountdownComplete });

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    actions.startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isComplete) {
      setShowReport(true);
    }
  }, [isComplete]);

  const handleMove = useCallback(
    (move: MoveType) => {
      if (state.pending || countdown.isActive || countdown.phase === "reveal") return;
      pendingMoveRef.current = move;
      countdown.start();
    },
    [state.pending, countdown]
  );

  useEffect(() => {
    if (countdown.phase === "reveal" && !pendingMoveRef.current) {
      const timer = setTimeout(() => {
        countdown.reset();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [countdown, countdown.phase]);

  const wins = state.rounds.filter((r) => r.result === "win").length;
  const losses = state.rounds.filter((r) => r.result === "lose").length;
  const draws = state.rounds.filter((r) => r.result === "draw").length;

  const inputDisabled = state.pending || countdown.isActive || countdown.phase === "reveal" || isComplete;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-6 gap-6">
      {/* Header */}
      <header className="w-full max-w-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            Round {state.currentRound} / {TOTAL_ROUNDS}
          </h1>
          <button
            onClick={actions.toggleMode}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm transition-colors"
          >
            {state.mode === "camera" ? "Button" : "Camera"}
          </button>
        </div>
        <ProgressBar current={state.rounds.length} total={TOTAL_ROUNDS} />
        <div className="flex items-center justify-between">
          <AiPersonalityBadge personality={state.personality} />
          <ScoreBoard wins={wins} losses={losses} draws={draws} />
        </div>
      </header>

      {/* AI Thought */}
      <AiThoughtBubble thought={state.lastResult?.thought ?? null} />

      {/* Game Result */}
      <AnimatePresence mode="wait">
        {state.lastResult && countdown.phase !== "reveal" && (
          <motion.div
            key={`result-${state.rounds.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GameResult
              playerMove={state.lastResult.playerMove}
              aiMove={state.lastResult.aiMove}
              result={state.lastResult.result}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="w-full max-w-lg">
        {state.mode === "camera" ? (
          <CameraInput onGestureConfirmed={handleMove} disabled={inputDisabled} />
        ) : (
          <ButtonInput onSelect={handleMove} disabled={inputDisabled} />
        )}
      </div>

      {/* Error */}
      {state.error && (
        <div data-testid="error-bar" className="px-4 py-2 rounded-xl bg-red-900/40 border border-red-500/40 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      {/* Countdown Overlay */}
      <CountdownOverlay phase={countdown.phase} label={countdown.label} isActive={countdown.isActive} />

      {/* Milestone Toast */}
      <MilestoneToast milestones={state.milestones} />

      {/* Report Modal */}
      {report && (
        <ReportModal
          open={showReport}
          data={{
            totalRounds: report.totalRounds,
            playerWins: report.playerWins,
            aiWins: report.aiWins,
            draws: report.draws,
            moveDistribution: report.moveDistribution,
            winRateHistory: report.winRateHistory,
            topAiPattern: report.topAiPattern,
            afterLoseChangedRate: report.afterLoseChangedRate,
          }}
          onClose={() => setShowReport(false)}
          onReset={actions.reset}
        />
      )}
    </div>
  );
}
