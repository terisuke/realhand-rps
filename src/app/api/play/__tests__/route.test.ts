import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/play/route";

const TEST_UUID = "550e8400-e29b-41d4-a716-446655440000";
const TEST_UUID_2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

vi.mock("@/application/services/pre-commit-store", () => ({
  getPreCommit: vi.fn(),
  deletePreCommit: vi.fn(),
}));

vi.mock("@/application/use-cases/submit-move", () => ({
  submitMove: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/match-repository", () => ({
  saveMatch: vi.fn(),
}));

import { getPreCommit, deletePreCommit } from "@/application/services/pre-commit-store";
import { submitMove } from "@/application/use-cases/submit-move";
import { saveMatch } from "@/infrastructure/supabase/match-repository";

const mockedGetPreCommit = vi.mocked(getPreCommit);
const mockedDeletePreCommit = vi.mocked(deletePreCommit);
const mockedSubmitMove = vi.mocked(submitMove);
const mockedSaveMatch = vi.mocked(saveMatch);

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
    mockedGetPreCommit.mockResolvedValue(undefined);

    const req = makeRequest({
      session_id: TEST_UUID,
      round_number: 1,
      player_move: "rock",
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("No pre-commit found");
  });

  it("returns result when pre-commit exists", async () => {
    mockedGetPreCommit.mockResolvedValue({
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
      session_id: TEST_UUID,
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
      persisted: true,
    });
  });

  it("returns persisted false when Supabase save fails", async () => {
    mockedGetPreCommit.mockResolvedValue({
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

    mockedSaveMatch.mockRejectedValue(new Error("DB connection lost"));

    const req = makeRequest({
      session_id: TEST_UUID,
      round_number: 1,
      player_move: "rock",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.persisted).toBe(false);
  });

  it("deletes pre-commit after retrieval", async () => {
    mockedGetPreCommit.mockResolvedValue({
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
      session_id: TEST_UUID_2,
      round_number: 1,
      player_move: "rock",
    });
    await POST(req);

    expect(mockedDeletePreCommit).toHaveBeenCalledWith(TEST_UUID_2, 1);
  });

  it("calls getPreCommit with correct session_id and round_number", async () => {
    mockedGetPreCommit.mockResolvedValue(undefined);

    const req = makeRequest({
      session_id: TEST_UUID,
      round_number: 5,
      player_move: "paper",
    });
    await POST(req);

    expect(mockedGetPreCommit).toHaveBeenCalledWith(TEST_UUID, 5);
  });
});
