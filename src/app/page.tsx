"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import CameraRPS from "@/components/CameraRPS";
import ButtonRPS from "@/components/ButtonRPS";
import AiThoughtBubble from "@/components/AiThoughtBubble";
import GameResult from "@/components/GameResult";
import ReportModal from "@/components/ReportModal";
import type { Move, Result, MatchRecord, GameMode, ReportData } from "@/types";

const TOTAL_ROUNDS = 30;

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  const key = "rps_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(key, id);
  }
  return id;
}

function buildReport(history: MatchRecord[]): ReportData {
  const dist: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };
  let afterLoseChanged = 0;
  let afterLoseTotal = 0;

  for (let i = 0; i < history.length; i++) {
    dist[history[i].player_move]++;
    if (i > 0 && history[i - 1].result === "lose") {
      afterLoseTotal++;
      if (history[i].player_move !== history[i - 1].player_move) afterLoseChanged++;
    }
  }

  const wins = history.filter((h) => h.result === "win").length;
  const winRateHistory = history.map((_, i) => {
    const slice = history.slice(0, i + 1);
    return slice.filter((h) => h.result === "win").length / (i + 1);
  });

  const mostUsed = (Object.keys(dist) as Move[]).reduce((a, b) =>
    dist[a] >= dist[b] ? a : b
  );
  const moveJp: Record<Move, string> = { rock: "グー", paper: "パー", scissors: "チョキ" };

  return {
    totalRounds: history.length,
    playerWins: wins,
    aiWins: history.filter((h) => h.result === "lose").length,
    draws: history.filter((h) => h.result === "draw").length,
    moveDistribution: dist,
    winRateHistory,
    topAiPattern: `あなたは「${moveJp[mostUsed]}」が最も多く（${Math.round((dist[mostUsed] / history.length) * 100)}%）、そのパターンを重点的に読みました。`,
    afterLoseChangedRate: afterLoseTotal > 0 ? afterLoseChanged / afterLoseTotal : 0,
  };
}

export default function HomePage() {
  const [sessionId] = useState(() => getOrCreateSessionId());
  const [mode, setMode] = useState<GameMode>("camera");
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [pending, setPending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    playerMove: Move;
    aiMove: Move;
    result: Result;
  } | null>(null);
  const [thought, setThought] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const handleMove = useCallback(
    async (playerMove: Move) => {
      if (pending || history.length >= TOTAL_ROUNDS) return;
      setPending(true);
      setLastResult(null);

      try {
        const res = await fetch("/api/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_move: playerMove, session_id: sessionId, history }),
        });
        const data = await res.json();
        const { ai_move, result, thought: t } = data;

        const record: MatchRecord = {
          session_id: sessionId,
          player_move: playerMove,
          ai_move,
          result,
          round: history.length + 1,
        };

        const newHistory = [...history, record];
        setHistory(newHistory);
        setLastResult({ playerMove, aiMove: ai_move, result });
        setThought(t);

        if (newHistory.length >= TOTAL_ROUNDS) {
          setTimeout(() => {
            setReport(buildReport(newHistory));
            setShowReport(true);
          }, 1200);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPending(false);
      }
    },
    [pending, history, sessionId]
  );

  const handleReset = () => {
    setHistory([]);
    setLastResult(null);
    setThought(null);
    setShowReport(false);
    setReport(null);
    localStorage.removeItem("rps_session_id");
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center">
      {/* ヘッダー */}
      <header className="w-full max-w-xl flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-lg font-bold text-indigo-300 leading-tight">RealHand RPS</h1>
          <p className="text-xs text-gray-500">AI 心理戦じゃんけん</p>
        </div>

        <div className="text-center">
          <span className="text-2xl font-bold text-white">{Math.min(history.length, TOTAL_ROUNDS)}</span>
          <span className="text-gray-500 text-sm"> / {TOTAL_ROUNDS} 戦</span>
        </div>

        <button
          onClick={() => setMode((m) => (m === "camera" ? "button" : "camera"))}
          className="text-xs bg-gray-800 border border-gray-600 px-3 py-1.5 rounded-full hover:border-indigo-500 transition-colors"
        >
          {mode === "camera" ? "📷 カメラ" : "🎮 ボタン"}
        </button>
      </header>

      {/* プログレスバー */}
      <div className="w-full max-w-xl px-4 mb-4">
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            animate={{ width: `${(history.length / TOTAL_ROUNDS) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="w-full max-w-xl px-4 flex flex-col items-center gap-6">
        <div className="min-h-[60px] flex items-center">
          <AiThoughtBubble thought={thought} />
        </div>

        {mode === "camera" ? (
          <CameraRPS onGestureConfirmed={handleMove} disabled={pending || history.length >= TOTAL_ROUNDS} />
        ) : (
          <ButtonRPS onSelect={handleMove} disabled={pending || history.length >= TOTAL_ROUNDS} />
        )}

        <AnimatePresence mode="wait">
          {lastResult && (
            <motion.div
              key={`${lastResult.playerMove}-${lastResult.result}-${history.length}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <GameResult
                playerMove={lastResult.playerMove}
                aiMove={lastResult.aiMove}
                result={lastResult.result}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {pending && (
          <p className="text-indigo-300 animate-pulse text-sm">AI が考えています…</p>
        )}

        {history.length > 0 && (
          <div className="flex gap-4 text-sm text-center">
            <div>
              <p className="text-green-400 font-bold">{history.filter((h) => h.result === "win").length}</p>
              <p className="text-gray-500 text-xs">勝ち</p>
            </div>
            <div>
              <p className="text-red-400 font-bold">{history.filter((h) => h.result === "lose").length}</p>
              <p className="text-gray-500 text-xs">負け</p>
            </div>
            <div>
              <p className="text-yellow-400 font-bold">{history.filter((h) => h.result === "draw").length}</p>
              <p className="text-gray-500 text-xs">引き分け</p>
            </div>
          </div>
        )}
      </div>

      {report && (
        <ReportModal
          open={showReport}
          data={report}
          onClose={() => setShowReport(false)}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
