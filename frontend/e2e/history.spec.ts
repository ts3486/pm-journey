import { test, expect } from "./fixtures";
import { setupHistoryMocks, mockHistoryItems } from "./fixtures/api";

// The page fixture pre-authenticates at "/". Each test navigates to /history.
test.describe("History page", () => {
  test("shows empty state when there is no history", async ({ page }) => {
    // Default mock returns empty sessions
    await page.goto("/history");
    await expect(
      page.getByRole("heading", { name: "シナリオ履歴" }),
    ).toBeVisible();
    await expect(page.getByText("履歴がありません。")).toBeVisible();
    await expect(page.getByText("0 sessions")).toBeVisible();
  });

  test("shows history items when sessions exist", async ({ page }) => {
    // Override the sessions mock to return history data before navigating
    await setupHistoryMocks(page);

    await page.goto("/history");

    await expect(
      page.getByRole("heading", { name: "シナリオ履歴" }),
    ).toBeVisible();

    // Should show the count
    await expect(
      page.getByText(`${mockHistoryItems.length} sessions`),
    ).toBeVisible();

    // First history item — scenario title resolved from matched scenario
    await expect(page.getByText("はじめての認識合わせ")).toBeVisible();

    // Second history item — session with no evaluation score
    await expect(page.getByText("No Score")).toBeVisible();
  });

  test("shows evaluation score for completed sessions", async ({ page }) => {
    await setupHistoryMocks(page);
    await page.goto("/history");

    // The first mock item has overallScore: 85
    await expect(page.getByText("85 / 100")).toBeVisible();
  });

  test("history items are clickable links to detail pages", async ({ page }) => {
    await setupHistoryMocks(page);
    await page.goto("/history");

    const firstItem = page
      .getByRole("link")
      .filter({ hasText: "はじめての認識合わせ" });
    await expect(firstItem).toHaveAttribute(
      "href",
      `/history/${mockHistoryItems[0].sessionId}`,
    );
  });
});
