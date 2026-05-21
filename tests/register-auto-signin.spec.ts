/**
 * E2E test for auto-sign-in on register + middleware onboarding enforcement.
 *
 * Ported from PrepLion 2026-05-21. Adjusted to studentnest.ai base URL.
 *
 * NOTE: API-level verification (POST /api/auth/register + emailVerified check)
 * is in scripts/_walkthrough-new-student.mjs. This Playwright file only does
 * the simple page-load assertions that don't require form-fill (form-fill is
 * flaky with Radix Select for the gradeLevel field — covered separately by
 * the manual walkthrough script).
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";

test.describe("SN register page + middleware onboarding enforcement", () => {
  test("register page renders without errors", async ({ page }) => {
    await page.goto(`${BASE}/register?track=ap`);
    await page.waitForLoadState("networkidle");

    // Form fields present
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Should NOT show the legacy "Check your email!" success state on first load
    const checkEmail = await page.locator('text=Check your email').count();
    expect(checkEmail).toBe(0);
  });

  test("empty form submit stays on /register (validation works)", async ({ page }) => {
    await page.goto(`${BASE}/register?track=ap`);
    await page.waitForLoadState("networkidle");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);
    const path = new URL(page.url()).pathname;
    expect(path).toBe("/register");
  });

  test("middleware: unauthenticated /practice/AP_BIOLOGY redirects to /login", async ({ page }) => {
    // Without a session, middleware's withAuth wrapper sends users to /login
    await page.goto(`${BASE}/practice/AP_BIOLOGY`);
    await page.waitForLoadState("networkidle");
    const path = new URL(page.url()).pathname;
    expect(path).toMatch(/^\/(login|signin|api\/auth)/);
  });

  test("middleware: unauthenticated /journey redirects to /login", async ({ page }) => {
    await page.goto(`${BASE}/journey`);
    await page.waitForLoadState("networkidle");
    const path = new URL(page.url()).pathname;
    expect(path).toMatch(/^\/(login|signin|api\/auth)/);
  });
});
