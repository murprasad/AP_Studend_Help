import { test, expect } from "@playwright/test";

/**
 * FlashcardsDueCard end-to-end coverage.
 *
 * The block renders when the user has ≥5 due-or-new flashcards for the
 * current course. Since the prod test user starts with a fresh slate
 * AND the global deck has 1500 seeded flashcards for AP_WORLD_HISTORY,
 * a brand-new test user should see the block immediately.
 *
 * Assertions:
 *   1. Dashboard renders the "cards ready for review" block for a fresh
 *      user with no FlashcardReview rows yet.
 *   2. Block's Review button routes to /flashcards.
 *   3. /api/flashcards/due-count returns a sensible count (>0, capped at 50).
 */

test.describe("FlashcardsDueCard", () => {
  test("block renders for fresh user (≥5 seeded cards available)", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    // The block uses "cards ready for review" copy. Wait up to 10s for
    // the due-count fetch to resolve + the component to mount.
    await expect(page.getByText(/cards ready for review/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("Review button routes to /flashcards", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/onboarding")) test.skip();
    const card = page.getByText(/cards ready for review/i).first();
    await card.waitFor({ state: "visible", timeout: 10000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    // There's only one "Review" button on the dashboard — it's inside
    // the flashcards-due-card. No need to scope.
    await page.getByRole("link").filter({ hasText: /review/i }).first().click();
    await page.waitForURL(/\/flashcards/, { timeout: 10000 });
    expect(page.url()).toContain("/flashcards");
  });

  test("/api/flashcards/due-count returns count >= 5 for fresh user", async ({ request }) => {
    const r = await request.get("/api/flashcards/due-count?course=AP_WORLD_HISTORY");
    expect(r.ok()).toBe(true);
    const d = await r.json();
    expect(d.count).toBeGreaterThanOrEqual(5);
    expect(d.count).toBeLessThanOrEqual(50);
  });
});
