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
// Beta 9.6 (Task #49) — deploy-gate vs nightly split.
//   GATE_MODE=deploy → ~5 min subset that runs on every staging deploy.
//   Default (any other value or unset) → full suite (nightly + manual).
//
// Subset rationale: catch deploy-blocking regressions only.
//   - public-paths / public-entry-points: ensure marketing pages render
//   - persona-c-api-smoke: ensure auth guards return correct status
//   - journey-rail / journey-rail-fmea / journey-rail-96: the active
//     conversion surface; most-changed code path
//   - frq-submit-reveal-echo: explicit prior-incident regression test
//
// Skipped on deploy-gate (still run nightly):
//   - a11y-scan (slow, results don't change per-deploy unless DOM changes)
//   - persona-b-sidebar-walk (chronic flake, deferred)
//   - journey-1..5 (older smoke; redundant with journey-rail tests)
//   - persona-a-* (auth + landing; covered by smoke tests in deploy-staging)
//   - billing-*, paywall-accuracy (covered by smoke tests for auth status)
const DEPLOY_GATE = process.env.GATE_MODE === "deploy";
const DEPLOY_GATE_PUBLIC = /(public-paths|public-entry-points|persona-c-api-smoke|runtime-errors-landing|link-walk-2026-05-03|fmea-top5-2026-05-03)\.spec\.ts/;
const DEPLOY_GATE_AUTHED = /(journey-rail|journey-rail-fmea|journey-rail-96|frq-submit-reveal-echo)\.spec\.ts/;

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
      testMatch: DEPLOY_GATE
        ? DEPLOY_GATE_PUBLIC
        : /(public-paths|public-entry-points|persona-a-landing-ctas|persona-a-register-tracks|persona-a-login|persona-a-auth-misc|persona-a-mobile|persona-a-mobile-ipad|persona-c-crawler-anonymous|persona-c-broken-links|persona-c-console-errors|persona-c-api-smoke|persona-c-security-headers|persona-c-headers-audit|persona-c-content-audit|landing-redesign-2026-05-02|clep-dsst-removal-2026-05-03|critical-paths-2026-05-03|runtime-errors-landing|link-walk-2026-05-03|fmea-top5-2026-05-03|backlog-suite-2026-05-03)\.spec\.ts/,
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
            testMatch: DEPLOY_GATE
              ? DEPLOY_GATE_AUTHED
              : /(authed-flows|nawal-nudge|flashcards-due-card|quality-audit-cron|onboarding-plan-choice|first-time-user-fmea|first-time-user-real|billing-page-consistency|paywall-accuracy|billing-flicker|a11y-scan|persona-b-sidebar-walk|journey-1-revenue|journey-2-mock-exam|journey-3-sage-tutor|journey-4-diagnostic|journey-5-parent-payment|frq-submit-reveal-echo|journey-rail|journey-rail-fmea|journey-rail-96|routing-gaps|next-step-engine|sidebar-multi-track-2026-05-03|backlog-suite-2026-05-03)\.spec\.ts/,
            dependencies: ["setup"],
          },
        ]
      : []),
  ],
});
