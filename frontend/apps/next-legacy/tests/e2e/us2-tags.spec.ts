import { test, expect } from "@playwright/test";

test.describe("User Story 2 - tagging and progress", () => {
  test("tag messages and update progress", async ({ page }) => {
    await page.goto("/scenario");
    await page.getByPlaceholder("メッセージを入力...").fill("決定事項を記録します");
    await page.getByRole("button", { name: "送信" }).click();
    await expect(page.getByText("決定事項を記録します")).toBeVisible();
    await page.getByRole("button", { name: /Mark progress complete/i }).click();
    await expect(page.getByText("Evaluation available")).toBeVisible();
  });
});
