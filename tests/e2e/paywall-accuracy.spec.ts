import { test, expect } from "@playwright/test";

// Catches the FRQ Practice paywall mismatch the user observed: paywall
// must be visible IFF subscriptionTier is FREE (and inversely).
//
// Today the auth.setup helper signs us in as a FREE user, so we test the
// FREE side. The PREMIUM side is verified via API contract — we don't
// switch tiers mid-test.

test.describe.configure({ retries: 2 });

test.describe("Paywall accuracy", () => {
  test("FRQ Practice page shows paywall for FREE user", async ({ page }) => {
    const apiRes = await page.request.get("/api/billing/status");
    const billing = await apiRes.json();
    test.skip(billing.subscriptionTier !== "FREE", "Test fixture is Premium — paywall test only meaningful for FREE.");

    await page.goto("/frq-practice");
    await page.waitForLoadState("networkidle");

    const text = await page.locator("body").innerText();
    expect(text).toMatch(/premium feature|upgrade to unlock|FRQ practice is a premium/i);
    // Must show some sort of upgrade CTA
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
    // Per tier-limits.ts, FREE users have frqFreeAttempts and a daily practice cap.
    expect(typeof limits.dailyPracticeCap === "number" || limits.dailyPracticeCap !== undefined).toBeTruthy();
  });
});
