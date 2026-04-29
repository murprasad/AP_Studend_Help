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
  // Serial execution. Every authed spec shares the SAME test user (provisioned
  // by auth.setup.ts with a known email). Parallel workers cause nawal-nudge
  // and authed-flows to stomp on each other's DashboardImpression rows.
  // Runtime trade-off: ~2-3x slower, but deterministic and stable in CI.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Retries: 3 globally. Several specs exercise race-sensitive UI
  // (AutoLaunchNudge modal mounts async alongside dashboard cards,
  // onboarding step-advance timing, flashcard batch fetch) and flake
  // in parallel runs despite passing in isolation. Retries give 4
  // attempts to reduce pipeline noise; feature regressions still fail
  // all 4 and correctly block the deploy. Individual specs that need
  // tighter guarantees can override via `test.describe.configure({
  // retries: 0 })`.
  retries: 3,
  // Always include JSON reporter writing to test-results.json so the
  // staging gate's triage script (scripts/check-playwright-failures.mjs)
  // can distinguish chronic cold-start flakes from real regressions.
  reporter: process.env.CI
    ? [["list"], ["json", { outputFile: "test-results.json" }], ["html", { open: "never" }]]
    : [["list"], ["json", { outputFile: "test-results.json" }]],
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
      testMatch: /(public-paths|public-entry-points|persona-a-landing-ctas|persona-a-register-tracks|persona-a-login|persona-a-auth-misc|persona-a-mobile|persona-a-mobile-ipad|persona-c-crawler-anonymous|persona-c-broken-links|persona-c-console-errors|persona-c-api-smoke|persona-c-security-headers|persona-c-headers-audit|persona-c-content-audit)\.spec\.ts/,
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
            testMatch: /(authed-flows|nawal-nudge|flashcards-due-card|quality-audit-cron|onboarding-plan-choice|first-time-user-fmea|first-time-user-real|billing-page-consistency|paywall-accuracy|billing-flicker|a11y-scan|persona-b-sidebar-walk|journey-1-revenue|journey-2-mock-exam|journey-3-sage-tutor|journey-4-diagnostic|journey-5-parent-payment|frq-submit-reveal-echo)\.spec\.ts/,
            dependencies: ["setup"],
          },
        ]
      : []),
  ],
});
