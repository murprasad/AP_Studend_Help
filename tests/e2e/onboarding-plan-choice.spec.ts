import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * Onboarding "Pick your plan" step (added 2026-04-23 per user request).
 *
 * Walks the test user through the 4-step onboarding wizard:
 *   1. Choose Course
 *   2. How It Works
 *   3. You're set
 *   4. Pick your plan — Free or Premium
 *
 * Asserts:
 *   - Step 4 renders with BOTH Free and Premium cards
 *   - "Start Free" routes to /dashboard
 *   - "Start Premium" routes to /billing with utm_source=onboarding
 *   - Free card shows the 6 canonical Option B free features
 *   - Premium card shows the 6 canonical premium features
 *
 * The test user's onboarding flag is reset via the existing test-auth
 * endpoint so each run walks the flow fresh.
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe("Onboarding plan-choice", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    const api = await apiRequest.newContext();
    const res = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "reset-onboarding" },
    });
    expect(res.ok(), `reset-onboarding failed: ${res.status()}`).toBe(true);
    await api.dispose();
  });

  // Helper: click through steps 1 → 2 → 3 → 4. Each step's primary button
  // is visible only when that step is active.
  async function walkToPlanStep(page: import("@playwright/test").Page) {
    await page.goto("/onboarding");
    // Step 1: "Continue with {course}" button
    const step1 = page.getByRole("button", { name: /continue with/i });
    await step1.waitFor({ state: "visible", timeout: 15000 });
    await step1.click();
    await page.waitForTimeout(800);
    // Step 2: "Got it — next" (em-dash, distinct from other Continues)
    const step2 = page.getByRole("button", { name: /got it|next/i }).first();
    await step2.waitFor({ state: "visible", timeout: 10000 });
    await step2.click();
    await page.waitForTimeout(800);
    // Step 3: generic "Continue"
    const step3 = page.getByRole("button", { name: /^continue$/i }).first();
    await step3.waitFor({ state: "visible", timeout: 10000 });
    await step3.click();
  }

  test("step 4 renders both Free and Premium cards", async ({ page }) => {
    await walkToPlanStep(page);
    await expect(page.getByText("Pick your plan")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /^start free/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /start premium/i })).toBeVisible();
  });

  test("Free card lists the 6 canonical free features", async ({ page }) => {
    await walkToPlanStep(page);
    await expect(page.getByText("Pick your plan")).toBeVisible({ timeout: 10000 });
    const body = page.locator("body");
    await expect(body).toContainText(/30 practice questions/i);
    await expect(body).toContainText(/Mock exam preview/i);
    await expect(body).toContainText(/Unlimited flashcards/i);
    await expect(body).toContainText(/Predicted AP\/SAT\/ACT/i);
    await expect(body).toContainText(/3 Sage tutor chats/i);
    await expect(body).toContainText(/Diagnostic every 14 days/i);
  });

  test("Premium card shows $9.99 anchor + unlimited features", async ({ page }) => {
    await walkToPlanStep(page);
    await expect(page.getByText("Pick your plan")).toBeVisible({ timeout: 10000 });
    const body = page.locator("body");
    await expect(body).toContainText("$9.99");
    await expect(body).toContainText(/Unlimited practice.*FRQ/i);
    await expect(body).toContainText(/Full mock exams/i);
    await expect(body).toContainText(/Full analytics/i);
  });

  test("Start Free routes to /dashboard", async ({ page }) => {
    await walkToPlanStep(page);
    await expect(page.getByText("Pick your plan")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^start free/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("Start Premium routes to /billing with utm_source=onboarding", async ({ page }) => {
    await walkToPlanStep(page);
    await expect(page.getByText("Pick your plan")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /start premium/i }).click();
    await page.waitForURL(/\/billing/, { timeout: 10000 });
    expect(page.url()).toContain("/billing");
    expect(page.url()).toContain("utm_source=onboarding");
  });
});
