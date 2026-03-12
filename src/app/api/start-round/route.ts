import { NextRequest, NextResponse } from "next/server";
import { StartRoundSchema } from "@/application/schemas";
import { startRound } from "@/application/use-cases/start-round";
import { savePreCommit } from "@/application/services/pre-commit-store";
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

    const parsed = StartRoundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { session_id, rounds, personality, current_round } = parsed.data;

    const result = await startRound({
      sessionId: session_id,
      rounds,
      personality,
      currentRound: current_round,
    });

    await savePreCommit(session_id, result.roundNumber, {
      aiMove: result.aiMove,
      salt: result.salt,
      commitHash: result.commitHash,
      personality,
      history: rounds,
      currentRound: current_round,
    });

    return NextResponse.json({
      round_number: result.roundNumber,
      commit_hash: result.commitHash,
    });
  } catch {
    console.error("[/api/start-round] Internal error occurred");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
