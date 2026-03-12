import { describe, it, expect } from "vitest";
import { MOVES, Move, type MoveType } from "@/domain/game/move";
import { judge } from "@/domain/game/round-result";
import { metaStrategyDecide } from "@/domain/ai/meta-strategy";
import { getReadableBias } from "@/domain/ai/readable-pattern";
import type { PredictorInput } from "@/domain/ai/predictor";
import type { GamePhase } from "@/domain/game/game-phase";

function randomMove(): MoveType {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

function simulateGame(rounds: number): { aiWins: number; playerWins: number } {
  const history: PredictorInput[] = [];
  let aiWins = 0;
  let playerWins = 0;

  for (let round = 0; round < rounds; round++) {
    const phase: GamePhase =
      round < 10 ? "opening" : round < 20 ? "midgame" : "endgame";
    const lastAiMove = history.length > 0 ? history[history.length - 1].aiMove : undefined;
    const bias = getReadableBias(phase, lastAiMove);

    const aiResult = metaStrategyDecide(history, phase, bias);
    const playerMove = randomMove();
    const result = judge(Move.of(playerMove), Move.of(aiResult.move));

    if (result === "win") playerWins++;
    if (result === "lose") aiWins++;

    history.push({
      playerMove,
      result,
      aiMove: aiResult.move,
    });
  }

  return { aiWins, playerWins };
}

describe("AI Strategy Integration", () => {
  it("AI win rate > 48% vs random player over 1000 games of 30 rounds", {
    timeout: 30000,
  }, () => {
    let totalAiWins = 0;
    let totalPlayerWins = 0;

    for (let game = 0; game < 1000; game++) {
      const { aiWins, playerWins } = simulateGame(30);
      totalAiWins += aiWins;
      totalPlayerWins += playerWins;
    }

    const totalDecisive = totalAiWins + totalPlayerWins;
    const aiWinRate = totalAiWins / totalDecisive;

    expect(aiWinRate).toBeGreaterThan(0.48);
  });

  it("readable patterns present in opening phase", () => {
    const bias = getReadableBias("opening");

    const values = [bias.rock, bias.paper, bias.scissors];
    const allEqual = values.every((v) => v === values[0]);
    expect(allEqual).toBe(false);

    expect(bias.paper).toBeGreaterThan(bias.rock);
    expect(bias.paper).toBeGreaterThan(bias.scissors);
  });

  it("stateless reconstruction equivalence — same history produces same decision", () => {
    // Build a deterministic history (no randomness) so predictors have enough data
    const moves: MoveType[] = ["rock", "paper", "scissors", "rock", "rock", "paper", "scissors", "rock", "paper", "paper", "scissors", "rock", "rock", "paper", "scissors"];
    const history: PredictorInput[] = moves.map((playerMove, i) => {
      const aiMove = MOVES[i % 3];
      const result = judge(Move.of(playerMove), Move.of(aiMove));
      return { playerMove, result, aiMove };
    });

    const phase: GamePhase = "midgame";
    const lastAiMove = history[history.length - 1].aiMove;
    const bias = getReadableBias(phase, lastAiMove);

    const result1 = metaStrategyDecide(history, phase, bias);
    const result2 = metaStrategyDecide(history, phase, bias);

    expect(result1.move).toBe(result2.move);
    expect(result1.scores.length).toBe(result2.scores.length);
  });

  it.each([0, 1, 5, 10, 29])(
    "MetaStrategy returns valid move for history length %i",
    (length) => {
      const history: PredictorInput[] = Array.from({ length }, () => ({
        playerMove: randomMove(),
        result: "draw" as const,
        aiMove: randomMove(),
      }));

      const phase: GamePhase = length < 10 ? "opening" : length < 20 ? "midgame" : "endgame";
      const lastAiMove = history.length > 0 ? history[history.length - 1].aiMove : undefined;
      const bias = getReadableBias(phase, lastAiMove);

      const result = metaStrategyDecide(history, phase, bias);

      expect(MOVES).toContain(result.move);
      expect(result.scores).toBeDefined();
      expect(result.scores.length).toBeGreaterThan(0);
      expect(result.topReason).toBeTruthy();
    }
  );
});
