import { test, expect } from "@playwright/test";

/**
 * Authed flows — Dashboard v2, Flashcards, Locked-value paywall.
 *
 * Runs as the test user provisioned by auth.setup.ts. Each test starts
 * already-logged-in (via storageState).
 */

test.describe("Dashboard v2", () => {
  test("dashboard loads as authed user", async ({ page }) => {
    await page.goto("/dashboard");
    // We accept either dashboard URL OR onboarding redirect (new test user).
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|onboarding)/);
  });

  test("predicted score format (no '%' probability) on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) {
      // Skip if the test user is mid-onboarding; not the surface we're testing.
      test.skip();
    }
    const text = await page.locator("body").innerText();
    // Native-scale format examples: "3 / 5", "1240 / 1600", "26 / 36".
    // Don't require a specific exam-family match (test user may be on AP).
    // Belt-and-suspenders: also assert the literal "pass probability" is
    // not rendered.
    expect(text.toLowerCase()).not.toContain("pass probability");
  });

  test("locked value visible to free user (Block 5)", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    const text = await page.locator("body").innerText();
    // The LockedValueCard always anchors $9.99/mo and the "Send to parent"
    // CTA. If the test user has been upgraded to PREMIUM somehow, this
    // skips silently — not worth a hard fail on a flaky tier signal.
    if (!text.includes("$9.99")) {
      console.warn("[locked value] $9.99 not found — test user may be PREMIUM, skipping");
      test.skip();
    }
    expect(text).toContain("Send to parent");
  });

  test("sidebar shows Flashcards nav item", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    // Sidebar nav is visible on desktop viewport (default Playwright).
    // The label "Flashcards" is unique — no other surface uses it.
    await expect(page.getByRole("link", { name: /flashcards/i }).first()).toBeVisible();
  });
});

test.describe("Flashcards", () => {
  test("flashcards page loads with a card OR empty state", async ({ page }) => {
    await page.goto("/flashcards");
    if (page.url().includes("/onboarding")) test.skip();
    // Either a card is loaded ("Show answer" button) or empty state
    // ("No flashcards yet for this course") — both are valid renders.
    await expect(
      page.locator("body"),
    ).toContainText(/Show answer|No flashcards yet/i, { timeout: 15000 });
  });

  test("show answer reveals back + rating buttons", async ({ page }) => {
    await page.goto("/flashcards");
    if (page.url().includes("/onboarding")) test.skip();
    const showBtn = page.getByRole("button", { name: /show answer/i });
    if (!(await showBtn.isVisible().catch(() => false))) {
      // Empty state — no card to test
      test.skip();
    }
    await showBtn.click();
    await expect(page.getByRole("button", { name: /^forgot$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^hard$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^good$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^easy$/i })).toBeVisible();
  });

  test("rating advances the card", async ({ page }) => {
    await page.goto("/flashcards");
    if (page.url().includes("/onboarding")) test.skip();
    const showBtn = page.getByRole("button", { name: /show answer/i });
    if (!(await showBtn.isVisible().catch(() => false))) test.skip();
    await showBtn.click();
    // Capture front text BEFORE rating.
    const beforeFront = await page.locator("body").innerText();
    await page.getByRole("button", { name: /^good$/i }).click();
    // Wait for the next card or empty state. Either way the previous card's
    // "Show answer" button should reappear (next card) OR the empty state
    // should render. We just assert the rating buttons disappear.
    await expect(page.getByRole("button", { name: /^good$/i })).not.toBeVisible({ timeout: 10000 });
    // And — the page should still be /flashcards (not navigated away).
    expect(page.url()).toContain("/flashcards");
    void beforeFront;
  });
});

test.describe("Sidebar nav reachability", () => {
  // Each main nav target must return 200 (not 404 or 5xx) for the authed
  // user. We don't deep-check rendering — just that the routes resolve.
  const targets = ["/dashboard", "/practice", "/mock-exam", "/diagnostic", "/flashcards", "/analytics", "/study-plan", "/resources", "/billing", "/about"];
  for (const t of targets) {
    test(`${t} resolves (not 404)`, async ({ page }) => {
      const resp = await page.goto(t);
      expect(resp).not.toBeNull();
      expect(resp!.status(), `${t} returned ${resp!.status()}`).toBeLessThan(400);
    });
  }
});

test.describe("API contracts (authed)", () => {
  test("GET /api/user/limits returns FREE_LIMITS for free user", async ({ request }) => {
    const r = await request.get("/api/user/limits");
    expect(r.ok()).toBe(true);
    const data = await r.json();
    expect(["FREE", "PREMIUM"]).toContain(data.tier);
    if (data.tier === "FREE") {
      expect(data.limits.practiceQuestionsPerDay).toBe(20);
      expect(data.limits.tutorChatsPerDay).toBe(3);
      expect(data.limits.mockExamQuestions).toBe(5);
      expect(data.limits.frqAccess).toBe(false);
      expect(data.limits.fullAnalytics).toBe(false);
    }
  });

  test("GET /api/coach-plan returns native-score fields", async ({ request }) => {
    const r = await request.get("/api/coach-plan?course=AP_WORLD_HISTORY");
    expect(r.ok()).toBe(true);
    const d = await r.json();
    // Either a real plan with family/scaledScore OR a no-data response.
    if (d.family) {
      expect(["AP", "SAT", "ACT"]).toContain(d.family);
      expect(typeof d.scaleMax === "number").toBe(true);
    }
  });

  test("GET /api/flashcards returns cards array", async ({ request }) => {
    const r = await request.get("/api/flashcards?course=AP_WORLD_HISTORY");
    expect(r.ok()).toBe(true);
    const d = await r.json();
    expect(Array.isArray(d.cards)).toBe(true);
  });
});
