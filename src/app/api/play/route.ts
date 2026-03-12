import { NextRequest, NextResponse } from "next/server";
import { SubmitMoveSchema } from "@/application/schemas";
import { submitMove } from "@/application/use-cases/submit-move";
import { getPreCommit, deletePreCommit } from "@/application/services/pre-commit-store";
import { saveMatch } from "@/infrastructure/supabase/match-repository";
import { checkRateLimit } from "@/app/api/_middleware/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad request", details: "Invalid JSON" },
        { status: 400 }
      );
    }

    const parsed = SubmitMoveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { session_id, player_move, round_number, personality, rounds } = parsed.data;

    const preCommit = await getPreCommit(session_id, round_number);

    if (!preCommit) {
      return NextResponse.json(
        { error: "No pre-commit found. Either call /api/start-round first, or this round was already played." },
        { status: 404 }
      );
    }

    const { aiMove, salt, commitHash } = preCommit;

    const result = await submitMove({
      playerMove: player_move,
      aiMove,
      salt,
      commitHash,
      personality,
      history: rounds,
      currentRound: round_number,
    });

    // Delete pre-commit only after successful use case execution
    await deletePreCommit(session_id, round_number);

    // Save to Supabase (awaited but non-blocking on failure)
    let persisted = false;
    try {
      await saveMatch({
        sessionId: session_id,
        roundNumber: round_number,
        playerMove: player_move,
        aiMove: result.aiMove,
        result: result.result,
        thought: result.thought,
        phase: "opening",
      });
      persisted = true;
    } catch {
      console.error("[/api/play] Match persistence failed");
    }

    return NextResponse.json({
      ai_move: result.aiMove,
      result: result.result,
      thought: result.thought,
      milestones: result.milestones,
      commit_proof: result.commitProof,
      persisted,
    });
  } catch {
    console.error("[/api/play] Internal error occurred");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
