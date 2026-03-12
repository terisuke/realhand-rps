import { describe, it, expect } from "vitest";
import {
  MoveSchema,
  StartRoundSchema,
  SubmitMoveSchema,
} from "@/application/schemas";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("MoveSchema", () => {
  it("rock は有効", () => {
    expect(MoveSchema.parse("rock")).toBe("rock");
  });

  it("paper は有効", () => {
    expect(MoveSchema.parse("paper")).toBe("paper");
  });

  it("scissors は有効", () => {
    expect(MoveSchema.parse("scissors")).toBe("scissors");
  });

  it("無効な値はエラー", () => {
    expect(() => MoveSchema.parse("invalid")).toThrow();
  });

  it("空文字はエラー", () => {
    expect(() => MoveSchema.parse("")).toThrow();
  });
});

describe("StartRoundSchema", () => {
  it("有効な session_id を受け付ける（デフォルト値適用）", () => {
    const result = StartRoundSchema.parse({ session_id: VALID_UUID });
    expect(result.session_id).toBe(VALID_UUID);
    expect(result.rounds).toEqual([]);
    expect(result.personality).toBe("analytical");
    expect(result.current_round).toBe(1);
  });

  it("全フィールド指定で受け付ける", () => {
    const result = StartRoundSchema.parse({
      session_id: VALID_UUID,
      rounds: [{ playerMove: "rock", aiMove: "paper", result: "lose" }],
      personality: "provocative",
      current_round: 5,
    });
    expect(result.personality).toBe("provocative");
    expect(result.current_round).toBe(5);
    expect(result.rounds).toHaveLength(1);
  });

  it("session_id が空文字はエラー", () => {
    expect(() => StartRoundSchema.parse({ session_id: "" })).toThrow();
  });

  it("session_id が未定義はエラー", () => {
    expect(() => StartRoundSchema.parse({})).toThrow();
  });

  it("session_id が非UUID文字列はエラー", () => {
    expect(() => StartRoundSchema.parse({ session_id: "abc-123" })).toThrow();
  });

  it("無効な personality はエラー", () => {
    expect(() =>
      StartRoundSchema.parse({ session_id: VALID_UUID, personality: "normal" })
    ).toThrow();
  });

  it("current_round が 0 はエラー", () => {
    expect(() =>
      StartRoundSchema.parse({ session_id: VALID_UUID, current_round: 0 })
    ).toThrow();
  });

  it("current_round が 31 はエラー", () => {
    expect(() =>
      StartRoundSchema.parse({ session_id: VALID_UUID, current_round: 31 })
    ).toThrow();
  });

  it("余分なフィールドは除去される", () => {
    const result = StartRoundSchema.parse({ session_id: VALID_UUID, extra: "field" });
    expect(result).not.toHaveProperty("extra");
    expect(result.session_id).toBe(VALID_UUID);
  });
});

describe("SubmitMoveSchema", () => {
  const valid = {
    session_id: VALID_UUID_2,
    round_number: 1,
    player_move: "rock",
  };

  it("有効な入力を受け付ける", () => {
    const result = SubmitMoveSchema.parse(valid);
    expect(result.session_id).toBe(VALID_UUID_2);
    expect(result.round_number).toBe(1);
    expect(result.player_move).toBe("rock");
  });

  it("session_id が空文字はエラー", () => {
    expect(() => SubmitMoveSchema.parse({ ...valid, session_id: "" })).toThrow();
  });

  it("session_id が未定義はエラー", () => {
    expect(() =>
      SubmitMoveSchema.parse({ round_number: 1, player_move: "rock" })
    ).toThrow();
  });

  it("session_id が非UUID文字列はエラー", () => {
    expect(() =>
      SubmitMoveSchema.parse({ ...valid, session_id: "not-a-uuid" })
    ).toThrow();
  });

  it("無効な player_move はエラー", () => {
    expect(() => SubmitMoveSchema.parse({ ...valid, player_move: "fire" })).toThrow();
  });

  it("round_number が 0 はエラー (min=1)", () => {
    expect(() => SubmitMoveSchema.parse({ ...valid, round_number: 0 })).toThrow();
  });

  it("round_number が 31 はエラー (max=30)", () => {
    expect(() => SubmitMoveSchema.parse({ ...valid, round_number: 31 })).toThrow();
  });

  it("round_number が 1 は有効", () => {
    expect(SubmitMoveSchema.parse({ ...valid, round_number: 1 }).round_number).toBe(1);
  });

  it("round_number が 30 は有効", () => {
    expect(SubmitMoveSchema.parse({ ...valid, round_number: 30 }).round_number).toBe(30);
  });

  it("round_number が小数はエラー", () => {
    expect(() => SubmitMoveSchema.parse({ ...valid, round_number: 1.5 })).toThrow();
  });

  it("余分なフィールドは除去される", () => {
    const result = SubmitMoveSchema.parse({ ...valid, extra: "field" });
    expect(result).not.toHaveProperty("extra");
  });

  it("personality のデフォルトは analytical", () => {
    const result = SubmitMoveSchema.parse(valid);
    expect(result.personality).toBe("analytical");
  });

  it("personality を明示的に指定できる", () => {
    const result = SubmitMoveSchema.parse({ ...valid, personality: "provocative" });
    expect(result.personality).toBe("provocative");
  });

  it("無効な personality はエラー", () => {
    expect(() =>
      SubmitMoveSchema.parse({ ...valid, personality: "unknown" })
    ).toThrow();
  });

  it("rounds のデフォルトは空配列", () => {
    const result = SubmitMoveSchema.parse(valid);
    expect(result.rounds).toEqual([]);
  });

  it("rounds に履歴を渡せる", () => {
    const result = SubmitMoveSchema.parse({
      ...valid,
      rounds: [{ playerMove: "rock", aiMove: "paper", result: "lose" }],
    });
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0].playerMove).toBe("rock");
  });

  it("rounds の要素が不正な場合はエラー", () => {
    expect(() =>
      SubmitMoveSchema.parse({
        ...valid,
        rounds: [{ playerMove: "fire", aiMove: "paper", result: "lose" }],
      })
    ).toThrow();
  });
});
