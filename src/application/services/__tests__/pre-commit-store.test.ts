import { describe, it, expect, beforeEach } from "vitest";
import {
  savePreCommit,
  getPreCommit,
  deletePreCommit,
  clearAllPreCommits,
  type PreCommitData,
} from "@/application/services/pre-commit-store";

const makeData = (overrides: Partial<PreCommitData> = {}): PreCommitData => ({
  aiMove: "rock",
  salt: "test-salt-abc",
  commitHash: "hash-abc-123",
  personality: "provocative",
  history: [],
  currentRound: 1,
  ...overrides,
});

describe("pre-commit-store (in-memory fallback)", () => {
  beforeEach(() => {
    clearAllPreCommits();
  });

  it("saves and retrieves a pre-commit", async () => {
    const data = makeData();
    await savePreCommit("session-1", 1, data);

    const result = await getPreCommit("session-1", 1);
    expect(result).toEqual(data);
  });

  it("returns undefined for non-existent key", async () => {
    expect(await getPreCommit("no-session", 1)).toBeUndefined();
  });

  it("uses session_id:round_number as composite key", async () => {
    const data1 = makeData({ aiMove: "rock", currentRound: 1 });
    const data2 = makeData({ aiMove: "paper", currentRound: 2 });

    await savePreCommit("session-1", 1, data1);
    await savePreCommit("session-1", 2, data2);

    const r1 = await getPreCommit("session-1", 1);
    const r2 = await getPreCommit("session-1", 2);
    expect(r1?.aiMove).toBe("rock");
    expect(r2?.aiMove).toBe("paper");
  });

  it("deletes a pre-commit", async () => {
    await savePreCommit("session-1", 1, makeData());
    await deletePreCommit("session-1", 1);

    expect(await getPreCommit("session-1", 1)).toBeUndefined();
  });

  it("clearAllPreCommits removes all entries", async () => {
    await savePreCommit("s1", 1, makeData());
    await savePreCommit("s2", 2, makeData());
    clearAllPreCommits();

    expect(await getPreCommit("s1", 1)).toBeUndefined();
    expect(await getPreCommit("s2", 2)).toBeUndefined();
  });

  it("overwrites existing entry on save", async () => {
    await savePreCommit("s1", 1, makeData({ aiMove: "rock" }));
    await savePreCommit("s1", 1, makeData({ aiMove: "scissors" }));

    const result = await getPreCommit("s1", 1);
    expect(result?.aiMove).toBe("scissors");
  });
});
