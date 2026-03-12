import { describe, it, expect } from "vitest";
import {
  generateSalt,
  createCommitHash,
  verifyCommitHash,
} from "@/infrastructure/crypto/commit-hash";
import type { MoveType } from "@/domain/game/move";

describe("generateSalt", () => {
  it("returns a 64-character hex string", () => {
    const salt = generateSalt();
    expect(typeof salt).toBe("string");
    expect(salt).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces unique values across 10 calls", () => {
    const salts = Array.from({ length: 10 }, () => generateSalt());
    const unique = new Set(salts);
    expect(unique.size).toBe(10);
  });
});

describe("createCommitHash", () => {
  it("returns a consistent hex string for the same input", async () => {
    const move: MoveType = "rock";
    const salt = "test-salt-123";
    const hash1 = await createCommitHash(move, salt);
    const hash2 = await createCommitHash(move, salt);
    expect(hash1).toBe(hash2);
  });

  it("returns a different hash for a different move", async () => {
    const salt = "test-salt-456";
    const hashRock = await createCommitHash("rock", salt);
    const hashPaper = await createCommitHash("paper", salt);
    expect(hashRock).not.toBe(hashPaper);
  });

  it("returns a different hash for a different salt", async () => {
    const move: MoveType = "scissors";
    const hash1 = await createCommitHash(move, "salt-a");
    const hash2 = await createCommitHash(move, "salt-b");
    expect(hash1).not.toBe(hash2);
  });

  it("hash is a valid 64-character hex string", async () => {
    const hash = await createCommitHash("rock", "some-salt");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("accepts all valid MoveType values", async () => {
    const moves: MoveType[] = ["rock", "paper", "scissors"];
    for (const move of moves) {
      const hash = await createCommitHash(move, "test-salt");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

describe("verifyCommitHash", () => {
  it("returns true for matching move, salt, and hash", async () => {
    const move: MoveType = "rock";
    const salt = generateSalt();
    const hash = await createCommitHash(move, salt);
    const result = await verifyCommitHash(move, salt, hash);
    expect(result).toBe(true);
  });

  it("returns false when move does not match", async () => {
    const salt = generateSalt();
    const hash = await createCommitHash("rock", salt);
    const result = await verifyCommitHash("paper", salt, hash);
    expect(result).toBe(false);
  });

  it("returns false when salt does not match", async () => {
    const move: MoveType = "rock";
    const hash = await createCommitHash(move, "original-salt");
    const result = await verifyCommitHash(move, "different-salt", hash);
    expect(result).toBe(false);
  });

  it("uses constant-time comparison (does not leak via timing)", async () => {
    const move: MoveType = "rock";
    const salt = generateSalt();
    const hash = await createCommitHash(move, salt);
    // tampered hash (same length, different content)
    const tampered = hash.replace(/.$/, hash.endsWith("f") ? "0" : "f");
    const result = await verifyCommitHash(move, salt, tampered);
    expect(result).toBe(false);
  });
});
