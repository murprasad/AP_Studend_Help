import { test, expect } from "@playwright/test";

/**
 * Journey 5 — Parent Payment → Student Unlock (business-model reality).
 *
 * This is the fragile path that determines whether real revenue flows.
 * Parents are the payer; students are the user. If the webhook fires but
 * the student's account doesn't flip, they can't see the premium features
 * they paid for — and that's the exact class of bug that caused Srinidhi
 * to email support last month.
 *
 *   Given authed student on FREE tier
 *   When they trigger parent-invite via /api/parent-invite
 *   Then an email is dispatched (or queued) to the parent address
 *   And the parent email contains a checkout link tied to the student's userId
 *   When the parent completes Stripe checkout (test mode)
 *   Then checkout.session.completed webhook fires with student's userId
 *   Then the student's subscriptionTier flips to PREMIUM
 *   And the student's next API call reflects premium state
 *   And premium UI surfaces for the student
 *
 * Blocked (parts requiring Stripe test mode marked test.skip):
 *   - Actual checkout session creation
 *   - Webhook → DB flip
 *
 * What we CAN assert today without Stripe test mode:
 *   - Parent invite endpoint accepts valid email → 200
 *   - Invalid email → 400
 *   - Missing auth → 401
 *   - Student state persists correctly across page loads (no phantom upgrade)
 *   - Webhook handler rejects unsigned payloads → 400 (not 500)
 */

test.describe.configure({ retries: 1, timeout: 90_000 });

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const STRIPE_TEST_MODE = !!process.env.STRIPE_TEST_SECRET_KEY;

test.describe("Journey 5 — Parent invite (unblocked)", () => {
  test.skip(!CRON_SECRET, "CRON_SECRET required");

  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "create" },
    });
  });

  test("parent invite with valid email → accepted (200 or 202)", async ({ request }) => {
    const res = await request.post("/api/parent-invite", {
      data: { parentEmail: "parent-test@example.invalid", parentName: "Test Parent" },
      failOnStatusCode: false,
    });
    // Accept either 200 (email dispatched) or 202 (queued). Never 500.
    expect(res.status(), `parent-invite: ${res.status()}`).toBeLessThan(500);
    expect([200, 202, 204].includes(res.status()), `expected 200/202/204, got ${res.status()}`).toBe(true);
  });

  test("parent invite with invalid email → 400 (not 500)", async ({ request }) => {
    const res = await request.post("/api/parent-invite", {
      data: { parentEmail: "not-an-email", parentName: "X" },
      failOnStatusCode: false,
    });
    expect(res.status(), `invalid email must 400, got ${res.status()}`).toBe(400);
  });

  test("parent invite without auth → 401", async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
    const res = await ctx.post((process.env.E2E_BASE_URL ?? "https://studentnest.ai") + "/api/parent-invite", {
      data: { parentEmail: "p@example.invalid" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});

test.describe("Journey 5 — Stripe webhook safety (unblocked)", () => {
  test("webhook with no signature → 400 (never 500, never silent 200)", async ({ request }) => {
    const res = await request.post("/api/webhooks/stripe", {
      data: { type: "checkout.session.completed", data: {} },
      failOnStatusCode: false,
    });
    // Stripe requires a signed event. Unsigned = malformed = 400.
    expect(
      res.status(),
      `unsigned webhook must 400; 200 would be a silent-skip bug, 500 would be a crash`,
    ).toBe(400);
  });

  test("webhook with malformed JSON → 400 (not 500)", async ({ request }) => {
    const res = await request.post("/api/webhooks/stripe", {
      headers: { "Content-Type": "application/json" },
      data: "{not valid json",
      failOnStatusCode: false,
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("Journey 5 — End-to-end payment (Stripe test mode required)", () => {
  test.skip(!STRIPE_TEST_MODE, "STRIPE_TEST_SECRET_KEY required — Phase 4 dependency");

  test("checkout → webhook → student tier flips", async () => {
    // IMPLEMENTATION NOTE: this spec is scaffolded but will require
    // Stripe test-mode webhook secret + test price IDs. Journey-5b in
    // the master plan.
    test.fail(true, "Stripe test-mode pipe not yet wired; implementation tracked as Journey-5b");
  });

  test("webhook silent-skip scenario (no client_reference_id) → email fallback catches it", async () => {
    test.fail(true, "Needs Stripe test-mode to synthesize the event");
  });

  test("refund within 7 days → tier reverts", async () => {
    test.fail(true, "Needs Stripe test-mode refund API");
  });
});

test.describe("Journey 5 — UI honesty guardrails (unblocked)", () => {
  test.skip(!CRON_SECRET, "CRON_SECRET required");

  test("FREE user's /billing never claims 'Welcome to Premium'", async ({ page, request }) => {
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "create" },
    });
    await page.goto("/billing");
    if (page.url().includes("/login")) test.skip(true, "JWT expired — see E8");

    const text = await page.locator("body").innerText();
    // API truth — if the user is actually FREE, UI must never claim premium.
    const apiRes = await page.request.get("/api/billing/status");
    const billing = await apiRes.json().catch(() => ({}));
    if (billing.subscriptionTier === "FREE") {
      expect(text).not.toContain("Welcome to Premium!");
      expect(text).not.toContain("Your Premium subscription is active");
    }
  });

  test("/billing?success=1 polling never falsely shows 'Premium active' after timeout", async ({ page }) => {
    // Shared contract — separately guarded by billing-page-consistency.spec.
    // Duplicate assertion here because Journey 5 should FAIL if this
    // guardrail slips, even if billing-page-consistency isn't in scope.
    await page.goto("/billing?success=1");
    if (page.url().includes("/login")) test.skip(true);
    // Wait briefly; don't run the full 35s poll here (see billing-flicker).
    await page.waitForTimeout(3000);
    const text = await page.locator("body").innerText();
    // Either polling found premium (legit) or shows activation-pending.
    // Never shows "Welcome to Premium!" while status is still FREE.
    const apiRes = await page.request.get("/api/billing/status");
    const billing = await apiRes.json().catch(() => ({}));
    if (billing.subscriptionTier === "FREE") {
      expect(text).not.toContain("Welcome to Premium!");
    }
  });
});
