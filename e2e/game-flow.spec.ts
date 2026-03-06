import { test, expect } from "@playwright/test";
import {
  switchToButtonMode,
  waitForAppReady,
  playOneRound,
  getScores,
} from "./helpers/game-helpers";
import type { HandLabel } from "./helpers/game-helpers";

test.describe("Game Flow - Button Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("initial load shows round header, mode toggle, and zero scores", async ({
    page,
  }) => {
    // Round header
    await expect(page.getByText("Round 1 / 30")).toBeVisible();

    // Mode toggle button shows "Button" when in camera mode
    await expect(
      page.getByRole("button", { name: "Button" }),
    ).toBeVisible();

    // Score board initial state: all zeros
    const scores = await getScores(page);
    expect(scores.w).toBe(0);
    expect(scores.l).toBe(0);
    expect(scores.d).toBe(0);
  });

  test("switching to button mode shows rock/scissors/paper buttons", async ({
    page,
  }) => {
    await switchToButtonMode(page);

    await expect(page.getByRole("button", { name: "グー" })).toBeVisible();
    await expect(page.getByRole("button", { name: "チョキ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "パー" })).toBeVisible();

    // Mode toggle should now show "Camera" (to switch back)
    await expect(
      page.getByRole("button", { name: "Camera" }),
    ).toBeVisible();
  });

  test("complete one round: select hand -> countdown -> result -> round advances", async ({
    page,
  }) => {
    await switchToButtonMode(page);

    await playOneRound(page, "グー");

    // Result text must be visible
    await expect(page.getByTestId("game-result")).toBeVisible();

    // Round counter should advance to 2
    await expect(page.getByText("Round 2 / 30")).toBeVisible({ timeout: 5_000 });
  });

  test("score updates after a round", async ({ page }) => {
    await switchToButtonMode(page);

    const before = await getScores(page);
    expect(before.w + before.l + before.d).toBe(0);

    await playOneRound(page);

    const after = await getScores(page);
    const totalAfter = after.w + after.l + after.d;

    // Exactly one score category should have incremented by 1
    expect(totalAfter).toBe(1);
  });

  test("play 3 consecutive rounds with correct round progression", async ({
    page,
  }) => {
    await switchToButtonMode(page);

    const hands: HandLabel[] = ["グー", "チョキ", "パー"];

    for (let i = 0; i < 3; i++) {
      await playOneRound(page, hands[i]);

      // Verify round advances correctly
      const expectedRound = i + 2;
      await expect(
        page.getByText(`Round ${expectedRound} / 30`),
      ).toBeVisible({ timeout: 5_000 });
    }

    // Score total should equal 3
    const scores = await getScores(page);
    expect(scores.w + scores.l + scores.d).toBe(3);
  });

  test("AI thought bubble appears after round completes", async ({ page }) => {
    await switchToButtonMode(page);

    // Before playing, AI thought bubble should not be visible
    await expect(page.getByTestId("ai-thought")).not.toBeVisible();

    // Play one round
    await playOneRound(page);

    // AI thought bubble should appear with content
    const thoughtBubble = page.getByTestId("ai-thought");
    await expect(thoughtBubble).toBeVisible({ timeout: 5_000 });

    const content = await thoughtBubble.textContent();
    expect(content).toBeTruthy();
    expect(content!.trim().length).toBeGreaterThan(0);
  });

  test("buttons are disabled during countdown and re-enabled after", async ({
    page,
  }) => {
    await switchToButtonMode(page);

    const rockButton = page.getByRole("button", { name: "グー" });
    const scissorsButton = page.getByRole("button", { name: "チョキ" });
    const paperButton = page.getByRole("button", { name: "パー" });

    // Buttons should initially be enabled
    await expect(rockButton).toBeEnabled();
    await expect(scissorsButton).toBeEnabled();
    await expect(paperButton).toBeEnabled();

    // Set up response listener BEFORE clicking
    const playResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/play") && res.status() === 200,
      { timeout: 15_000 },
    );

    await rockButton.click();

    // During countdown, all buttons should be disabled
    const overlay = page.getByTestId("countdown-overlay");
    await expect(overlay).toBeVisible({ timeout: 3_000 });

    await expect(rockButton).toBeDisabled();
    await expect(scissorsButton).toBeDisabled();
    await expect(paperButton).toBeDisabled();

    // Wait for countdown to finish and API to respond
    await expect(overlay).toBeHidden({ timeout: 5_000 });
    await playResponsePromise;

    // After result is shown, buttons should be re-enabled
    await expect(rockButton).toBeEnabled({ timeout: 10_000 });
    await expect(scissorsButton).toBeEnabled({ timeout: 10_000 });
    await expect(paperButton).toBeEnabled({ timeout: 10_000 });
  });
});
