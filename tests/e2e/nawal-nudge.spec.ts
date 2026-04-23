import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * AutoLaunchNudge (Nawal-pattern) end-to-end coverage.
 *
 * User pattern: hit the dashboard 2+ times today, answered 0 practice
 * questions today. The nudge modal offers a 3-Q warmup.
 *
 * This spec seeds the fixture via /api/test/auth?action=seed-dashboard-
 * impressions (CRON_SECRET-gated), then walks the user through the
 * modal states:
 *   1. 2+ impressions + 0 responses → modal renders
 *   2. "Start warmup" button → redirects to /practice?mode=focused&count=3&src=auto_warmup
 *   3. "Not now" → modal dismisses + reload → does NOT re-show (sessionStorage)
 *   4. After reset: 0 impressions → modal does NOT render (pattern not met)
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe("AutoLaunchNudge — Nawal-pattern", () => {
  test.beforeAll(async () => {
    if (!CRON_SECRET) test.skip();
  });

  test.beforeEach(async ({ baseURL }) => {
    // Reset the test user's dashboard + response state, then seed 2
    // impressions spread across 45 minutes so they pass the new rule
    // (account age >= 30 min + impression spread >= 30 min). The test
    // user is long-lived in prod DB so account-age is always satisfied
    // after the first run.
    const api = await apiRequest.newContext();
    const res = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: {
        action: "seed-dashboard-impressions",
        count: 2,
        clearFirst: true,
        course: "AP_WORLD_HISTORY",
        spreadMinutes: 45, // ≥ 30 so MIN_IMPRESSION_SPREAD_MINUTES passes
      },
    });
    expect(res.ok(), `Fixture seed failed: ${res.status()}`).toBe(true);
    await api.dispose();
  });

  test("modal renders when user has 2+ impressions + 0 responses today", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    // The modal's accessible title is "Start with a 3-question warmup?"
    await expect(
      page.getByRole("dialog", { name: /3-question warmup/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Start warmup routes to /practice with auto_warmup src", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    const dialog = page.getByRole("dialog", { name: /3-question warmup/i });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    // Let the rest of the dashboard settle so the modal's DOM node doesn't
    // re-mount mid-click (ResumeCard / OutcomeProgressStrip / DailyGoalCard
    // all fetch their own data asynchronously).
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await dialog.getByRole("button", { name: /start warmup/i }).click();
    await page.waitForURL(/\/practice/, { timeout: 10000 });
    expect(page.url()).toMatch(/mode=focused/);
    expect(page.url()).toMatch(/src=auto_warmup/);
  });

  test("Not now dismisses + does not re-show on reload", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    const dialog = page.getByRole("dialog", { name: /3-question warmup/i });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    // Scope button lookup to the dialog to avoid matching other "Not now"
    // buttons if they exist elsewhere on the dashboard.
    await dialog.getByRole("button", { name: /not now/i }).click();
    // Modal should be gone.
    await expect(dialog).not.toBeVisible();
    // Reload — sessionStorage flag keeps it hidden for the rest of the day.
    await page.reload();
    await expect(
      page.getByRole("dialog", { name: /3-question warmup/i }),
    ).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("AutoLaunchNudge — negative cases", () => {
  test.beforeAll(async () => {
    if (!CRON_SECRET) test.skip();
  });

  test("does NOT render when user has 0 impressions today", async ({ page, baseURL }) => {
    // Seed zero — wipe the slate.
    const api = await apiRequest.newContext();
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "seed-dashboard-impressions", count: 0, clearFirst: true },
    });
    await api.dispose();

    // First dashboard visit after a fresh clear — the nudge rule needs
    // 2+ prior impressions, so on the VERY first visit it should NOT show.
    // (The one impression the dashboard itself creates still only gets us to 1.)
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    // Give the check a moment to resolve + the modal to be decided.
    await page.waitForTimeout(2000);
    await expect(page.getByRole("dialog", { name: /warmup/i })).not.toBeVisible();
  });

  test("does NOT render when impressions are clustered (< 30 min spread)", async ({ page, baseURL }) => {
    // Simulates the SSR+hydrate burst that brand-new users experience —
    // multiple DashboardImpressions in seconds, not the Nawal pattern.
    // Real user bug 2026-04-23: first-time signup saw the modal because
    // of this exact scenario. This test would have caught it.
    const api = await apiRequest.newContext();
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: {
        action: "seed-dashboard-impressions",
        count: 3,
        clearFirst: true,
        spreadMinutes: 0, // all impressions within seconds — NOT the pattern
      },
    });
    await api.dispose();

    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    await page.waitForTimeout(2000);
    await expect(page.getByRole("dialog", { name: /warmup/i })).not.toBeVisible();
  });
});
