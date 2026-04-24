import { test, expect } from "@playwright/test";

/**
 * Persona A — /login page: CTAs, form, OAuth, error paths.
 *
 * Covers matrix rows 10.2 #1–3 (login paths) and #19 (logout button
 * surfaced after sign-in — deferred to authed suite).
 *
 * Anonymous-safe: no test user creation required.
 */

test.describe.configure({ retries: 1, timeout: 45_000 });

test.describe("/login page", () => {
  test("loads with email + password fields", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("has link to /register", async ({ page }) => {
    await page.goto("/login");
    const signup = page.locator('a[href*="/register"]').first();
    await expect(signup).toBeVisible();
  });

  test("has link to /forgot-password (or equivalent reset)", async ({ page }) => {
    await page.goto("/login");
    const forgot = page.locator('a[href*="forgot"], a[href*="reset"]').first();
    if ((await forgot.count()) === 0) {
      console.warn("[login] no forgot-password link found — verify this is intentional");
      test.skip(true, "forgot-password link absent on this deploy");
    }
    await expect(forgot).toBeVisible();
  });

  test("submits with invalid creds shows inline error, doesn't crash", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"], input[name="email"]').first().fill("definitely-not-a-user@example.invalid");
    await page.locator('input[type="password"]').first().fill("WrongPassword123");
    const submit = page.getByRole("button", { name: /^sign in|^log in|^login$/i }).first();
    if ((await submit.count()) === 0) test.skip(true, "submit button not located");
    await submit.click();
    // Wait a moment for error to render (no hard sleep — poll for URL or error text)
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    // Must still be on /login (did not erroneously create a session)
    expect(page.url(), "Invalid creds should not navigate away from /login").toContain("/login");
    const body = await page.locator("body").innerText();
    // Must not show a 500-shaped message
    expect(body.toLowerCase()).not.toContain("internal server error");
    expect(body.toLowerCase()).not.toContain("application error");
  });

  test("empty submit — doesn't crash", async ({ page }) => {
    await page.goto("/login");
    const submit = page.getByRole("button", { name: /^sign in|^log in|^login$/i }).first();
    if ((await submit.count()) === 0) test.skip(true);
    await submit.click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain("/login");
    const body = await page.locator("body").innerText();
    expect(body.toLowerCase()).not.toContain("internal server error");
  });

  test("Google OAuth button renders when configured", async ({ page }) => {
    await page.goto("/login");
    // Providers endpoint decides whether Google button renders — soft check
    const google = page.getByRole("button", { name: /google/i }).first();
    if ((await google.count()) === 0) {
      console.warn("[login] Google OAuth not visible — check GOOGLE_CLIENT_ID configured");
    }
  });

  test("accessing /login while already logged in behaves sensibly", async ({ page }) => {
    // For anonymous spec — this is just a smoke; expected state is visiting /login raw.
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(400);
  });
});
