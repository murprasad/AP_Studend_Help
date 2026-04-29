import { test, expect } from "@playwright/test";

/**
 * Onboarding plan-choice tests — REWRITTEN for Beta 9 (2026-04-29).
 *
 * The 4-step onboarding wizard was deleted (commit a490c1f Beta 8.13.2)
 * after user critique that it was a conversion-killer:
 *   - "3 quick steps" then showed 4 (trust-killer)
 *   - "Pick your plan" Step 4 asked for monetization decision before
 *     the user had experienced any value
 *
 * The replacement: /practice/quickstart single-screen smart-default flow
 * with NO plan picker in onboarding. Premium upsell happens AFTER value
 * (post-Q1, post-FRQ taste, FREE_LIMITS hits). Pricing on /billing only.
 *
 * These tests now assert the NEW behavior: no plan-choice step in
 * onboarding, plan info reachable from /billing.
 */

test.describe("Onboarding plan-choice (Beta 9 — wizard deleted)", () => {
  test("no Pick-Plan step in onboarding flow", async ({ page }) => {
    await page.goto("/practice/quickstart");
    const body = page.locator("body");
    await expect(body).not.toContainText("Pick your plan");
    await expect(body).not.toContainText("Start Premium");
    await expect(body).not.toContainText("$9.99 / month");
  });

  test("/onboarding redirects away from legacy 4-step wizard", async ({ page }) => {
    // Beta 9 hotfix (commit 9318c48) — server-side redirect to /practice/quickstart.
    await page.goto("/onboarding");
    await page.waitForLoadState("domcontentloaded");
    // Must NOT show the legacy 4-step wizard copy.
    const body = page.locator("body");
    await expect(body).not.toContainText(/Set up your account|3 quick steps|How It Works/i);
  });

  test("/billing exposes Premium signal (post-value placement)", async ({ page }) => {
    await page.goto("/billing");
    await page.waitForLoadState("domcontentloaded");
    const body = page.locator("body");
    // Tier-tolerant: Free user sees "Upgrade", Premium user sees plan info.
    // Either way, page mentions Upgrade/Premium/$9.99 somewhere.
    await expect(body).toContainText(/Upgrade|Premium|9\.99/i, { timeout: 10000 });
  });
});
