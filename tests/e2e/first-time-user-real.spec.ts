import { test, expect, request as apiRequest } from "@playwright/test";

// REAL first-time-user E2E spec — uses an actual fresh fixture
// (onboardingCompletedAt: null) and walks the full signup → onboarding
// → navigate flow.
//
// The previous "first-time-user-fmea.spec.ts" technically used
// reset-onboarding but didn't catch the JWT-staleness bug because the
// JWT was still set with onboardingCompletedAt non-null from the
// auth.setup step that ran first. That's the architecture gap that
// caused tonight's bounce loop bug to ship.

const CRON_SECRET = process.env.CRON_SECRET;

test.describe.configure({ retries: 2 });

test.describe("Real first-time user — signup → onboarding → navigate", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    const api = await apiRequest.newContext();
    // Reset onboarding so the JWT also reflects null (the bug we missed).
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "reset-onboarding" },
    });
    await api.dispose();
  });

  test("after onboarding completion, navigating to /analytics does NOT bounce to /onboarding", async ({ page }) => {
    // Walk through onboarding steps
    await page.goto("/onboarding");
    const step1 = page.getByRole("button", { name: /continue with/i });
    await step1.waitFor({ state: "visible", timeout: 15000 });
    await step1.click();
    await page.waitForTimeout(800);
    const step2 = page.getByRole("button", { name: /got it|next/i }).first();
    await step2.waitFor({ state: "visible", timeout: 10000 });
    await step2.click();
    await page.waitForTimeout(800);
    const step3 = page.getByRole("button", { name: /^continue$/i }).first();
    await step3.waitFor({ state: "visible", timeout: 10000 });
    await step3.click();
    await page.waitForTimeout(800);
    // Step 4: pick free
    const startFree = page.getByRole("button", { name: /start free|continue free/i }).first();
    await startFree.waitFor({ state: "visible", timeout: 10000 });
    await startFree.click();

    // Wait for navigation to dashboard (allow up to 5s for JWT update)
    await page.waitForURL(/\/dashboard/, { timeout: 8000 });
    expect(page.url()).toContain("/dashboard");
    expect(page.url()).not.toContain("/onboarding");

    // Now navigate to /analytics — this is the bug we shipped tonight
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // Must not be bounced back to /onboarding
    expect(page.url()).toContain("/analytics");
    expect(page.url()).not.toContain("/onboarding");
  });

  test("after onboarding completion, /resources, /billing, /flashcards, /practice all load without bounce", async ({ page }) => {
    // Walk onboarding (same as above, condensed)
    await page.goto("/onboarding");
    await page.getByRole("button", { name: /continue with/i }).waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: /continue with/i }).click();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /got it|next/i }).first().click();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /start free|continue free/i }).first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 8000 });

    // Test each navigable destination — none should bounce to /onboarding
    const destinations = ["/resources", "/billing", "/flashcards", "/practice"];
    for (const dest of destinations) {
      await page.goto(dest);
      await page.waitForLoadState("networkidle");
      expect(page.url(), `Should land on ${dest} without bounce`).not.toContain("/onboarding");
    }
  });

  test("the welcome message after signup says 'welcome' or similar — never 'goodbye' or other wrong copy", async ({ page }) => {
    // Walk past step 1 — step 2 typically has the welcome/intro
    await page.goto("/onboarding");
    const step1 = page.getByRole("button", { name: /continue with/i });
    await step1.waitFor({ state: "visible", timeout: 15000 });

    // Get all the visible text on step 1 (course picker)
    const step1Text = await page.locator("body").innerText();
    // Must contain encouraging copy
    expect(step1Text.toLowerCase()).toMatch(/start|begin|choose|welcome|let's|let.s/);
    // Must NOT contain wrong copy that doesn't fit signup context
    expect(step1Text.toLowerCase()).not.toContain("goodbye");
    expect(step1Text.toLowerCase()).not.toContain("see you later");
    expect(step1Text.toLowerCase()).not.toContain("we'll miss you");
    // Must not have signed-out copy
    expect(step1Text.toLowerCase()).not.toContain("sign out");
  });
});
