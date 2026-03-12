import { expect, type Page } from "@playwright/test";

export type HandLabel = "グー" | "チョキ" | "パー";
const HAND_ROTATION: HandLabel[] = ["グー", "チョキ", "パー"];

/**
 * Switch from the default camera mode to button mode.
 * Waits for hand-selection buttons to become visible.
 */
export async function switchToButtonMode(page: Page): Promise<void> {
  const toggleButton = page.getByRole("button", { name: "Button" });
  await toggleButton.waitFor({ state: "visible" });
  await toggleButton.click();
  await expect(page.getByRole("button", { name: "Camera" })).toBeVisible();
  await expect(page.getByRole("button", { name: "グー" })).toBeVisible();
}

/**
 * Wait for the initial /api/start-round call that fires on mount.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForResponse(
    (res) => res.url().includes("/api/start-round") && res.status() === 200,
    { timeout: 10_000 },
  );
}

/**
 * Play one round in button mode.
 * Handles: button click -> countdown -> API response -> next round readiness.
 *
 * @param isLastRound - If true, waits for report modal instead of button re-enable.
 */
export async function playOneRound(
  page: Page,
  hand: HandLabel = "グー",
  isLastRound = false,
): Promise<void> {
  const moveButton = page.getByRole("button", { name: hand });
  await expect(moveButton).toBeEnabled({ timeout: 10_000 });

  // Set up response listener BEFORE clicking to avoid race condition
  const playResponsePromise = page.waitForResponse(
    (res) => res.url().includes("/api/play") && res.status() === 200,
    { timeout: 15_000 },
  );

  await moveButton.click();

  // Wait for countdown overlay to appear then disappear
  const overlay = page.getByTestId("countdown-overlay");
  await expect(overlay).toBeVisible({ timeout: 3_000 });
  await expect(overlay).toBeHidden({ timeout: 5_000 });

  // Wait for API response
  await playResponsePromise;

  if (isLastRound) {
    // Final round: wait for report modal
    await expect(page.getByTestId("report-modal")).toBeVisible({ timeout: 10_000 });
  } else {
    // Wait for buttons to re-enable (next round ready)
    await expect(moveButton).toBeEnabled({ timeout: 10_000 });
  }
}

/**
 * Play all 30 rounds with rotating hands (グー -> チョキ -> パー -> ...).
 */
export async function playFullGame(page: Page, totalRounds = 30): Promise<void> {
  for (let round = 1; round <= totalRounds; round++) {
    const hand = HAND_ROTATION[(round - 1) % HAND_ROTATION.length];
    await playOneRound(page, hand, round === totalRounds);
  }
}

/**
 * Read the current scores from the scoreboard.
 */
export async function getScores(page: Page): Promise<{ w: number; l: number; d: number }> {
  const getText = async (testId: string) => {
    const el = page.getByTestId(testId);
    const text = await el.textContent();
    // Text contains label + number, e.g. "W0" or "W 0"
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  return {
    w: await getText("score-wins"),
    l: await getText("score-losses"),
    d: await getText("score-draws"),
  };
}
