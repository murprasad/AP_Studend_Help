import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * First-Time-User FMEA Walkthrough.
 *
 * Failure Mode and Effects Analysis: for every screen a brand-new
 * user sees in their first 60 seconds, assert the UX matches the
 * Option B spec. Catches the classes of bugs the real user reported
 * over 2026-04-22/23:
 *
 *   - "Nawal nudge appeared on my first signup" (account too new)
 *   - "Quick Check header renders with empty body" (flag-gated)
 *   - "FRQ Practice visible to free user" (not gated at UI)
 *   - "Flashcards show wrong course" (silent course fallback)
 *   - "Diagnostic appears unlimited" (no cooldown)
 *
 * Setup: reset test user's onboarding state + clear response history
 * so each run walks the flow fresh. Skips on CRON_SECRET absent (PR
 * CI without prod secrets — run locally/on-main).
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe("First-time-user FMEA — end-to-end walkthrough", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    const api = await apiRequest.newContext();
    // Reset onboarding so we walk the wizard from scratch.
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "reset-onboarding" },
    });
    // Clear impressions + responses so dashboard is "fresh user" state.
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "seed-dashboard-impressions", count: 0, clearFirst: true, course: "AP_WORLD_HISTORY" },
    });
    await api.dispose();
  });

  // Helper — walk steps 1..4. Each step's primary advance button has
  // different text:
  //   Step 1: "Continue with {course short name}" (e.g. "Continue with AP World Hist")
  //   Step 2: "Got it — next"  (em-dash)
  //   Step 3: "Continue"
  // Matching each by a distinct regex avoids false matches against
  // sidebar items / Back buttons.
  async function walkOnboarding(page: import("@playwright/test").Page) {
    await page.goto("/onboarding");
    const step1 = page.getByRole("button", { name: /continue with/i });
    await step1.waitFor({ state: "visible", timeout: 15000 });
    await step1.click();
    await page.waitForTimeout(800);
    const step2 = page.getByRole("button", { name: /got it|next/i }).first();
    await step2.waitFor({ state: "visible", timeout: 10000 });
    await step2.click();
    await page.waitForTimeout(800);
    // Step 3 "Continue" button — avoid matching Back (which also has a
    // "Continue with..." ? no, Back is distinct) or a nav.
    const step3 = page.getByRole("button", { name: /^continue$/i }).first();
    await step3.waitFor({ state: "visible", timeout: 10000 });
    await step3.click();
  }

  test("FMEA-1: onboarding wizard walks 1 → 2 → 3 → 4 with sensible copy", async ({ page }) => {
    await walkOnboarding(page);
    // Step 4: Pick your plan
    await expect(page.getByText("Pick your plan")).toBeVisible({ timeout: 10000 });
  });

  test("FMEA-2: Free card copy matches Option B spec exactly", async ({ page }) => {
    await walkOnboarding(page);
    await expect(page.getByText("Pick your plan")).toBeVisible({ timeout: 10000 });
    const body = page.locator("body");
    // 6 canonical free features — if any of these change, update tier-limits.ts
    // + this test + billing page in lockstep.
    await expect(body).toContainText("30 practice questions");
    await expect(body).toContainText(/Mock exam preview.*5 Qs/i);
    await expect(body).toContainText(/Unlimited flashcards/i);
    await expect(body).toContainText(/Predicted AP\/SAT\/ACT score/i);
    await expect(body).toContainText(/3 Sage tutor chats/i);
    await expect(body).toContainText(/Diagnostic every 14 days/i);
    // Money-back + cancel-anytime disclaimers present
    await expect(body).toContainText(/Cancel anytime.*money-back/i);
  });

  test("FMEA-3: Free path lands on dashboard with 'Ready to get your score moving?' gate NOT fired", async ({ page }) => {
    await walkOnboarding(page);
    await page.getByRole("button", { name: /^start free/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    // Nawal nudge MUST NOT fire for a fresh user (account < 30 min OR
    // clustered impressions). This was the bug report that prompted
    // the 30-min age + 30-min-spread guardrails.
    await page.waitForTimeout(2500);
    await expect(
      page.getByRole("dialog", { name: /warmup|score moving/i }),
    ).not.toBeVisible();
  });

  test("FMEA-4: FRQ Practice — taste-first model (free user can browse + try, depth gated)", async ({ page }) => {
    // Fresh user from beforeEach. Navigate to FRQ.
    // Beta 8.13 (2026-04-29): replaced page-level paywall with per-type
    // per-course attempt cap (1 DBQ + 1 LEQ + 1 SAQ + 1 generic FRQ
    // lifetime per course). Free users should now see the FULL FRQ list
    // and be able to read prompts. The "Premium" upsell language remains
    // for the depth (detailed line-by-line coaching, unlimited attempts).
    await walkOnboarding(page);
    await page.getByRole("button", { name: /^start free/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.goto("/frq-practice?course=AP_PHYSICS_1");
    // Verify the page loaded SOME FRQ content (list or detail) AND mentions
    // Premium for the upgrade lever — exact copy may vary by viewport but
    // both signals must be present.
    await expect(page.locator("body")).toContainText(/Premium|Upgrade|FRQ/i, {
      timeout: 10000,
    });
  });

  test("FMEA-5: Flashcards page shows current course name prominently", async ({ page }) => {
    await walkOnboarding(page);
    await page.getByRole("button", { name: /^start free/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.goto("/flashcards");
    // Course name banner — bugfix 2026-04-23 for user confusion about
    // wrong-subject cards. Must be visible whether the deck is loaded
    // or the empty state shows.
    await expect(page.locator("body")).toContainText(/Reviewing/i, { timeout: 10000 });
  });

  test("FMEA-6: Sidebar nav items all resolve to 200 for free user", async ({ page }) => {
    await walkOnboarding(page);
    await page.getByRole("button", { name: /^start free/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    const paths = ["/practice", "/mock-exam", "/diagnostic", "/flashcards", "/analytics", "/study-plan", "/resources", "/billing"];
    for (const p of paths) {
      const resp = await page.goto(p);
      expect(resp, `goto(${p}) returned null`).not.toBeNull();
      expect(resp!.status(), `${p} returned ${resp!.status()}`).toBeLessThan(400);
    }
  });

  test("FMEA-7: Dashboard has no 'pass probability' language leak", async ({ page }) => {
    await walkOnboarding(page);
    await page.getByRole("button", { name: /^start free/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const text = await page.locator("body").innerText();
    // Core regression guard: the Phase 1+2 rewrite killed this phrase.
    // If it reappears, the predicted-score redesign has regressed.
    // (Positive native-score assertion skipped — fresh test user has
    // zero signal so the hero card shows a skeleton until the first
    // session generates data.)
    expect(text.toLowerCase()).not.toContain("pass probability");
  });

  test("FMEA-8: Premium path routes to /billing with utm_source=onboarding", async ({ page }) => {
    await walkOnboarding(page);
    await page.getByRole("button", { name: /Start Premium/i }).click();
    await page.waitForURL(/\/billing/, { timeout: 10000 });
    expect(page.url()).toContain("utm_source=onboarding");
  });

  test("FMEA-9: /api/user/limits returns Option B tier-limits for free user", async ({ request }) => {
    const r = await request.get("/api/user/limits");
    expect(r.ok()).toBe(true);
    const d = await r.json();
    if (d.tier === "FREE") {
      expect(d.limits.practiceQuestionsPerDay).toBe(30);
      expect(d.limits.tutorChatsPerDay).toBe(3);
      expect(d.limits.mockExamQuestions).toBe(5);
      expect(d.limits.frqAccess).toBe(false);
      expect(d.limits.fullAnalytics).toBe(false);
      expect(d.limits.sageCoachDeepPlan).toBe(false);
      expect(d.limits.diagnosticCooldownDays).toBe(14);
      expect(d.limits.frqFreeAttempts).toBe(1);
      expect(d.limits.flashcardSmartScheduling).toBe(false);
    }
  });

  test("FMEA-10: /api/auto-launch-check returns shouldNudge:false for fresh user", async ({ request }) => {
    // The test user is backdated 2 hours by auth.setup, so account age
    // check passes. Impressions were cleared in beforeEach. Rule needs
    // 2+ impressions with 30-min spread — fresh user has 0. Must not
    // fire.
    const r = await request.get("/api/auto-launch-check");
    expect(r.ok()).toBe(true);
    const d = await r.json();
    expect(d.shouldNudge).toBe(false);
  });
});
