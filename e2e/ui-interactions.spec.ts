import { test, expect } from "@playwright/test";
import {
  switchToButtonMode,
  navigateAndWaitForReady,
  playOneRound,
  getScores,
} from "./helpers/game-helpers";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("UI Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await navigateAndWaitForReady(page);
  });

  // -------------------------------------------------------------------------
  // 1. Mode Toggle
  // -------------------------------------------------------------------------
  test.describe("Mode Toggle", () => {
    test("initial state is camera mode with Button toggle visible and hand buttons hidden", async ({
      page,
    }) => {
      await expect(
        page.getByRole("button", { name: "Button" }),
      ).toBeVisible();

      await expect(page.getByRole("button", { name: "グー" })).toBeHidden();
      await expect(page.getByRole("button", { name: "チョキ" })).toBeHidden();
      await expect(page.getByRole("button", { name: "パー" })).toBeHidden();
    });

    test("clicking Button switches to button mode with three hand buttons", async ({
      page,
    }) => {
      await switchToButtonMode(page);

      await expect(
        page.getByRole("button", { name: "Camera" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "グー" })).toBeVisible();
      await expect(page.getByRole("button", { name: "チョキ" })).toBeVisible();
      await expect(page.getByRole("button", { name: "パー" })).toBeVisible();
    });

    test("clicking Camera switches back to camera mode", async ({ page }) => {
      await switchToButtonMode(page);

      await page.getByRole("button", { name: "Camera" }).click();

      await expect(
        page.getByRole("button", { name: "Button" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "グー" })).toBeHidden();
      await expect(page.getByRole("button", { name: "チョキ" })).toBeHidden();
      await expect(page.getByRole("button", { name: "パー" })).toBeHidden();

      // Camera mode shows either video element or camera error message
      const cameraUI = page
        .locator("video")
        .or(page.getByText(/カメラ.*拒否|カメラ.*失敗/));
      await expect(cameraUI.first()).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Progress Bar
  // -------------------------------------------------------------------------
  test.describe("Progress Bar", () => {
    test("starts at 0% width", async ({ page }) => {
      const progressBar = page.getByTestId("progress-bar");
      await expect(progressBar).toBeAttached();

      const width = await progressBar.evaluate(
        (el) => (el as HTMLElement).style.width,
      );
      expect(width).toBe("0%");
    });

    test("advances to greater than 0% after one round", async ({ page }) => {
      await switchToButtonMode(page);
      await playOneRound(page, "グー");

      const progressBar = page.getByTestId("progress-bar");
      const width = await progressBar.evaluate(
        (el) => (el as HTMLElement).style.width,
      );

      const numericWidth = parseFloat(width);
      expect(numericWidth).toBeGreaterThan(0);
      expect(numericWidth).toBeLessThanOrEqual(100);
    });
  });

  // -------------------------------------------------------------------------
  // 3. AI Personality Badge
  // -------------------------------------------------------------------------
  test("displays one of the three AI personality badges", async ({ page }) => {
    const badge = page
      .getByText("挑発型")
      .or(page.getByText("分析型"))
      .or(page.getByText("不気味型"));

    await expect(badge.first()).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 4. Scoreboard Initial State
  // -------------------------------------------------------------------------
  test("scoreboard shows W=0, L=0, D=0 initially", async ({ page }) => {
    const scores = await getScores(page);
    expect(scores.w).toBe(0);
    expect(scores.l).toBe(0);
    expect(scores.d).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 5. API Error Handling
  // -------------------------------------------------------------------------
  test.describe("API Error Handling", () => {
    test("displays error bar when /api/start-round returns 500", async ({
      page,
    }) => {
      await page.route("**/api/start-round", (route) => {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.reload();

      const errorBar = page.getByTestId("error-bar");
      await expect(errorBar).toBeVisible({ timeout: 10_000 });
    });

    test("displays error bar when /api/play returns 500 after selecting a hand", async ({
      page,
    }) => {
      await switchToButtonMode(page);

      await page.route("**/api/play", (route) => {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Play endpoint failure" }),
        });
      });

      await page.getByRole("button", { name: "グー" }).click();

      const errorBar = page.getByTestId("error-bar");
      await expect(errorBar).toBeVisible({ timeout: 10_000 });
    });
  });

  // -------------------------------------------------------------------------
  // 6. Button Disabled Timing
  // -------------------------------------------------------------------------
  test("hand buttons are disabled during countdown and re-enabled after result", async ({
    page,
  }) => {
    await switchToButtonMode(page);

    const rockBtn = page.getByRole("button", { name: "グー" });
    const scissorsBtn = page.getByRole("button", { name: "チョキ" });
    const paperBtn = page.getByRole("button", { name: "パー" });

    // Buttons enabled before playing
    await expect(rockBtn).toBeEnabled();
    await expect(scissorsBtn).toBeEnabled();
    await expect(paperBtn).toBeEnabled();

    // Set up response listener before clicking
    const playResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/play") && res.status() === 200,
      { timeout: 15_000 },
    );

    await rockBtn.click();

    // During countdown, buttons must be disabled
    const overlay = page.getByTestId("countdown-overlay");
    await expect(overlay).toBeVisible({ timeout: 3_000 });

    await expect(rockBtn).toBeDisabled();
    await expect(scissorsBtn).toBeDisabled();
    await expect(paperBtn).toBeDisabled();

    // Wait for countdown to finish and API to respond
    await expect(overlay).toBeHidden({ timeout: 5_000 });
    await playResponsePromise;

    // After result, buttons re-enable for next round
    await expect(rockBtn).toBeEnabled({ timeout: 10_000 });
    await expect(scissorsBtn).toBeEnabled({ timeout: 10_000 });
    await expect(paperBtn).toBeEnabled({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 7. Simultaneous Reveal Integrity
  // -------------------------------------------------------------------------
  test("result display shows both player and AI moves from the API", async ({
    page,
  }) => {
    const moveLabels: Record<string, string> = {
      rock: "グー",
      scissors: "チョキ",
      paper: "パー",
    };

    let capturedPlayerMove: string | null = null;
    let capturedAiMove: string | null = null;

    // Intercept /api/play BEFORE switching to button mode
    await page.route("**/api/play", async (route) => {
      const postData = route.request().postDataJSON();
      capturedPlayerMove = postData.player_move;

      const response = await route.fetch();
      const body = await response.json();
      capturedAiMove = body.ai_move;

      await route.fulfill({ response });
    });

    await switchToButtonMode(page);

    // Set up response listener before clicking
    const playResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/play") && res.status() === 200,
      { timeout: 15_000 },
    );

    await page.getByRole("button", { name: "グー" }).click();

    // Wait for countdown to complete
    const overlay = page.getByTestId("countdown-overlay");
    await expect(overlay).toBeVisible({ timeout: 3_000 });
    await expect(overlay).toBeHidden({ timeout: 5_000 });

    // Wait for API response
    await playResponsePromise;

    // Unconditional assertions on captured moves
    expect(capturedPlayerMove).toBe("rock");
    expect(capturedAiMove).not.toBeNull();

    // Verify game-result section shows both moves
    const gameResult = page.getByTestId("game-result");
    await expect(gameResult).toBeVisible({ timeout: 5_000 });

    const playerLabel = moveLabels[capturedPlayerMove!];
    const aiLabel = moveLabels[capturedAiMove!];

    await expect(gameResult).toContainText(playerLabel);
    await expect(gameResult).toContainText(aiLabel);
  });
});
