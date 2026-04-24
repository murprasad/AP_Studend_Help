import { test, expect } from "@playwright/test";

/**
 * Persona A — secondary auth surfaces: forgot-password, reset-password, verify-email.
 *
 * These are low-traffic but high-damage routes — if they 500 or show stack
 * traces, users locked out of their accounts can't recover.
 *
 * Matrix rows 10.2 #14–18.
 */

test.describe.configure({ retries: 1, timeout: 30_000 });

test.describe("/forgot-password", () => {
  test("loads and shows email field", async ({ page }) => {
    const res = await page.goto("/forgot-password");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    const submit = page.getByRole("button", { name: /send|reset|email/i }).first();
    await expect(submit).toBeVisible();
  });

  test("has link back to /login", async ({ page }) => {
    await page.goto("/forgot-password");
    const back = page.locator('a[href="/login"], a[href*="/login"]').first();
    await expect(back).toBeVisible();
  });

  test("submitting an unregistered email does not disclose user existence", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.locator('input[type="email"]').first().fill("never-registered-987@example.invalid");
    await page.getByRole("button", { name: /send|reset|email/i }).first().click();
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const body = (await page.locator("body").innerText()).toLowerCase();
    // Security: confirming "we sent you an email" is fine; specifically
    // saying "no such user" discloses account-existence (OWASP).
    expect(body).not.toMatch(/user (?:does not exist|not found|unknown)/);
  });
});

test.describe("/reset-password (no token)", () => {
  test("loads and shows helpful fallback (not a stack trace)", async ({ page }) => {
    const res = await page.goto("/reset-password");
    if (!res) return;
    // Accept 200 with a "request new link" fallback OR a redirect to /forgot-password
    expect(res.status()).toBeLessThan(500);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("application error");
    expect(body).not.toContain("internal server error");
  });
});

test.describe("/verify-email (no token)", () => {
  test("loads and shows helpful fallback", async ({ page }) => {
    const res = await page.goto("/verify-email");
    if (!res) return;
    expect(res.status()).toBeLessThan(500);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("application error");
    expect(body).not.toContain("internal server error");
  });
});
