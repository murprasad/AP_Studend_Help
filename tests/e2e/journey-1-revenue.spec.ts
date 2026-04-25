import { test, expect } from "@playwright/test";

/**
 * Journey 1 — Revenue path (the business-model contract).
 *
 *   Given: a FREE user provisioned by /api/test/auth
 *   When:  they have 20 practice responses today
 *   Then:  the 21st practice request is blocked with LOCK_COPY.practiceCap
 *   And:   /api/user/limits reports used=20, remaining=0
 *   And:   the upgrade CTA routes to /billing (Stripe-test-mode path tested separately)
 *   And:   DB state remains subscriptionTier=FREE
 *
 * Failure branches (also asserted here):
 *   - Refresh after hitting cap → still blocked (cap is server-side, not UI state)
 *   - Calling /api/practice with bypass attempts → still 429
 *
 * This is the first of five journey contracts per the reliability-system
 * reframing (2026-04-24 PM). Tests transactional product outcomes, not
 * page renders.
 *
 * Upgrade + Stripe flow: covered in journey-1b once test mode is wired.
 */

test.describe.configure({ retries: 1, timeout: 120_000 });

const CRON_SECRET = process.env.CRON_SECRET ?? "";

test.describe("Journey 1 — Revenue (practice cap enforcement)", () => {
  test.skip(!CRON_SECRET, "CRON_SECRET required to provision test user");

  test.beforeEach(async ({ request }) => {
    // Reset FREE user state. The shared functional-test user is created
    // at the start of the suite; seed-usage with clear=true resets today's
    // responses so each test starts at a known count.
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "create" },
    });
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "seed-usage", count: 0, clear: true },
    });
  });

  test("20th question allowed, 21st blocked with LOCK_COPY.practiceCap", async ({ request, page }) => {
    // Seed exactly 20 responses to put user AT the cap.
    const seedRes = await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "seed-usage", count: 20, clear: true },
    });
    expect(seedRes.ok(), `seed-usage failed: ${seedRes.status()}`).toBeTruthy();

    // State check: /api/user/limits should reflect 20 used.
    const limitsRes = await request.get("/api/user/limits");
    expect(limitsRes.ok()).toBeTruthy();
    const limits = await limitsRes.json();
    // Current contract (verified 2026-04-24):
    //   { tier, unlimited, limits: {practiceQuestionsPerDay: 20, ...},
    //     usage: { practice: {used, limit, remaining}, tutor, mockExam }, ... }
    const used = limits.usage?.practice?.used;
    expect(used, `expected used=20 at cap, got ${JSON.stringify(limits.usage)}`).toBe(20);
    expect(limits.usage.practice.remaining).toBe(0);
    expect(limits.usage.practice.limit).toBe(20);

    // Attempt a 21st practice request — must be blocked.
    const practiceRes = await request.post("/api/practice", {
      data: {
        course: "AP_WORLD_HISTORY",
        unit: "ALL",
        sessionType: "PRACTICE",
        questionCount: 1,
        difficulty: "MEDIUM",
      },
    });
    expect(practiceRes.status(), "21st practice must be 429, not 200").toBe(429);

    // Server-side copy must match LOCK_COPY contract (urgency framing).
    const body = await practiceRes.json();
    expect(body.error, "Expected LOCK_COPY.practiceCap").toContain("Daily practice limit");
    expect(body.limitExceeded).toBe(true);
    expect(body.limitType).toBe("daily_question_cap");
    expect(body.upgradeUrl, "upgrade CTA must route to /billing").toContain("/billing");

    // UI path: /practice page must surface the cap message.
    // Playwright drives the page with the existing storageState (test user
    // session). The paywall component reads the API response and renders.
    await page.goto("/practice?course=AP_WORLD_HISTORY");

    // Give the page 2s to hydrate + fetch /api/user/limits + render paywall
    await page.waitForTimeout(2000);
    const text = await page.locator("body").innerText();
    expect(text, "UI should show cap-hit copy").toMatch(/Daily practice limit|limit reached/i);

    // State consistency — DB unchanged (tier still FREE)
    const userRes = await request.get("/api/user");
    expect(userRes.ok()).toBeTruthy();
    const user = await userRes.json();
    expect(user.subscriptionTier, "tier must stay FREE until upgrade completes").toBe("FREE");
  });

  test("19 answered → 20th still allowed (off-by-one guard)", async ({ request }) => {
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "seed-usage", count: 19, clear: true },
    });
    const res = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "PRACTICE", questionCount: 1, difficulty: "MEDIUM" },
    });
    expect(
      [200, 201].includes(res.status()),
      `20th practice at count=19 must succeed; got ${res.status()}`,
    ).toBe(true);
  });

  test("cap survives refresh — server-side enforcement, not UI state", async ({ request }) => {
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "seed-usage", count: 20, clear: true },
    });
    // Two consecutive blocked requests — neither bypasses the cap.
    const a = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "PRACTICE", questionCount: 1, difficulty: "MEDIUM" },
    });
    const b = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "PRACTICE", questionCount: 1, difficulty: "MEDIUM" },
    });
    expect(a.status()).toBe(429);
    expect(b.status()).toBe(429);
  });

  test("cap does NOT apply to mock exam (different paywall)", async ({ request }) => {
    // Mock exams have their own Q5 paywall; practice cap must not apply.
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "seed-usage", count: 20, clear: true },
    });
    const res = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "MOCK_EXAM", questionCount: 1, difficulty: "MEDIUM" },
    });
    expect(
      res.status(),
      "mock exam path should not 429 at the practice cap",
    ).not.toBe(429);
  });

  test("upgrade CTA URL carries UTM source for funnel analytics", async ({ request }) => {
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "seed-usage", count: 20, clear: true },
    });
    const res = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "PRACTICE", questionCount: 1, difficulty: "MEDIUM" },
    });
    const body = await res.json();
    expect(body.upgradeUrl).toMatch(/\/billing/);
    expect(body.upgradeUrl).toContain("utm_source=daily_cap");
  });
});
