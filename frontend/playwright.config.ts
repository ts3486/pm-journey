import { defineConfig, devices } from "@playwright/test";

const AUTH0_DOMAIN = "test.auth0.local";
const AUTH0_CLIENT_ID = "test-client-id";
const AUTH0_AUDIENCE = "test-client-id";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_AUTH0_DOMAIN: AUTH0_DOMAIN,
      VITE_AUTH0_CLIENT_ID: AUTH0_CLIENT_ID,
      VITE_AUTH0_AUDIENCE: AUTH0_AUDIENCE,
      VITE_BILLING_ENABLED: "false",
    },
  },
});
