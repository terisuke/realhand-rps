import { NextRequest, NextResponse } from "next/server";
import { SubmitMoveSchema } from "@/application/schemas";
import { submitMove } from "@/application/use-cases/submit-move";
import { getPreCommit, deletePreCommit } from "@/application/services/pre-commit-store";
import { saveMatch } from "@/infrastructure/supabase/match-repository";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
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

    const { session_id, player_move, round_number } = parsed.data;

    const preCommit = await getPreCommit(session_id, round_number);

    if (!preCommit) {
      return NextResponse.json(
        { error: "No pre-commit found for this round. Call /api/start-round first." },
        { status: 404 }
      );
    }

    const { aiMove, salt, commitHash, personality, history } = preCommit;

    const result = await submitMove({
      playerMove: player_move,
      aiMove,
      salt,
      commitHash,
      personality,
      history,
      currentRound: round_number,
    });

    // Delete pre-commit only after successful use case execution
    await deletePreCommit(session_id, round_number);

    // Save to Supabase (fire-and-forget, doesn't block response)
    saveMatch({
      sessionId: session_id,
      roundNumber: round_number,
      playerMove: player_move,
      aiMove: result.aiMove,
      result: result.result,
      thought: result.thought,
      phase: "opening",
    }).catch((err) => {
      console.error("[/api/play] Supabase save failed:", err);
    });

    return NextResponse.json({
      ai_move: result.aiMove,
      result: result.result,
      thought: result.thought,
      milestones: result.milestones,
      commit_proof: result.commitProof,
    });
  } catch (err) {
    console.error("[/api/play]", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
