import { test, expect } from "./fixtures";
import { setupHistoryMocks, mockHistoryItems } from "./fixtures/api";

test.describe("Achievements page", () => {
  test("renders the achievements heading", async ({ page }) => {
    await page.goto("/achievements");
    await expect(
      page.getByRole("heading", { name: "実績" }),
    ).toBeVisible();
  });

  test("shows stat cards with zero values when no history", async ({ page }) => {
    await page.goto("/achievements");
    // Stat labels
    await expect(page.getByText("総セッション")).toBeVisible();
    await expect(page.getByText("評価取得")).toBeVisible();
    await expect(page.getByText("平均スコア")).toBeVisible();
    await expect(page.getByText("合格率")).toBeVisible();
  });

  test("shows achievement items", async ({ page }) => {
    await page.goto("/achievements");
    // At least some achievement titles should be present
    await expect(page.getByText("はじめの一歩")).toBeVisible();
    await expect(page.getByText("継続トレーニー")).toBeVisible();
    await expect(page.getByText("評価チャレンジャー")).toBeVisible();
  });

  test("shows achievement count badge", async ({ page }) => {
    await page.goto("/achievements");
    // When no history, 0/5 achievements
    await expect(page.getByText("0 / 5 達成")).toBeVisible();
  });

  test("shows certificate progress card when not all scenarios are passed", async ({ page }) => {
    await page.goto("/achievements");
    // Certificate is not earned yet -> progress card shows "未取得"
    await expect(page.getByText("未取得")).toBeVisible();
    await expect(page.getByText(/シナリオ合格/)).toBeVisible();
  });

  test("shows play status section", async ({ page }) => {
    await page.goto("/achievements");
    await expect(page.getByText("プレイ状況メモ")).toBeVisible();
  });

  test("unlocks first achievement when history has sessions", async ({ page }) => {
    await setupHistoryMocks(page);
    await page.goto("/achievements");
    // mockHistoryItems has 2 sessions -> "はじめの一歩" (target=1) should be unlocked
    await expect(page.getByText("達成済み").first()).toBeVisible();
  });

  test("shows evaluation score stats when history has evaluations", async ({ page }) => {
    await setupHistoryMocks(page);
    await page.goto("/achievements");
    // mockHistoryItems[0] has overallScore: 85
    // Average score should be visible as "85" (only one scored item)
    await expect(page.getByText("85").first()).toBeVisible();
  });
});
