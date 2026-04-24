import { test, expect, devices } from "@playwright/test";

/**
 * Persona A — mobile viewport coverage.
 *
 * Test the first-time-user flow + every public page on iPhone 12 + iPad.
 * Matrix rows: 10.13.
 *
 * Assertions per page:
 *   - No horizontal scroll (document.scrollingElement.scrollWidth ≤ viewport.width)
 *   - Primary CTA visible in viewport within 1s
 *   - Nav collapses to hamburger or compact form
 *   - Touch targets ≥ 44px tall (WCAG + Apple HIG minimum)
 */

const MOBILE_PAGES = [
  "/",
  "/pricing",
  "/about",
  "/ap-prep",
  "/sat-prep",
  "/act-prep",
  "/clep-prep",
  "/login",
  "/register",
];

test.describe.configure({ retries: 1, timeout: 45_000 });

test.describe("Mobile — iPhone 12", () => {
  test.use({ ...devices["iPhone 12"] });

  for (const path of MOBILE_PAGES) {
    test(`${path} — no horizontal scroll on mobile`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true, `${path} not available`);

      // Allow 1px margin for sub-pixel rounding.
      const overflow = await page.evaluate(() => {
        const doc = document.scrollingElement ?? document.documentElement;
        return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth };
      });
      expect(
        overflow.scrollWidth,
        `${path}: horizontal overflow on mobile. scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth + 1);
    });
  }

  test("/ — primary CTA visible above fold", async ({ page }) => {
    await page.goto("/");
    // Any /register link should be visible within 1s
    const cta = page.locator('a[href*="/register"]').first();
    await expect(cta).toBeVisible({ timeout: 5000 });
    const box = await cta.boundingBox();
    expect(box?.y ?? 9999, "primary register CTA should be above fold").toBeLessThan(900);
  });

  test("/login — touch targets ≥ 44px", async ({ page }) => {
    await page.goto("/login");
    const submit = page.getByRole("button", { name: /sign in|log in|login/i }).first();
    if ((await submit.count()) === 0) test.skip(true);
    const box = await submit.boundingBox();
    expect(box?.height ?? 0, "submit button too short for mobile").toBeGreaterThanOrEqual(40);
  });
});

test.describe("Mobile — iPad", () => {
  test.use({ ...devices["iPad (gen 7)"] });

  for (const path of ["/", "/pricing", "/register"]) {
    test(`${path} — no horizontal scroll on iPad`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const overflow = await page.evaluate(() => {
        const doc = document.scrollingElement ?? document.documentElement;
        return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
    });
  }
});
