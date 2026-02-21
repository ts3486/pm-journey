import { test, expect } from "./fixtures";

// The page fixture pre-authenticates at "/", so each test starts at home.
test.describe("Navigation", () => {

  test("shows the site header with PM Journey branding", async ({ page }) => {
    await expect(page.getByText("PM Journey")).toBeVisible();
    await expect(page.getByText("Product Leadership")).toBeVisible();
  });

  test("has a roadmap link in the top nav", async ({ page }) => {
    const roadmapLink = page.getByRole("link", { name: "ロードマップ" });
    await expect(roadmapLink).toBeVisible();
    await expect(roadmapLink).toHaveAttribute("href", "/");
  });

  test("has a scenario link in the top nav", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "進行中のシナリオ" }),
    ).toBeVisible();
  });

  test("profile menu button is visible when authenticated", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "プロフィールメニューを開く" }),
    ).toBeVisible();
  });

  test("profile menu opens and shows navigation items", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィールメニューを開く" }).click();
    await expect(page.getByRole("menuitem", { name: "履歴" })).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "プロンプト設定" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "アカウント情報" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "ログアウト" }),
    ).toBeVisible();
  });

  test("profile menu account settings link points to correct URL", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "プロフィールメニューを開く" }).click();
    const accountLink = page.getByRole("menuitem", { name: "アカウント情報" });
    await expect(accountLink).toHaveAttribute("href", "/settings/account");
  });

  test("profile menu history link points to correct URL", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィールメニューを開く" }).click();
    const historyLink = page.getByRole("menuitem", { name: "履歴" });
    await expect(historyLink).toHaveAttribute("href", "/history");
  });

  test("billing links are hidden when billing is disabled", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィールメニューを開く" }).click();
    // VITE_BILLING_ENABLED=false — billing entries must not appear
    await expect(
      page.getByRole("menuitem", { name: "請求設定" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "料金" }),
    ).not.toBeVisible();
  });

  test("can navigate to the history page via profile menu", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィールメニューを開く" }).click();
    await page.getByRole("menuitem", { name: "履歴" }).click();
    await expect(page).toHaveURL("/history");
    await expect(
      page.getByRole("heading", { name: "シナリオ履歴" }),
    ).toBeVisible();
  });

  test("profile menu closes after navigation", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィールメニューを開く" }).click();
    await page.getByRole("menuitem", { name: "履歴" }).click();

    // Menu should be closed after clicking a link
    await expect(page.getByRole("menuitem", { name: "アカウント情報" })).not.toBeVisible();
  });

  test("team management link is hidden for users without an organization", async ({
    page,
  }) => {
    // Our API mock returns 404 for organizations/current → no org role
    await expect(
      page.getByRole("link", { name: "チーム管理" }),
    ).not.toBeVisible();
  });

  test("can return to home from history page via roadmap link", async ({
    page,
  }) => {
    await page.goto("/history");
    await page.getByRole("link", { name: "ロードマップ" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "学習ロードマップ", exact: true }),
    ).toBeVisible();
  });
});
