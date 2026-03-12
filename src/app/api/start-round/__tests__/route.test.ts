import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

vi.mock("@/application/use-cases/start-round", () => ({
  startRound: vi.fn().mockResolvedValue({
    roundNumber: 1,
    commitHash: "a".repeat(64),
    aiMove: "rock",
    salt: "test-salt",
  }),
}));

vi.mock("@/application/services/pre-commit-store", () => ({
  savePreCommit: vi.fn(),
  getPreCommit: vi.fn(),
  deletePreCommit: vi.fn(),
  clearAllPreCommits: vi.fn(),
}));

function createRequest(body: unknown): NextRequest {
  const jsonString = typeof body === "string" ? body : JSON.stringify(body);
  return new NextRequest("http://localhost:3000/api/start-round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonString,
  });
}

describe("POST /api/start-round", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with round_number and commit_hash on valid request", async () => {
    const req = createRequest({
      session_id: "test-session-123",
      current_round: 1,
      personality: "analytical",
      rounds: [],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.round_number).toBe(1);
    expect(data.commit_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.aiMove).toBeUndefined();
    expect(data.salt).toBeUndefined();
  });

  it("returns 400 when session_id is missing", async () => {
    const req = createRequest({ current_round: 1 });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Bad request");
  });

  it("returns 400 when session_id is empty string", async () => {
    const req = createRequest({ session_id: "" });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/start-round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{{{",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.details).toBe("Invalid JSON");
  });

  it("returns 400 when personality is invalid", async () => {
    const req = createRequest({
      session_id: "test",
      personality: "normal",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("does not leak aiMove or salt in response", async () => {
    const req = createRequest({
      session_id: "secure-session",
      current_round: 1,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    const keys = Object.keys(data);
    expect(keys).not.toContain("aiMove");
    expect(keys).not.toContain("ai_move");
    expect(keys).not.toContain("salt");
  });
});
