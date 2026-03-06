import { test, expect, Page } from "@playwright/test";
import {
  switchToButtonMode,
  waitForAppReady,
  playFullGame,
} from "./helpers/game-helpers";

test.describe.serial("30-round full game", () => {
  let sharedPage: Page;

  test.setTimeout(180_000);

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();

    // Clear localStorage to start fresh
    await sharedPage.addInitScript(() => {
      localStorage.removeItem("rps_session_id");
    });

    await sharedPage.goto("/");
    await waitForAppReady(sharedPage);
    await switchToButtonMode(sharedPage);

    // Verify we start on round 1
    await expect(sharedPage.getByText("Round 1 / 30")).toBeVisible();
  });

  test.afterAll(async () => {
    await sharedPage?.close();
  });

  test("complete 30 rounds and show report", async () => {
    await playFullGame(sharedPage);

    // Report modal should auto-appear after round 30
    await expect(sharedPage.getByTestId("report-modal")).toBeVisible({
      timeout: 10_000,
    });
    await expect(sharedPage.getByText("あなたの癖、丸裸レポート")).toBeVisible();
    await expect(sharedPage.getByText("30 戦完了")).toBeVisible();
  });

  test("report contains all sections", async () => {
    const modal = sharedPage.getByTestId("report-modal");

    // -- Win rate summary: 3 columns --
    await expect(modal.getByText("あなたの勝率")).toBeVisible();
    await expect(modal.getByText("AI 勝率")).toBeVisible();
    await expect(modal.getByText("引き分け")).toBeVisible();

    // Each column should display a percentage value
    const percentages = modal.getByText(/^\d+%$/);
    const count = await percentages.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // -- Move distribution --
    await expect(modal.getByText("手の分布")).toBeVisible();
    await expect(modal.getByText("グー", { exact: true })).toBeVisible();
    await expect(modal.getByText("パー", { exact: true })).toBeVisible();
    await expect(modal.getByText("チョキ", { exact: true })).toBeVisible();

    // -- Win rate history chart --
    await expect(modal.getByText("勝率推移")).toBeVisible();

    // -- AI analysis --
    await expect(modal.getByText("AI の分析")).toBeVisible();

    // -- Action buttons --
    await expect(
      modal.getByRole("button", { name: "結果をシェア" }),
    ).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "もう一度挑戦" }),
    ).toBeVisible();
  });

  test("retry resets game", async () => {
    const modal = sharedPage.getByTestId("report-modal");
    const retryButton = modal.getByRole("button", { name: "もう一度挑戦" });
    await expect(retryButton).toBeVisible();

    // Click retry and wait for page reload
    const loadPromise = sharedPage.waitForEvent("load", { timeout: 10_000 });
    await retryButton.click();
    await loadPromise;

    // Wait for the app to initialize after reload
    await waitForAppReady(sharedPage);

    // Verify game is reset: back to round 1, report modal gone
    await expect(sharedPage.getByText(/Round 1 \/ 30/)).toBeVisible({
      timeout: 5_000,
    });
    await expect(sharedPage.getByTestId("report-modal")).not.toBeVisible();
  });
});
