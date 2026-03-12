import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Mock the supabase client module
// ---------------------------------------------------------------------------

const mockInsert = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: mockSelect,
});

let mockSupabaseConfigured = true;

vi.mock("@/infrastructure/supabase/client", () => ({
  get supabase() {
    if (!mockSupabaseConfigured) return null;
    return { from: mockFrom };
  },
  get isSupabaseConfigured() {
    return mockSupabaseConfigured;
  },
}));

describe("match-repository - saveMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseConfigured = true;
    mockFrom.mockReturnValue({ insert: mockInsert, select: mockSelect });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it("calls supabase.from('matches').insert with correct shape", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { saveMatch } = await import(
      "@/infrastructure/supabase/match-repository"
    );

    await saveMatch({
      sessionId: "test-session",
      roundNumber: 1,
      playerMove: "rock",
      aiMove: "paper",
      result: "lose",
      thought: "テスト思考",
      phase: "opening",
    });

    expect(mockFrom).toHaveBeenCalledWith("matches");
    expect(mockInsert).toHaveBeenCalledWith({
      session_id: "test-session",
      round_number: 1,
      player_move: "rock",
      ai_move: "paper",
      result: "lose",
      thought: "テスト思考",
      phase: "opening",
    });
  });

  it("does not throw when insert returns error (logs only)", async () => {
    mockInsert.mockResolvedValue({
      error: { message: "insert failed" },
    });

    const { saveMatch } = await import(
      "@/infrastructure/supabase/match-repository"
    );

    await expect(
      saveMatch({
        sessionId: "test-session",
        roundNumber: 2,
        playerMove: "scissors",
        aiMove: "rock",
        result: "lose",
        thought: "",
        phase: "midgame",
      })
    ).resolves.toBeUndefined();
  });
});

describe("match-repository - getMatchesBySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseConfigured = true;
    mockFrom.mockReturnValue({ insert: mockInsert, select: mockSelect });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it("returns ordered match data for a session", async () => {
    const mockData = [
      {
        id: "1",
        session_id: "sess-1",
        round_number: 1,
        player_move: "rock",
        ai_move: "paper",
        result: "lose",
        thought: "",
        phase: "opening",
        created_at: "2026-03-12T00:00:00Z",
      },
      {
        id: "2",
        session_id: "sess-1",
        round_number: 2,
        player_move: "scissors",
        ai_move: "rock",
        result: "lose",
        thought: "",
        phase: "opening",
        created_at: "2026-03-12T00:01:00Z",
      },
    ];

    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const { getMatchesBySession } = await import(
      "@/infrastructure/supabase/match-repository"
    );
    const result = await getMatchesBySession("sess-1");

    expect(mockFrom).toHaveBeenCalledWith("matches");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("session_id", "sess-1");
    expect(mockOrder).toHaveBeenCalledWith("round_number", {
      ascending: true,
    });
    expect(result).toEqual(mockData);
  });

  it("returns empty array on error", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "query failed" },
    });

    const { getMatchesBySession } = await import(
      "@/infrastructure/supabase/match-repository"
    );
    const result = await getMatchesBySession("sess-bad");

    expect(result).toEqual([]);
  });

  it("returns empty array when data is null but no error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const { getMatchesBySession } = await import(
      "@/infrastructure/supabase/match-repository"
    );
    const result = await getMatchesBySession("sess-empty");

    expect(result).toEqual([]);
  });
});

describe("match-repository - unconfigured (no supabase)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseConfigured = false;
  });

  afterAll(() => {
    mockSupabaseConfigured = true;
  });

  it("saveMatch returns undefined when supabase is not configured", async () => {
    const { saveMatch } = await import(
      "@/infrastructure/supabase/match-repository"
    );

    await expect(
      saveMatch({
        sessionId: "test",
        roundNumber: 1,
        playerMove: "rock",
        aiMove: "paper",
        result: "lose",
        thought: "",
        phase: "opening",
      })
    ).resolves.toBeUndefined();

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("getMatchesBySession returns empty array when supabase is not configured", async () => {
    const { getMatchesBySession } = await import(
      "@/infrastructure/supabase/match-repository"
    );

    const result = await getMatchesBySession("sess-1");
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
