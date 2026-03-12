import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ButtonRPS from "@/components/ButtonRPS";

// ---------------------------------------------------------------------------
// Mock framer-motion - must faithfully pass through onClick/disabled/aria-label
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  motion: {
    button: (props: Record<string, unknown>) => {
      const {
        children,
        className,
        onClick,
        disabled,
        "aria-label": ariaLabel,
      } = props as {
        children?: React.ReactNode;
        className?: string;
        onClick?: () => void;
        disabled?: boolean;
        "aria-label"?: string;
      };
      return (
        <button
          className={className}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {children}
        </button>
      );
    },
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ButtonRPS", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders three move buttons with correct labels", () => {
    const onSelect = vi.fn();
    render(<ButtonRPS onSelect={onSelect} />);

    expect(screen.getByText("グー")).toBeTruthy();
    expect(screen.getByText("チョキ")).toBeTruthy();
    expect(screen.getByText("パー")).toBeTruthy();
  });

  it("renders buttons with accessible aria-labels", () => {
    const onSelect = vi.fn();
    render(<ButtonRPS onSelect={onSelect} />);

    expect(screen.getByLabelText("グー")).toBeTruthy();
    expect(screen.getByLabelText("チョキ")).toBeTruthy();
    expect(screen.getByLabelText("パー")).toBeTruthy();
  });

  it("calls onSelect with correct move when clicked", () => {
    const onSelect = vi.fn();
    render(<ButtonRPS onSelect={onSelect} />);

    fireEvent.click(screen.getByLabelText("グー"));
    expect(onSelect).toHaveBeenCalledWith("rock");

    fireEvent.click(screen.getByLabelText("チョキ"));
    expect(onSelect).toHaveBeenCalledWith("scissors");

    fireEvent.click(screen.getByLabelText("パー"));
    expect(onSelect).toHaveBeenCalledWith("paper");
  });

  it("does not call onSelect when disabled", () => {
    const onSelect = vi.fn();
    render(<ButtonRPS onSelect={onSelect} disabled={true} />);

    // The component guards with `!disabled && onSelect(move)` in onClick,
    // and also sets disabled on the button element
    fireEvent.click(screen.getByLabelText("グー"));
    fireEvent.click(screen.getByLabelText("チョキ"));
    fireEvent.click(screen.getByLabelText("パー"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("buttons have disabled attribute when disabled prop is true", () => {
    const onSelect = vi.fn();
    render(<ButtonRPS onSelect={onSelect} disabled={true} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toHaveProperty("disabled", true);
    }
  });

  it("buttons are not disabled by default", () => {
    const onSelect = vi.fn();
    render(<ButtonRPS onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toHaveProperty("disabled", false);
    }
  });
});
