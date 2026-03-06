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

describe("pre-commit-store", () => {
  beforeEach(() => {
    clearAllPreCommits();
  });

  it("saves and retrieves a pre-commit", () => {
    const data = makeData();
    savePreCommit("session-1", 1, data);

    const result = getPreCommit("session-1", 1);
    expect(result).toEqual(data);
  });

  it("returns undefined for non-existent key", () => {
    expect(getPreCommit("no-session", 1)).toBeUndefined();
  });

  it("uses session_id:round_number as composite key", () => {
    const data1 = makeData({ aiMove: "rock", currentRound: 1 });
    const data2 = makeData({ aiMove: "paper", currentRound: 2 });

    savePreCommit("session-1", 1, data1);
    savePreCommit("session-1", 2, data2);

    expect(getPreCommit("session-1", 1)?.aiMove).toBe("rock");
    expect(getPreCommit("session-1", 2)?.aiMove).toBe("paper");
  });

  it("deletes a pre-commit", () => {
    savePreCommit("session-1", 1, makeData());
    deletePreCommit("session-1", 1);

    expect(getPreCommit("session-1", 1)).toBeUndefined();
  });

  it("clearAllPreCommits removes all entries", () => {
    savePreCommit("s1", 1, makeData());
    savePreCommit("s2", 2, makeData());
    clearAllPreCommits();

    expect(getPreCommit("s1", 1)).toBeUndefined();
    expect(getPreCommit("s2", 2)).toBeUndefined();
  });

  it("overwrites existing entry on save", () => {
    savePreCommit("s1", 1, makeData({ aiMove: "rock" }));
    savePreCommit("s1", 1, makeData({ aiMove: "scissors" }));

    expect(getPreCommit("s1", 1)?.aiMove).toBe("scissors");
  });
});
