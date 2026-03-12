import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import GameResult from "@/components/GameResult";
import type { Move, Result } from "@/types";

// ---------------------------------------------------------------------------
// Mock framer-motion to render plain elements
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    p: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => <p className={className}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GameResult", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders player and AI move labels", () => {
    render(
      <GameResult playerMove="rock" aiMove="scissors" result="win" />
    );

    expect(screen.getByText("グー")).toBeTruthy();
    expect(screen.getByText("チョキ")).toBeTruthy();
  });

  it("renders player and AI emoji", () => {
    const { container } = render(
      <GameResult playerMove="paper" aiMove="rock" result="win" />
    );

    expect(container.textContent).toContain("\u270B");
    expect(container.textContent).toContain("\u270A");
  });

  it("displays win result text", () => {
    render(
      <GameResult playerMove="rock" aiMove="scissors" result="win" />
    );

    expect(screen.getByText("あなたの勝ち！")).toBeTruthy();
  });

  it("displays lose result text", () => {
    render(
      <GameResult playerMove="rock" aiMove="paper" result="lose" />
    );

    expect(screen.getByText("AIの勝ち…")).toBeTruthy();
  });

  it("displays draw result text", () => {
    render(
      <GameResult playerMove="rock" aiMove="rock" result="draw" />
    );

    expect(screen.getByText("引き分け")).toBeTruthy();
  });

  it("shows VS separator", () => {
    render(
      <GameResult playerMove="scissors" aiMove="rock" result="lose" />
    );

    expect(screen.getByText("VS")).toBeTruthy();
  });

  it("shows player and AI labels", () => {
    render(
      <GameResult playerMove="paper" aiMove="scissors" result="lose" />
    );

    expect(screen.getByText("あなた")).toBeTruthy();
    expect(screen.getByText("AI")).toBeTruthy();
  });

  it("renders all three result types correctly", () => {
    const cases: Array<{
      playerMove: Move;
      aiMove: Move;
      result: Result;
      expectedLabel: string;
    }> = [
      {
        playerMove: "rock",
        aiMove: "scissors",
        result: "win",
        expectedLabel: "あなたの勝ち！",
      },
      {
        playerMove: "paper",
        aiMove: "scissors",
        result: "lose",
        expectedLabel: "AIの勝ち…",
      },
      {
        playerMove: "scissors",
        aiMove: "scissors",
        result: "draw",
        expectedLabel: "引き分け",
      },
    ];

    for (const { playerMove, aiMove, result, expectedLabel } of cases) {
      cleanup();
      render(
        <GameResult
          playerMove={playerMove}
          aiMove={aiMove}
          result={result}
        />
      );

      expect(screen.getByText(expectedLabel)).toBeTruthy();
    }
  });
});
