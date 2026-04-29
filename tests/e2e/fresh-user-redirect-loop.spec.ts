import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * Fresh-user redirect-loop guard (Beta 9 — added 2026-04-29 after user
 * caught the bug I missed).
 *
 * Bug history: middleware.ts redirected new users (onboardingCompletedAt=null)
 * to /onboarding (legacy wizard target). The page server-redirected to
 * /practice/quickstart. But middleware exempted only /onboarding, NOT
 * /practice/quickstart, so middleware bounced the user BACK to /onboarding.
 * Loop. Browser hung on "Loading…".
 *
 * Why my prior tests missed it: the test fixture user had
 * onboardingCompletedAt=SET (via seed-dashboard-impressions), so Playwright
 * never walked the new-user path through middleware.
 *
 * This spec creates a user with onboardingCompletedAt=NULL and asserts:
 *   - Navigation lands on a stable URL (no infinite redirects)
 *   - Final URL is /practice/quickstart (the new flow target)
 *   - Redirect-chain depth < 5 (loop detector)
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe("Fresh user — no redirect loops", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    const api = await apiRequest.newContext();
    // Reset onboarding so this user is "new" — onboardingCompletedAt=null.
    const r = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "reset-onboarding" },
    });
    expect(r.ok(), `reset-onboarding failed: ${r.status()}`).toBe(true);
    await api.dispose();
  });

  test("nav to /dashboard as new user → lands on /practice/quickstart, no loop", async ({ page }) => {
    // Track redirect chain so we can fail loud on loops.
    const navigationUrls: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        navigationUrls.push(frame.url());
      }
    });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 15000 });

    // Final URL must be /practice/quickstart (Beta 9 target).
    expect(page.url(), `Expected /practice/quickstart, got ${page.url()}`).toContain("/practice/quickstart");

    // Loop guard: more than 5 navigations means we bounced through middleware
    // multiple times. The Beta 9 bug went /dashboard → /onboarding →
    // /practice/quickstart → /onboarding → ... infinite. Cap at 5.
    expect(navigationUrls.length, `Too many navigations (loop?): ${navigationUrls.join(" → ")}`).toBeLessThan(5);
  });

  test("nav to /onboarding (legacy URL) as new user → /practice/quickstart, no loop", async ({ page }) => {
    const navigationUrls: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigationUrls.push(frame.url());
    });

    await page.goto("/onboarding", { waitUntil: "domcontentloaded", timeout: 15000 });

    expect(page.url(), `Expected /practice/quickstart, got ${page.url()}`).toContain("/practice/quickstart");
    expect(navigationUrls.length).toBeLessThan(5);
  });

  test("/practice/quickstart loads cleanly for new user (no middleware bounce-back)", async ({ page }) => {
    const navigationUrls: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigationUrls.push(frame.url());
    });

    await page.goto("/practice/quickstart", { waitUntil: "domcontentloaded", timeout: 15000 });

    // Should land on /practice/quickstart, NOT bounce to /onboarding.
    expect(page.url()).toContain("/practice/quickstart");
    expect(page.url()).not.toContain("/onboarding");
    expect(navigationUrls.length).toBeLessThan(3);

    // Sanity: the smart-default card must be visible.
    await expect(page.locator("body")).toContainText(/Most students start here|Let.s start with one question/i, {
      timeout: 10000,
    });
  });
});
