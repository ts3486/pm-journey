import { test, expect } from "./fixtures";

// The page fixture pre-authenticates at "/", so each test starts at home.
// VITE_BILLING_ENABLED=false during E2E, so billing gates are bypassed.
// The /organizations/current mock returns 404 (no org), so the team page
// shows the "no organization" state rather than member tables.

test.describe("Settings — Account page", () => {
  test("renders the Account heading", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(
      page.getByRole("heading", { name: "Account", exact: true }),
    ).toBeVisible();
  });

  test("shows the アカウント情報 label above the heading", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(page.getByText("アカウント情報", { exact: true })).toBeVisible();
  });

  test("shows the descriptive subtitle", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(
      page.getByText("ログイン中アカウントの基本情報と退会操作を確認できます。"),
    ).toBeVisible();
  });

  test("shows the user name from the /me mock", async ({ page }) => {
    await page.goto("/settings/account");
    // /me returns { name: "E2E Test User", email: "test@example.com" }
    // The name appears in both the card header <p> and a <dd> combined string,
    // so use exact:true to match only the standalone element.
    await expect(page.getByText("E2E Test User", { exact: true }).first()).toBeVisible();
  });

  test("shows the user email from the /me mock", async ({ page }) => {
    await page.goto("/settings/account");
    // The email appears in both the card subtitle <p> and inside a <dd> combined
    // string, so use exact:true and take the first match.
    await expect(page.getByText("test@example.com", { exact: true }).first()).toBeVisible();
  });

  test("shows the account info detail labels", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(page.getByText("現在のユーザー")).toBeVisible();
    await expect(page.getByText("アカウントID")).toBeVisible();
    await expect(page.getByText("現在のロール")).toBeVisible();
    await expect(page.getByText("所属チーム")).toBeVisible();
    await expect(page.getByText("作成日時")).toBeVisible();
    await expect(page.getByText("最終更新日時")).toBeVisible();
  });

  test("shows 未所属 for role and team when user has no organization", async ({ page }) => {
    await page.goto("/settings/account");
    // /organizations/current returns 404 → role and org name default to "未所属"
    const notAffiliatedItems = page.getByText("未所属");
    await expect(notAffiliatedItems.first()).toBeVisible();
  });

  test("shows the account deletion section", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(
      page.getByRole("heading", { name: "アカウント削除" }),
    ).toBeVisible();
  });

  test("shows the delete confirmation input", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(
      page.getByLabel("確認のため「アカウントを削除」と入力してください"),
    ).toBeVisible();
  });

  test("delete button is disabled until the confirmation phrase is typed", async ({ page }) => {
    await page.goto("/settings/account");
    const deleteButton = page.getByRole("button", { name: "アカウントを削除" });
    await expect(deleteButton).toBeDisabled();
  });

  test("delete button becomes enabled after typing the confirmation phrase", async ({ page }) => {
    await page.goto("/settings/account");
    const input = page.getByLabel("確認のため「アカウントを削除」と入力してください");
    await input.fill("アカウントを削除");
    const deleteButton = page.getByRole("button", { name: "アカウントを削除" });
    await expect(deleteButton).toBeEnabled();
  });
});

test.describe("Settings — Team Management page", () => {
  test("renders the Team Management heading", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(
      page.getByRole("heading", { name: "Team Management", exact: true }),
    ).toBeVisible();
  });

  test("shows the Team管理 label above the heading", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page.getByText("Team管理", { exact: true })).toBeVisible();
  });

  test("shows the descriptive subtitle", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(
      page.getByText("メンバー管理とメンバー利用状況を確認できます。"),
    ).toBeVisible();
  });

  test("shows the no-organization message when user has no org", async ({ page }) => {
    await page.goto("/settings/team");
    // /organizations/current returns 404 → summary message displayed
    await expect(
      page.getByText("組織に未参加のため、Team管理は利用できません。"),
    ).toBeVisible();
  });

  test("shows the create/join organization link when user has no org", async ({ page }) => {
    await page.goto("/settings/team");
    const createLink = page.getByRole("link", { name: "組織を作成 / 招待に参加" });
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute("href", "/team/onboarding");
  });

  test("shows the メンバー管理 collapsible section", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(
      page.getByRole("heading", { name: "メンバー管理" }),
    ).toBeVisible();
  });

  test("shows the メンバー招待 section header", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page.getByText("メンバー招待")).toBeVisible();
  });

  test("shows the invite email input field", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
  });

  test("shows the invite role selector", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page.getByLabel("ロール")).toBeVisible();
  });

  test("shows the 招待を作成 button", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page.getByRole("button", { name: "招待を作成" })).toBeVisible();
  });

  test("招待を作成 button is disabled when user has no org (canManageTeam is false)", async ({
    page,
  }) => {
    await page.goto("/settings/team");
    // canManageTeam requires canViewTeamManagement(role); role is null with no org
    await expect(page.getByRole("button", { name: "招待を作成" })).toBeDisabled();
  });

  test("shows empty-member state text when no members exist", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(
      page.getByText("表示できるメンバー情報はありません。"),
    ).toBeVisible();
  });

  test("shows the seat usage counter", async ({ page }) => {
    await page.goto("/settings/team");
    // With no org data, seatUsed=0, activeMemberCount=0, pendingInvitationCount=0
    await expect(
      page.getByText(/active 0 \+ pending 0/),
    ).toBeVisible();
  });
});

test.describe("Settings — Navigation between pages", () => {
  test("can navigate from account settings to team management via URL", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(
      page.getByRole("heading", { name: "Account", exact: true }),
    ).toBeVisible();

    await page.goto("/settings/team");
    await expect(
      page.getByRole("heading", { name: "Team Management", exact: true }),
    ).toBeVisible();
  });

  test("can navigate to account settings via profile menu", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィールメニューを開く" }).click();
    await page.getByRole("menuitem", { name: "アカウント情報" }).click();
    await expect(page).toHaveURL("/settings/account");
    await expect(
      page.getByRole("heading", { name: "Account", exact: true }),
    ).toBeVisible();
  });

  test("can return to home from account settings via roadmap nav link", async ({ page }) => {
    await page.goto("/settings/account");
    await page.getByRole("link", { name: "ロードマップ" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "学習ロードマップ", exact: true }),
    ).toBeVisible();
  });

  test("team management link is not visible in sidebar when user has no org", async ({
    page,
  }) => {
    // Our API mock returns 404 for /organizations/current → no role → no team link
    await expect(
      page.getByRole("link", { name: "チーム管理" }),
    ).not.toBeVisible();
  });
});
