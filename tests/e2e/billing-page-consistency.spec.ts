import { test, expect } from "@playwright/test";

// Catches the "Welcome to Premium! / Current Plan: Free" inconsistency the
// E2E test user observed after paying twice.
//
// Rule: the billing page MUST NOT claim "Welcome to Premium" or
// "Your Premium subscription is active" when the actual subscription tier
// from the API is FREE. If state is FREE and ?success=1 is present after
// the polling timeout, banner must use honest amber-state copy.

test.describe.configure({ retries: 2 });

test.describe("Billing page state consistency", () => {
  test("FREE user with ?success=1 must not claim Premium after polling timeout", async ({ page }) => {
    // Poll cap is 30s in the page; wait it out so we land in the timed-out branch.
    await page.goto("/billing?success=1");

    // Wait for timeout (35s to be safe)
    await page.waitForTimeout(35000);

    // Confirm DB still shows FREE
    const apiRes = await page.request.get("/api/billing/status");
    expect(apiRes.ok()).toBeTruthy();
    const billing = await apiRes.json();
    if (billing.subscriptionTier !== "FREE") {
      test.skip(true, "Pre-condition not met: test user is already PREMIUM. Use a fresh free fixture.");
    }

    // Banner must NOT claim active Premium
    const bannerText = await page.locator("body").innerText();
    expect(bannerText).not.toContain("Your Premium subscription is active");
    expect(bannerText).not.toContain("Welcome to Premium!");

    // Banner SHOULD show the honest activation-pending message
    expect(bannerText).toMatch(/activation pending|received your payment/i);
  });

  test("FREE user without ?success=1 shows no Premium claims at all", async ({ page }) => {
    await page.goto("/billing");

    const apiRes = await page.request.get("/api/billing/status");
    const billing = await apiRes.json();
    if (billing.subscriptionTier !== "FREE") {
      test.skip(true, "Pre-condition not met: test user is already PREMIUM.");
    }

    const text = await page.locator("body").innerText();
    expect(text).not.toContain("Welcome to Premium!");
    expect(text).not.toContain("Your Premium subscription is active");
    // Should show the upgrade UI
    expect(text).toMatch(/upgrade to|premium/i);
  });

  test("Current plan section reflects actual API tier", async ({ page }) => {
    await page.goto("/billing");
    const apiRes = await page.request.get("/api/billing/status");
    const billing = await apiRes.json();

    const text = await page.locator("body").innerText();
    if (billing.subscriptionTier === "FREE") {
      // The current plan card must show "Free" — the bug to catch is when
      // the page hard-codes Premium copy somewhere unrelated to API state.
      expect(text).toMatch(/free/i);
    }
  });
});
