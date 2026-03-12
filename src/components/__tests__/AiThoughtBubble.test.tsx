import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import AiThoughtBubble from "@/components/AiThoughtBubble";

// ---------------------------------------------------------------------------
// Mock framer-motion
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
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AiThoughtBubble", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders thought text when provided", () => {
    render(<AiThoughtBubble thought="あなたの癖、もう掴んだ。" />);

    expect(
      screen.getByText("あなたの癖、もう掴んだ。")
    ).toBeTruthy();
  });

  it("renders AI label prefix", () => {
    render(<AiThoughtBubble thought="テスト思考" />);

    expect(screen.getByText("AI:")).toBeTruthy();
  });

  it("renders nothing when thought is null", () => {
    const { container } = render(<AiThoughtBubble thought={null} />);

    expect(container.textContent).toBe("");
  });
});
