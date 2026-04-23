import { test as setup, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Playwright auth setup.
 *
 * Runs ONCE before the authed test suite. Hits the CRON_SECRET-gated
 * /api/test/auth endpoint to provision a known test user and forge a
 * JWT, then plants the JWT cookie into Playwright's storage state so
 * every authed test starts already-logged-in.
 *
 * Requires `CRON_SECRET` in env (matches the prod CF Pages secret).
 *
 * Storage state lands at tests/e2e/.auth/user.json — the authed project
 * in playwright.config.ts loads this via `storageState`.
 */

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");

setup("authenticate as functional test user", async ({ request, page }) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error(
      "CRON_SECRET env var required for authed tests. " +
        "Set it in .env or pass via --config-option=use.extraHTTPHeaders.",
    );
  }

  const baseURL = process.env.E2E_BASE_URL ?? "https://studentnest.ai";

  // Provision the test user via the existing CRON-gated endpoint.
  const provisionRes = await request.post(`${baseURL}/api/test/auth`, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
    data: { action: "create" },
  });
  expect(provisionRes.ok(), `Test-user provision failed: ${provisionRes.status()}`).toBe(true);
  const { sessionToken, cookieName, userId } = await provisionRes.json();
  expect(sessionToken, "sessionToken missing from /api/test/auth response").toBeTruthy();
  expect(cookieName, "cookieName missing").toBeTruthy();
  console.log(`[auth.setup] provisioned test user ${userId}`);

  // Plant the cookie into a fresh browser context so storageState carries
  // the auth into every authed spec.
  const url = new URL(baseURL);
  await page.context().addCookies([
    {
      name: cookieName,
      value: sessionToken,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "Lax",
    },
  ]);

  // Hit the dashboard once to confirm the session is honored — if the JWT
  // is rejected we fail fast here instead of in the first real test.
  await page.goto(`${baseURL}/dashboard`);
  // Either the dashboard renders OR we get redirected to /onboarding (also
  // a logged-in state). Either is fine — the failure mode we're guarding
  // against is /login.
  const url2 = page.url();
  expect(url2, `Expected dashboard or onboarding, got: ${url2}`).not.toContain("/login");

  // Persist the storage state to disk for the authed project to pick up.
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[auth.setup] storage state written to ${AUTH_FILE}`);
});
