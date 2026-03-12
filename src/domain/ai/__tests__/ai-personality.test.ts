import { describe, it, expect } from "vitest";
import {
  getPersonality,
  randomPersonalityType,
  getTemplate,
  ALL_PERSONALITIES,
  type AiPersonality,
  type AiPersonalityType,
  type Situation,
} from "@/domain/ai/ai-personality";

const ALL_SITUATIONS: Situation[] = [
  "opening",
  "winning_streak",
  "losing_streak",
  "player_predictable",
  "player_unpredictable",
  "close_game",
  "dominating",
  "being_dominated",
  "milestone",
  "endgame",
];

const ALL_RESULTS: ("win" | "lose" | "draw")[] = ["win", "lose", "draw"];

const ALL_TYPES: AiPersonalityType[] = ["provocative", "analytical", "uncanny"];

describe("ALL_PERSONALITIES", () => {
  it("ちょうど3つのエントリを持つ", () => {
    expect(ALL_PERSONALITIES).toHaveLength(3);
  });

  it("3種類すべてのタイプを含む", () => {
    const types = ALL_PERSONALITIES.map((p) => p.type);
    expect(types).toContain("provocative");
    expect(types).toContain("analytical");
    expect(types).toContain("uncanny");
  });

  it("配列が frozen で push できない", () => {
    expect(() => {
      (ALL_PERSONALITIES as AiPersonality[]).push({} as AiPersonality);
    }).toThrow();
  });
});

describe("getPersonality", () => {
  it.each(ALL_TYPES)("%s タイプを返す", (type) => {
    const p = getPersonality(type);
    expect(p.type).toBe(type);
    expect(p.name).toBeTruthy();
    expect(p.description).toBeTruthy();
  });

  it("各パーソナリティはすべてのSituationとResultに対してテンプレートを持つ", () => {
    for (const type of ALL_TYPES) {
      const p = getPersonality(type);
      for (const situation of ALL_SITUATIONS) {
        for (const result of ALL_RESULTS) {
          expect(p.thoughtTemplates[situation][result]).toBeDefined();
          expect(Array.isArray(p.thoughtTemplates[situation][result])).toBe(true);
          expect(p.thoughtTemplates[situation][result].length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("各パーソナリティは合計で少なくとも10個のテンプレートを持つ", () => {
    for (const type of ALL_TYPES) {
      const p = getPersonality(type);
      const totalTemplates = ALL_SITUATIONS.reduce(
        (sum, s) => sum + p.thoughtTemplates[s].win.length + p.thoughtTemplates[s].lose.length + p.thoughtTemplates[s].draw.length,
        0
      );
      expect(totalTemplates).toBeGreaterThanOrEqual(10);
    }
  });
});

describe("randomPersonalityType", () => {
  it("有効なパーソナリティタイプを返す", () => {
    for (let i = 0; i < 30; i++) {
      const type = randomPersonalityType();
      expect(ALL_TYPES).toContain(type);
    }
  });

  it("複数回呼び出すと少なくとも2種類を返す（確率的）", () => {
    const results = new Set<AiPersonalityType>();
    for (let i = 0; i < 100; i++) {
      results.add(randomPersonalityType());
    }
    expect(results.size).toBeGreaterThanOrEqual(2);
  });
});

describe("getTemplate", () => {
  it.each(ALL_SITUATIONS)("situation=%s に対して各resultで文字列を返す", (situation) => {
    for (const type of ALL_TYPES) {
      const p = getPersonality(type);
      for (const result of ALL_RESULTS) {
        const template = getTemplate(p, situation, result);
        expect(typeof template).toBe("string");
        expect(template.length).toBeGreaterThan(0);
      }
    }
  });

  it("テンプレートは日本語を含む", () => {
    for (const type of ALL_TYPES) {
      const p = getPersonality(type);
      for (const result of ALL_RESULTS) {
        const template = getTemplate(p, "opening", result);
        expect(/[\u3040-\u9FFF]/.test(template)).toBe(true);
      }
    }
  });

  it("resultごとに異なるテンプレートプールから返す", () => {
    const p = getPersonality("provocative");
    const winTemplates = p.thoughtTemplates.opening.win;
    const loseTemplates = p.thoughtTemplates.opening.lose;
    const drawTemplates = p.thoughtTemplates.opening.draw;
    // win/lose/draw テンプレートは互いに重複しない
    for (const t of winTemplates) {
      expect(loseTemplates).not.toContain(t);
      expect(drawTemplates).not.toContain(t);
    }
  });
});
