"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReportData } from "@/types";

interface Props {
  open: boolean;
  data: ReportData;
  onClose: () => void;
  onReset: () => void;
}

const COLORS = ["#818cf8", "#34d399", "#f472b6"];

export default function ReportModal({ open, data, onClose, onReset }: Props) {
  if (!open) return null;

  const pieData = [
    { name: "グー", value: data.moveDistribution.rock },
    { name: "パー", value: data.moveDistribution.paper },
    { name: "チョキ", value: data.moveDistribution.scissors },
  ];

  const lineData = data.winRateHistory.map((rate, i) => ({
    round: i + 1,
    winRate: Math.round(rate * 100),
  }));

  const winRate = Math.round((data.playerWins / data.totalRounds) * 100);
  const aiWinRate = Math.round((data.aiWins / data.totalRounds) * 100);

  const shareText = `AIじゃんけんで${winRate}%の勝率でした…（AI ${aiWinRate}%）\nあなたは勝てる？ #RealHandRPS`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="report-modal"
          className="w-full max-w-lg bg-gray-900 border border-indigo-500/30 rounded-3xl p-6 overflow-y-auto max-h-[90vh]"
        >
          <h2 className="text-2xl font-bold text-center text-white mb-1">
            🔍 あなたの癖、丸裸レポート
          </h2>
          <p className="text-center text-gray-400 text-sm mb-6">30 戦完了</p>

          {/* 勝率サマリ */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "あなたの勝率", value: `${winRate}%`, color: "text-green-400" },
              { label: "AI 勝率", value: `${aiWinRate}%`, color: "text-red-400" },
              {
                label: "引き分け",
                value: `${Math.round((data.draws / data.totalRounds) * 100)}%`,
                color: "text-yellow-400",
              },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800/60 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 手の分布 */}
          <h3 className="text-sm font-semibold text-gray-300 mb-2">手の分布</h3>
          <div className="flex items-center gap-4 mb-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex flex-col gap-1 text-sm">
              {pieData.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-gray-300">{d.name}</span>
                  <span className="text-gray-500 ml-auto">
                    {data.totalRounds > 0 ? Math.round((d.value / data.totalRounds) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 勝率推移 */}
          <h3 className="text-sm font-semibold text-gray-300 mb-2">勝率推移</h3>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={lineData}>
                <XAxis dataKey="round" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#1e1b4b", border: "none", fontSize: 12 }}
                  formatter={(v: number | undefined) => [`${v ?? 0}%`, "勝率"] as [string, string]}
                />
                <Line type="monotone" dataKey="winRate" stroke="#818cf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI の分析コメント */}
          <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-4 mb-6 text-sm text-indigo-200">
            <p className="font-bold text-indigo-400 mb-1">🤖 AI の分析</p>
            <p>{data.topAiPattern}</p>
            {data.afterLoseChangedRate > 0.6 && (
              <p className="mt-2 text-indigo-300">
                負けた後に手を変える確率が {Math.round(data.afterLoseChangedRate * 100)}% と高め。
                予測されやすいパターンです。
              </p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(shareText);
                alert("コピーしました！");
              }}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              結果をシェア
            </button>
            <button
              onClick={onReset}
              className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
            >
              もう一度挑戦
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
