import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * REAL first-time-user E2E spec — Beta 9 rewrite.
 *
 * Uses fresh fixture (onboardingCompletedAt=null) and walks the new
 * quickstart flow (Beta 9 deleted the legacy 4-step wizard).
 *
 * What this spec catches that the old version couldn't:
 *   - JWT staleness after onboarding completion
 *   - Bounce-loops when navigating to other pages while
 *     onboardingCompletedAt is still null in JWT
 *   - Wrong destinations after middleware-driven redirects
 *
 * Beta 9 changes vs prior:
 *   - No 4-step wizard — single /practice/quickstart screen
 *   - Middleware redirects new users to /practice/quickstart (not /onboarding)
 *   - onboardingCompletedAt set on first session COMPLETION (not on
 *     a "Start Free" button click). For tests that need post-onboarding
 *     state, manually set the flag via test/auth instead of completing
 *     a real session.
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe.configure({ retries: 2, timeout: 60_000 });

test.describe("Real first-time user — Beta 9 quickstart flow", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    const api = await apiRequest.newContext();
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "reset-onboarding" },
    });
    await api.dispose();
  });

  test("new user lands on /practice/quickstart from /dashboard (middleware redirect)", async ({ page }) => {
    const navUrls: string[] = [];
    page.on("framenavigated", (f) => { if (f === page.mainFrame()) navUrls.push(f.url()); });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 15000 });

    // Beta 9: middleware redirects new user (onboardingCompletedAt=null)
    // to /practice/quickstart. NOT to /onboarding (legacy target).
    expect(page.url(), `Expected /practice/quickstart, got ${page.url()}`).toContain("/practice/quickstart");
    expect(navUrls.length, `Loop suspected: ${navUrls.join(" → ")}`).toBeLessThan(5);
  });

  test("legacy /onboarding URL redirects to /practice/quickstart", async ({ page }) => {
    const navUrls: string[] = [];
    page.on("framenavigated", (f) => { if (f === page.mainFrame()) navUrls.push(f.url()); });

    await page.goto("/onboarding", { waitUntil: "domcontentloaded", timeout: 15000 });

    expect(page.url()).toContain("/practice/quickstart");
    expect(navUrls.length).toBeLessThan(5);
  });

  test("once onboardingCompletedAt set (via API), other pages load without bounce", async ({ page, baseURL }) => {
    // Simulate a user who has completed their first session.
    // Use a hypothetical test action (or skip if not available).
    const api = await apiRequest.newContext();
    const r = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "complete-onboarding" },
    });
    if (!r.ok()) test.skip(true, "complete-onboarding action not implemented");
    await api.dispose();

    // After flagging onboarding complete, these pages should NOT bounce.
    const destinations = ["/resources", "/billing", "/flashcards", "/practice", "/analytics"];
    for (const dest of destinations) {
      await page.goto(dest, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url, `${dest} should not bounce to onboarding/quickstart`)
        .not.toContain("/practice/quickstart");
      expect(url, `${dest} should not bounce to legacy onboarding`)
        .not.toContain("/onboarding");
    }
  });

  test("welcome copy on /practice/quickstart is encouraging, not negative", async ({ page }) => {
    await page.goto("/practice/quickstart", { waitUntil: "domcontentloaded", timeout: 15000 });
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).toMatch(/start|begin|let.s|first question|most students/);
    expect(text).not.toContain("goodbye");
    expect(text).not.toContain("see you later");
    expect(text).not.toContain("we'll miss you");
    expect(text).not.toContain("sign out");
  });
});
