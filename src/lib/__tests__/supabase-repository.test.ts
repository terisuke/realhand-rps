import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the @supabase/supabase-js module BEFORE importing the module under test
// ---------------------------------------------------------------------------

const mockInsert = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelectChain = {
  eq: mockEq,
};
const mockSelect = vi.fn().mockReturnValue(mockSelectChain);
const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: mockSelect,
});

let mockUrl: string | undefined = "https://test.supabase.co";
let mockKey: string | undefined = "test-anon-key";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Override env vars before import
const originalEnv = { ...process.env };

describe("supabase repository - saveMatch", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockUrl = "https://test.supabase.co";
    mockKey = "test-anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockKey;

    // Reset chain mocks
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it("calls supabase.from('matches').insert with correct shape", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { saveMatch } = await import("@/lib/supabase");

    const match = {
      session_id: "test-session",
      player_move: "rock" as const,
      ai_move: "paper" as const,
      result: "lose" as const,
      round: 1,
    };

    await saveMatch(match);

    expect(mockFrom).toHaveBeenCalledWith("matches");
    expect(mockInsert).toHaveBeenCalledWith(match);
  });

  it("does not throw when insert returns error (logs only)", async () => {
    mockInsert.mockResolvedValue({
      error: { message: "insert failed" },
    });

    const { saveMatch } = await import("@/lib/supabase");

    // Should not throw
    await expect(
      saveMatch({
        session_id: "test-session",
        player_move: "scissors" as const,
        ai_move: "rock" as const,
        result: "lose" as const,
        round: 2,
      })
    ).resolves.toBeUndefined();
  });
});

describe("supabase repository - getSessionHistory", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockUrl = "https://test.supabase.co";
    mockKey = "test-anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockKey;

    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it("returns ordered match data for a session", async () => {
    const mockData = [
      {
        id: "1",
        session_id: "sess-1",
        player_move: "rock",
        ai_move: "paper",
        result: "lose",
        round: 1,
      },
      {
        id: "2",
        session_id: "sess-1",
        player_move: "scissors",
        ai_move: "rock",
        result: "lose",
        round: 2,
      },
    ];

    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const { getSessionHistory } = await import("@/lib/supabase");
    const result = await getSessionHistory("sess-1");

    expect(mockFrom).toHaveBeenCalledWith("matches");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("session_id", "sess-1");
    expect(mockOrder).toHaveBeenCalledWith("round", { ascending: true });
    expect(result).toEqual(mockData);
  });

  it("returns empty array on error", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "query failed" },
    });

    const { getSessionHistory } = await import("@/lib/supabase");
    const result = await getSessionHistory("sess-bad");

    expect(result).toEqual([]);
  });

  it("returns empty array when data is null but no error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const { getSessionHistory } = await import("@/lib/supabase");
    const result = await getSessionHistory("sess-empty");

    expect(result).toEqual([]);
  });
});

describe("supabase repository - unconfigured (no env vars)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  it("saveMatch returns undefined when supabase is not configured", async () => {
    const { saveMatch } = await import("@/lib/supabase");

    await expect(
      saveMatch({
        session_id: "test",
        player_move: "rock" as const,
        ai_move: "paper" as const,
        result: "lose" as const,
        round: 1,
      })
    ).resolves.toBeUndefined();

    // from() should NOT have been called
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("getSessionHistory returns empty array when supabase is not configured", async () => {
    const { getSessionHistory } = await import("@/lib/supabase");

    const result = await getSessionHistory("sess-1");
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// Needed for afterAll in unconfigured tests
import { afterAll } from "vitest";
