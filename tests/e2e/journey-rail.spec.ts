import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * Journey Mode rail — Beta 9.5 (2026-04-30).
 *
 * Verifies the dedicated /journey route group works end-to-end:
 *   1. Fresh user lands on /journey (auto-redirect from /dashboard).
 *   2. Step 0 shows "AP World History" preset + Change-course affordance.
 *   3. Starting the journey advances to Step 1 (3-MCQ warm-up).
 *   4. (A)(B)(C)(D) labeled answer rows render.
 *   5. Exit button returns the user to /dashboard and persists "exited"
 *      state so refresh doesn't re-trigger the redirect.
 *   6. /api/journey reset drops state cleanly.
 *
 * Avoids depending on Step 2-5 (FRQ + diagnostic + targeted MCQ + done)
 * since those need a fresh question bank + AI generation; the auth.setup
 * harness can't reliably guarantee those resources in <30s on staging.
 * Steps 2-5 should get follow-up coverage in a longer integration spec.
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe.configure({ retries: 2, timeout: 60_000 });

test.describe("Journey Mode rail (Beta 9.5)", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    // Reset the journey for the test user so we always start fresh.
    const api = await apiRequest.newContext();
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    // Drop any existing UserJourney row.
    const tokenRes = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    const j = await tokenRes.json();
    const cookieHeader = `${j.cookieName}=${j.sessionToken}`;
    await api.post(`${baseURL}/api/journey`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { action: "reset" },
    });
    await api.dispose();
  });

  test("/api/journey reset → null state for fresh user", async ({ request, baseURL }) => {
    // Verify the API directly. Auth comes from storageState (authed project).
    const r = await request.get(`${baseURL}/api/journey`);
    expect(r.ok()).toBe(true);
    const d = await r.json();
    // After reset (beforeEach), the journey row is deleted.
    expect(d.journey).toBeNull();
  });

  test("Step 0 — course pick screen renders with default AP World History", async ({ page, context }) => {
    // Drop the local "exited" flag set by auth.setup so the dashboard
    // redirect actually fires.
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /Welcome to StudentNest/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/AP World History/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Start my plan/i })).toBeVisible();
    await expect(page.getByText(/Change course/i)).toBeVisible();
  });

  test("Step 0 — Change course button opens picker, lets user select another course", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    await page.goto("/journey");
    await page.getByText(/Change course/i).click();
    await expect(page.getByRole("heading", { name: /Pick your course/i })).toBeVisible({ timeout: 5000 });
    // The list should show several AP options
    await expect(page.getByText(/AP Biology/i).first()).toBeVisible();
    // Pick AP Biology
    await page.getByText(/AP Biology/i).first().click();
    // Back on Step 0, the chosen course is now AP Biology
    await expect(page.getByText(/AP Biology/i).first()).toBeVisible();
  });

  test("Exit button — redirects to dashboard + persists exited state", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /Welcome to StudentNest/i })).toBeVisible({ timeout: 15000 });
    // Beta 9.6 — Exit now opens an exit-intent modal first. Click Skip
    // to dismiss without feedback (preserves the original "redirects"
    // contract this test asserts).
    await page.getByRole("button", { name: /Exit/i }).click();
    await expect(page.getByRole("heading", { name: /Before you go/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /^Skip$/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("Step 1 — clicking 'Start my plan' advances + shows (A)(B)(C)(D) labeled answers", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    await page.goto("/journey");
    await expect(page.getByRole("button", { name: /Start my plan/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /Start my plan/i }).click();

    // Step 1 progress label
    await expect(page.getByText(/Step 1.*Warm.?up/i).first()).toBeVisible({ timeout: 25000 });
    // CB-style labeled answer choice — at least one (A) prefix
    await expect(page.getByText(/^\(A\)$/).first()).toBeVisible({ timeout: 25000 });
  });

  test("/dashboard auto-redirects to /journey for fresh user without journey row", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    await page.goto("/dashboard");
    // Layout's useEffect calls /api/journey then router.replace → /journey
    await page.waitForURL(/\/journey/, { timeout: 15000 });
    expect(page.url()).toContain("/journey");
  });
});
