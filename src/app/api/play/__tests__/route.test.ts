import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/play/route";

vi.mock("@/application/services/pre-commit-store", () => ({
  getPreCommit: vi.fn(),
  deletePreCommit: vi.fn(),
}));

vi.mock("@/application/use-cases/submit-move", () => ({
  submitMove: vi.fn(),
}));


import { getPreCommit, deletePreCommit } from "@/application/services/pre-commit-store";
import { submitMove } from "@/application/use-cases/submit-move";

const mockedGetPreCommit = vi.mocked(getPreCommit);
const mockedDeletePreCommit = vi.mocked(deletePreCommit);
const mockedSubmitMove = vi.mocked(submitMove);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/play", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when request body is invalid", async () => {
    const req = makeRequest({ session_id: "", player_move: "invalid" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Bad request");
  });

  it("returns 404 when no pre-commit exists for the round", async () => {
    mockedGetPreCommit.mockReturnValue(undefined);

    const req = makeRequest({
      session_id: "test-session",
      round_number: 1,
      player_move: "rock",
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("No pre-commit found");
  });

  it("returns result when pre-commit exists", async () => {
    mockedGetPreCommit.mockReturnValue({
      aiMove: "scissors",
      salt: "salt-123",
      commitHash: "hash-abc",
      personality: "provocative",
      history: [],
      currentRound: 1,
    });

    mockedSubmitMove.mockResolvedValue({
      aiMove: "scissors",
      result: "win",
      thought: "test thought",
      milestones: [],
      commitProof: { hash: "hash-abc", salt: "salt-123", verified: true },
    });

    const req = makeRequest({
      session_id: "test-session",
      round_number: 1,
      player_move: "rock",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      ai_move: "scissors",
      result: "win",
      thought: "test thought",
      milestones: [],
      commit_proof: { hash: "hash-abc", salt: "salt-123", verified: true },
    });
  });

  it("deletes pre-commit after retrieval", async () => {
    mockedGetPreCommit.mockReturnValue({
      aiMove: "rock",
      salt: "s",
      commitHash: "h",
      personality: "analytical",
      history: [],
      currentRound: 1,
    });

    mockedSubmitMove.mockResolvedValue({
      aiMove: "rock",
      result: "draw",
      thought: "",
      milestones: [],
      commitProof: { hash: "h", salt: "s", verified: true },
    });

    const req = makeRequest({
      session_id: "s1",
      round_number: 1,
      player_move: "rock",
    });
    await POST(req);

    expect(mockedDeletePreCommit).toHaveBeenCalledWith("s1", 1);
  });

  it("calls getPreCommit with correct session_id and round_number", async () => {
    mockedGetPreCommit.mockReturnValue(undefined);

    const req = makeRequest({
      session_id: "my-session",
      round_number: 5,
      player_move: "paper",
    });
    await POST(req);

    expect(mockedGetPreCommit).toHaveBeenCalledWith("my-session", 5);
  });
});
