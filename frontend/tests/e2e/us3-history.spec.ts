import { test, expect } from "@playwright/test";

test.describe("User Story 3 - history and export", () => {
  test("view history list and copy export", async ({ page }) => {
    await page.goto("/history");
    await expect(page.getByText(/History/)).toBeVisible();
    const copyButtons = page.getByRole("button", { name: /Copy/ });
    const count = await copyButtons.count();
    if (count > 0) {
      await copyButtons.nth(0).click();
    }
  });
});
