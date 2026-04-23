import { defineConfig, devices } from "@playwright/test";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env so CRON_SECRET (needed by auth.setup.ts) is available
// without requiring the user to prefix every test invocation.
dotenv.config({ path: path.resolve(__dirname, ".env") });

/**
 * Playwright E2E configuration for StudentNest.
 *
 * Targets a deployed URL by default (post-deploy smoke is the primary
 * use case). Override via E2E_BASE_URL env or --config-option override.
 *   npm run test:e2e                     -> tests against studentnest.ai
 *   E2E_BASE_URL=... npm run test:e2e    -> tests against a preview URL
 *
 * Project layout:
 *   - "setup"        — runs auth.setup.ts FIRST. Provisions a test user
 *                      via the CRON_SECRET-gated /api/test/auth endpoint
 *                      and writes storage state to tests/e2e/.auth/user.json.
 *                      Skipped automatically if no CRON_SECRET (e.g. PR CI
 *                      without prod secrets) — public tests still run.
 *   - "chromium-public" — public-paths.spec.ts (no auth needed)
 *   - "chromium-authed" — authed-flows.spec.ts (depends on setup)
 */

const AUTH_FILE = path.join(__dirname, "tests", "e2e", ".auth", "user.json");
const HAS_CRON_SECRET = !!process.env.CRON_SECRET;

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
    // Setup project — only runs if CRON_SECRET is set. Runs before authed.
    ...(HAS_CRON_SECRET
      ? [
          {
            name: "setup",
            testMatch: /auth\.setup\.ts/,
          },
        ]
      : []),
    {
      name: "chromium-public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /public-paths\.spec\.ts/,
    },
    ...(HAS_CRON_SECRET
      ? [
          {
            name: "chromium-authed",
            use: {
              ...devices["Desktop Chrome"],
              storageState: AUTH_FILE,
            },
            // Match any authed spec. Currently: authed-flows + nawal-nudge.
            // New authed specs drop in without config changes.
            testMatch: /(authed-flows|nawal-nudge)\.spec\.ts/,
            dependencies: ["setup"],
          },
        ]
      : []),
  ],
});
