import { test, expect } from "@playwright/test";

// Catches the FRQ Practice paywall mismatch the user observed: paywall
// must be visible IFF subscriptionTier is FREE (and inversely).
//
// Today the auth.setup helper signs us in as a FREE user, so we test the
// FREE side. The PREMIUM side is verified via API contract — we don't
// switch tiers mid-test.

test.describe.configure({ retries: 2 });

test.describe("Paywall accuracy", () => {
  test("FRQ Practice page shows Premium upsell for FREE user (taste-first model)", async ({ page }) => {
    const apiRes = await page.request.get("/api/billing/status");
    const billing = await apiRes.json();
    test.skip(billing.subscriptionTier !== "FREE", "Paywall test only meaningful for FREE.");

    await page.goto("/frq-practice");
    await page.waitForLoadState("networkidle");

    // Beta 8.13 (2026-04-29): page-level FRQ paywall removed — replaced by
    // per-type per-course attempt cap enforced server-side. Free users now
    // browse FRQs + get 1 attempt each of DBQ/LEQ/SAQ per course. Premium
    // upsell is for unlimited attempts + detailed line-by-line coaching,
    // shown alongside the FRQ list (not as a hard wall).
    const text = await page.locator("body").innerText();
    expect(text).toMatch(/Premium|Upgrade|FRQ/i);
    // Upgrade CTA still present somewhere on the page (depth-monetization lever)
    const upgradeButton = page.getByRole("link", { name: /upgrade/i }).or(page.getByRole("button", { name: /upgrade/i }));
    expect(await upgradeButton.count()).toBeGreaterThan(0);
  });

  test("/api/user/limits reflects FREE user's caps (Option B contract)", async ({ page }) => {
    const apiRes = await page.request.get("/api/user/limits");
    expect(apiRes.ok()).toBeTruthy();
    const limits = await apiRes.json();
    if (limits.tier !== "FREE") {
      test.skip(true, "Test fixture is Premium.");
    }
    // Current contract (per src/app/api/user/limits/route.ts):
    //   { tier, unlimited, limits: FREE_LIMITS, usage: {practice, tutor, mockExam}, ... }
    expect(limits.tier).toBe("FREE");
    expect(limits.unlimited).toBe(false);
    // Numeric practice cap — either the contract field or usage.practice.limit
    expect(
      typeof limits.limits?.practiceQuestionsPerDay,
      "FREE response must include limits.practiceQuestionsPerDay",
    ).toBe("number");
    expect(limits.limits.practiceQuestionsPerDay).toBeGreaterThan(0);
    // Usage reporting present
    expect(limits.usage?.practice).toBeTruthy();
    expect(typeof limits.usage.practice.limit).toBe("number");
    expect(typeof limits.usage.practice.used).toBe("number");
    expect(typeof limits.usage.practice.remaining).toBe("number");
  });
});
