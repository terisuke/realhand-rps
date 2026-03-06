import type { MoveType } from "@/domain/game/move";

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function generateSalt(): string {
  return crypto.randomUUID();
}

export async function createCommitHash(move: MoveType, salt: string): Promise<string> {
  return sha256(`${move.length}:${move}|${salt.length}:${salt}`);
}

export async function verifyCommitHash(
  move: MoveType,
  salt: string,
  hash: string
): Promise<boolean> {
  const computed = await createCommitHash(move, salt);
  return constantTimeEqual(computed, hash);
}
