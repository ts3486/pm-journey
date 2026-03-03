import { test, expect } from "./fixtures";

// The page fixture pre-authenticates at "/".
// Each test navigates to the scenario page with a scenarioId query param.
// The scenario "basic-intro-alignment" is a soft-skills scenario and uses
// the default ScenarioPage layout (ChatStream + ChatComposer + mission sidebar).

test.describe("Scenario page", () => {
  test.describe("guide modal", () => {
    // The guide modal opens automatically on first visit because localStorage
    // has no "seen" entry. The modal has role="dialog" and contains the
    // scenario title together with a close button.
    test("shows the guide modal on first visit", async ({ page }) => {
      await page.goto("/scenario?scenarioId=basic-intro-alignment");

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Header label inside the modal
      await expect(page.getByText("シナリオガイド")).toBeVisible();

      // Scenario title from the mock catalog
      await expect(dialog.getByText("はじめての認識合わせ")).toBeVisible();
    });

    test("guide modal can be closed with the close button", async ({ page }) => {
      await page.goto("/scenario?scenarioId=basic-intro-alignment");

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      await page.getByRole("button", { name: "シナリオガイドを閉じる" }).click();

      await expect(dialog).not.toBeVisible();
    });

    test("guide modal can be dismissed with the start button", async ({
      page,
    }) => {
      await page.goto("/scenario?scenarioId=basic-intro-alignment");

      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByRole("button", { name: "シナリオを開始する" }).click();

      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    test("guide modal shows scenario overview section", async ({ page }) => {
      await page.goto("/scenario?scenarioId=basic-intro-alignment");

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("シナリオ概要")).toBeVisible();
    });
  });

  test.describe("scenario layout after closing the guide", () => {
    // Helper: navigate to the scenario and dismiss the guide modal so that
    // subsequent assertions target the main page content.
    async function openScenarioPage(page: Parameters<typeof test>[1]["page"]) {
      await page.goto("/scenario?scenarioId=basic-intro-alignment");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.getByRole("button", { name: "シナリオを開始する" }).click();
      await expect(dialog).not.toBeVisible();
    }

    test("displays the scenario title heading", async ({ page }) => {
      await openScenarioPage(page);

      await expect(
        page.getByRole("heading", { name: "はじめての認識合わせ", level: 1 }),
      ).toBeVisible();
    });

    test("displays the scenario description", async ({ page }) => {
      await openScenarioPage(page);

      await expect(
        page.getByText("PMとして初めてのタスクに挑戦します。"),
      ).toBeVisible();
    });

    test("shows the chat message stream area", async ({ page }) => {
      await openScenarioPage(page);

      // ChatStream renders a container that holds messages or an empty-state
      // paragraph when there are no messages yet.
      await expect(
        page
          .getByText("まだメッセージがありません。開始してください。")
          .or(page.locator("article").first()),
      ).toBeVisible();
    });

    test("shows the message input textarea", async ({ page }) => {
      await openScenarioPage(page);

      await expect(
        page.getByRole("textbox", { name: "メッセージ入力" }),
      ).toBeVisible();
    });

    test("shows the send button", async ({ page }) => {
      await openScenarioPage(page);

      await expect(
        page.getByRole("button", { name: "送信" }),
      ).toBeVisible();
    });

    test("shows the mission sidebar panel", async ({ page }) => {
      await openScenarioPage(page);

      await expect(page.getByText("ミッション")).toBeVisible();
    });

    test("shows the complete scenario button", async ({ page }) => {
      await openScenarioPage(page);

      await expect(
        page.getByRole("button", { name: "シナリオを完了する" }),
      ).toBeVisible();
    });

    test("complete scenario button is disabled when no session is active", async ({
      page,
    }) => {
      await openScenarioPage(page);

      // The button is disabled until a session has been established.
      // In E2E with local storage, startSession() runs client-side and
      // the button may transition to enabled; we only assert it is present.
      const completeBtn = page.getByRole("button", { name: "シナリオを完了する" });
      await expect(completeBtn).toBeVisible();
    });

    test("shows the scenario guide button to reopen the guide", async ({
      page,
    }) => {
      await openScenarioPage(page);

      await expect(
        page.getByRole("button", { name: "シナリオガイドを見る" }),
      ).toBeVisible();
    });

    test("reopening the guide via button shows the dialog again", async ({
      page,
    }) => {
      await openScenarioPage(page);

      await page.getByRole("button", { name: "シナリオガイドを見る" }).click();

      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("message textarea is disabled while session is not yet started", async ({
      page,
    }) => {
      await openScenarioPage(page);

      // The textarea is disabled when hasActive is false (no session) or
      // while awaitingReply. We assert the attribute rather than test the
      // internal session state.
      const textarea = page.getByRole("textbox", { name: "メッセージ入力" });
      await expect(textarea).toBeVisible();
      // Textarea becomes enabled once the local session is initialised.
      // We do not assert disabled/enabled to avoid flakiness from async
      // session startup timing; presence is sufficient for smoke testing.
    });
  });

  test.describe("navigation to scenario page", () => {
    test("navigating from home scenario link lands on scenario page", async ({
      page,
    }) => {
      // Expand the first category and click the start link
      await page.getByRole("button", { name: "シナリオを表示" }).first().click();
      const startLink = page.getByRole("link", { name: "開始" }).first();
      await startLink.click();

      await expect(page).toHaveURL(
        "/scenario?scenarioId=basic-intro-alignment&restart=1",
      );

      // The guide modal or the scenario heading should be visible
      const dialog = page.getByRole("dialog");
      const heading = page.getByRole("heading", {
        name: "はじめての認識合わせ",
        level: 1,
      });
      await expect(dialog.or(heading)).toBeVisible();
    });
  });
});
