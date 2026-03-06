import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "../useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial state is idle with empty label", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    expect(result.current.phase).toBe("idle");
    expect(result.current.label).toBe("");
    expect(result.current.isActive).toBe(false);
  });

  it("start() transitions through janken -> ken -> pon -> reveal", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("janken");
    expect(result.current.label).toBe("じゃん");
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.phase).toBe("ken");
    expect(result.current.label).toBe("けん");
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.phase).toBe("pon");
    expect(result.current.label).toBe("ぽん！");
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.phase).toBe("reveal");
    expect(result.current.label).toBe("");
    expect(result.current.isActive).toBe(false);
  });

  it("onComplete is called exactly once at reveal", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start();
    });

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reset() returns to idle and clears timeouts", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.phase).toBe("ken");

    act(() => {
      result.current.reset();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.label).toBe("");
    expect(result.current.isActive).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.phase).toBe("idle");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("start() while active is ignored", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("janken");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("ken");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.phase).toBe("reveal");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("cleanup on unmount clears timeouts", () => {
    const onComplete = vi.fn();
    const { result, unmount } = renderHook(() =>
      useCountdown({ onComplete })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("janken");

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
