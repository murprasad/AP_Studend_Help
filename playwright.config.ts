import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for StudentNest.
 *
 * Targets a deployed URL by default (post-deploy smoke is the primary
 * use case). Override via E2E_BASE_URL env or --config-option override.
 *   npm run test:e2e                     -> tests against studentnest.ai
 *   E2E_BASE_URL=... npm run test:e2e    -> tests against a preview URL
 *
 * Kept intentionally minimal — one chromium project, no webServer, so
 * a sandbox / CI that already has a deploy URL doesn't have to spin a
 * local dev server.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://studentnest.ai",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
