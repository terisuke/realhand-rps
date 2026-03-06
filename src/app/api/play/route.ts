import { NextRequest, NextResponse } from "next/server";
import { JankenAI, judgeResult } from "@/lib/janken-ai";
import { saveMatch } from "@/lib/supabase";
import type { PlayRequest, PlayResponse } from "@/types";

// セッションごとに AI インスタンスをメモリで保持（Edge ではなく Node.js runtime 使用）
const aiSessions = new Map<string, JankenAI>();

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body: PlayRequest = await req.json();
    const { player_move, session_id, history } = body;

    if (!player_move || !session_id) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // セッションの AI インスタンスを取得または生成
    if (!aiSessions.has(session_id)) {
      aiSessions.set(session_id, new JankenAI());
    }
    const ai = aiSessions.get(session_id)!;

    // ★ AI はプレイヤーの手を受け取ってから決定 → イカサマ不可能
    const { move: ai_move, thought } = ai.decide(history);

    // 勝敗判定
    const result = judgeResult(player_move, ai_move);

    const round = history.length + 1;

    // Supabase に保存（非同期、失敗してもゲームは続行）
    saveMatch({ session_id, player_move, ai_move, result, round }).catch(() => {});

    const response: PlayResponse = { ai_move, result, thought };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/play]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
