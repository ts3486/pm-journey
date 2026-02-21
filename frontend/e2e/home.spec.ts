import { test, expect } from "./fixtures";

// The page fixture pre-authenticates at "/", so each test starts there.
test.describe("Home page", () => {
  test("renders the learning roadmap heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "学習ロードマップ", exact: true }),
    ).toBeVisible();
  });

  test("shows the PM Roadmap label", async ({ page }) => {
    // The label text is rendered in multiple elements; use a specific role.
    // We look for the small caps label above the heading.
    await expect(page.getByText("PM Roadmap", { exact: true }).first()).toBeVisible();
  });

  test("shows the overall progress percentage", async ({ page }) => {
    // "Progress" label in the progress card
    await expect(page.getByText("Progress", { exact: true }).first()).toBeVisible();
    // Overall percentage (0% when no history)
    const progressPercent = page.locator(".tabular-nums").first();
    await expect(progressPercent).toBeVisible();
    await expect(progressPercent).toContainText("%");
  });

  test("shows the scenario roadmap section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "シナリオ学習ロードマップ" }),
    ).toBeVisible();
  });

  test("shows milestone chips in the progress bar", async ({ page }) => {
    // Milestone chips are in the scrollable progress bar area
    const milestoneChips = page.locator('span.rounded-xl');
    await expect(milestoneChips.first()).toBeVisible();
    // Verify the first milestone chip text matches expected milestone
    await expect(milestoneChips.first()).toContainText("基礎ソフトスキル");
  });

  test("shows the correct number of category steps", async ({ page }) => {
    // 5 categories from the catalog configuration
    await expect(page.getByText("5 ステップ")).toBeVisible();
  });

  test("can expand a category to see its scenarios", async ({ page }) => {
    // Click the first "シナリオを表示" button to expand
    const expandButtons = page.getByRole("button", { name: "シナリオを表示" });
    await expect(expandButtons.first()).toBeVisible();
    await expandButtons.first().click();

    // Scenarios from the basic-soft-skills category should appear
    await expect(page.getByText("はじめての認識合わせ")).toBeVisible();
    await expect(page.getByText("製品理解の確認")).toBeVisible();
    await expect(page.getByText("議事録作成")).toBeVisible();
  });

  test("can collapse an expanded category", async ({ page }) => {
    const expandButtons = page.getByRole("button", { name: "シナリオを表示" });
    await expandButtons.first().click();
    await expect(page.getByText("はじめての認識合わせ")).toBeVisible();

    await page.getByRole("button", { name: "シナリオを閉じる" }).click();
    await expect(page.getByText("はじめての認識合わせ")).not.toBeVisible();
  });

  test("scenario links point to the correct URLs", async ({ page }) => {
    await page.getByRole("button", { name: "シナリオを表示" }).first().click();

    const startLink = page.getByRole("link", { name: "開始" }).first();
    await expect(startLink).toHaveAttribute(
      "href",
      "/scenario?scenarioId=basic-intro-alignment&restart=1",
    );
  });

  test("shows the FREE plan banner when on FREE plan", async ({ page }) => {
    // The mock entitlements return FREE plan and billing is disabled
    await expect(page.getByText(/プラン.*FREE/)).toBeVisible();
  });
});
