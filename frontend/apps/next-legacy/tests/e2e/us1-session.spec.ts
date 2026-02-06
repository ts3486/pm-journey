import { test, expect } from "@playwright/test";

test.describe("User Story 1 - session flow", () => {
  test("start session, send message, see evaluation placeholder", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start simulation" }).click();
    await page.goto("/scenario");
    await page.getByPlaceholder("メッセージを入力...").fill("打刻課題は何ですか？");
    await page.getByRole("button", { name: "送信" }).click();
    await expect(page.getByText("鈴木")).toBeVisible();
    await page.getByRole("button", { name: "Mark ready for evaluation" }).click();
    await expect(page.getByText("評価")).toBeTruthy();
  });
});
