import { describe, it, expect } from "vitest";
import { Move, MoveType } from "@/domain/game/move";
import { judge } from "@/domain/game/round-result";

describe("Move.of", () => {
  it("rock, paper, scissors を生成できる", () => {
    expect(Move.of("rock").type).toBe("rock");
    expect(Move.of("paper").type).toBe("paper");
    expect(Move.of("scissors").type).toBe("scissors");
  });

  it("不正な入力でエラーを投げる", () => {
    expect(() => Move.of("invalid" as MoveType)).toThrow();
  });
});

describe("Move.random", () => {
  it("有効な手を返す", () => {
    const valid: MoveType[] = ["rock", "paper", "scissors"];
    for (let i = 0; i < 30; i++) {
      const m = Move.random();
      expect(valid).toContain(m.type);
    }
  });
});

describe("move.beats", () => {
  it("rock は scissors に勝つ", () => {
    expect(Move.of("rock").beats(Move.of("scissors"))).toBe(true);
  });

  it("scissors は paper に勝つ", () => {
    expect(Move.of("scissors").beats(Move.of("paper"))).toBe(true);
  });

  it("paper は rock に勝つ", () => {
    expect(Move.of("paper").beats(Move.of("rock"))).toBe(true);
  });

  it("同じ手は勝たない", () => {
    expect(Move.of("rock").beats(Move.of("rock"))).toBe(false);
  });

  it("負ける場合は false", () => {
    expect(Move.of("scissors").beats(Move.of("rock"))).toBe(false);
  });
});

describe("move.losesTo", () => {
  it("scissors は rock に負ける", () => {
    expect(Move.of("scissors").losesTo(Move.of("rock"))).toBe(true);
  });

  it("paper は scissors に負ける", () => {
    expect(Move.of("paper").losesTo(Move.of("scissors"))).toBe(true);
  });

  it("rock は paper に負ける", () => {
    expect(Move.of("rock").losesTo(Move.of("paper"))).toBe(true);
  });

  it("勝てる相手には負けない", () => {
    expect(Move.of("rock").losesTo(Move.of("scissors"))).toBe(false);
  });
});

describe("Move.counter", () => {
  it("rock に勝つ手は paper", () => {
    expect(Move.counter(Move.of("rock")).type).toBe("paper");
  });

  it("paper に勝つ手は scissors", () => {
    expect(Move.counter(Move.of("paper")).type).toBe("scissors");
  });

  it("scissors に勝つ手は rock", () => {
    expect(Move.counter(Move.of("scissors")).type).toBe("rock");
  });
});

describe("move.jpLabel", () => {
  it("rock → グー", () => {
    expect(Move.of("rock").jpLabel()).toBe("グー");
  });

  it("scissors → チョキ", () => {
    expect(Move.of("scissors").jpLabel()).toBe("チョキ");
  });

  it("paper → パー", () => {
    expect(Move.of("paper").jpLabel()).toBe("パー");
  });
});

describe("move.equals", () => {
  it("同じ手は等しい", () => {
    expect(Move.of("rock").equals(Move.of("rock"))).toBe(true);
    expect(Move.of("paper").equals(Move.of("paper"))).toBe(true);
    expect(Move.of("scissors").equals(Move.of("scissors"))).toBe(true);
  });

  it("異なる手は等しくない", () => {
    expect(Move.of("rock").equals(Move.of("paper"))).toBe(false);
    expect(Move.of("scissors").equals(Move.of("rock"))).toBe(false);
  });
});

describe("judge (9通りの組み合わせ)", () => {
  it("player=rock, ai=scissors → win", () => {
    expect(judge(Move.of("rock"), Move.of("scissors"))).toBe("win");
  });

  it("player=scissors, ai=paper → win", () => {
    expect(judge(Move.of("scissors"), Move.of("paper"))).toBe("win");
  });

  it("player=paper, ai=rock → win", () => {
    expect(judge(Move.of("paper"), Move.of("rock"))).toBe("win");
  });

  it("player=scissors, ai=rock → lose", () => {
    expect(judge(Move.of("scissors"), Move.of("rock"))).toBe("lose");
  });

  it("player=paper, ai=scissors → lose", () => {
    expect(judge(Move.of("paper"), Move.of("scissors"))).toBe("lose");
  });

  it("player=rock, ai=paper → lose", () => {
    expect(judge(Move.of("rock"), Move.of("paper"))).toBe("lose");
  });

  it("player=rock, ai=rock → draw", () => {
    expect(judge(Move.of("rock"), Move.of("rock"))).toBe("draw");
  });

  it("player=paper, ai=paper → draw", () => {
    expect(judge(Move.of("paper"), Move.of("paper"))).toBe("draw");
  });

  it("player=scissors, ai=scissors → draw", () => {
    expect(judge(Move.of("scissors"), Move.of("scissors"))).toBe("draw");
  });
});
