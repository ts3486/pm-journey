import { test as base, expect } from "@playwright/test";
import { setupAuth0Mocks } from "./auth";
import { setupApiMocks } from "./api";

export { expect };

/**
 * Extended test fixture that:
 * 1. Mocks Auth0 and the backend API for every test.
 * 2. Pre-authenticates by navigating to the home page and waiting for the
 *    NavBar to appear, so auth is fully established before test assertions run.
 *
 * After the fixture runs, every test starts at "/" with an authenticated session.
 * Tests can then navigate to any route freely without triggering auth redirects.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Disable CSS animations so reveal/opacity animations don't affect
    // element visibility checks in assertions.
    await page.emulateMedia({ reducedMotion: "reduce" });

    await setupAuth0Mocks(page);
    await setupApiMocks(page);

    // Pre-authenticate: navigate to home and wait for the NavBar (rendered
    // only when authenticated) to confirm auth is complete.
    await page.goto("/");
    await page.waitForSelector("header nav, nav", { timeout: 15000 });

    await use(page);
  },
});
