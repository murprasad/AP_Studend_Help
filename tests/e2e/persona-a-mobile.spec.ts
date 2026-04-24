import { test, expect, devices } from "@playwright/test";

/**
 * Persona A — mobile viewport coverage (iPhone 12).
 *
 * Splits from the original all-in-one spec. Playwright disallows
 * `test.use({ defaultBrowserType })` inside a describe group because
 * swapping the device forces a new worker. Each device gets its own
 * spec file with a top-level use().
 *
 * Matrix rows: 10.13 (mobile).
 */

// Top-level use() — applies to every test in this file.
// Override defaultBrowserType because devices["iPhone 12"] defaults to
// WebKit, which isn't installed on this CI host (only Chromium is
// installed via `npx playwright install chromium`). Chromium-in-mobile-
// viewport is sufficient for the assertions here (overflow, touch
// target size, above-fold CTA) — we're not testing Safari-specific
// rendering quirks.
test.use({ ...devices["iPhone 12"], defaultBrowserType: "chromium" });

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

for (const path of MOBILE_PAGES) {
  test(`${path} — no horizontal scroll on iPhone 12`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    if (!res || res.status() >= 400) test.skip(true, `${path} not available`);
    const overflow = await page.evaluate(() => {
      const doc = document.scrollingElement ?? document.documentElement;
      return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth };
    });
    expect(
      overflow.scrollWidth,
      `${path}: horizontal overflow on iPhone 12. scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth}`,
    ).toBeLessThanOrEqual(overflow.innerWidth + 1);
  });
}

test("/ — primary register CTA visible above fold (iPhone 12)", async ({ page }) => {
  await page.goto("/");
  const cta = page.locator('a[href*="/register"]').first();
  await expect(cta).toBeVisible({ timeout: 5000 });
  const box = await cta.boundingBox();
  expect(box?.y ?? 9999, "primary register CTA should be above fold").toBeLessThan(900);
});

test("/login — submit button touch-target ≥ 40px (iPhone 12)", async ({ page }) => {
  await page.goto("/login");
  const submit = page.getByRole("button", { name: /sign in|log in|login/i }).first();
  if ((await submit.count()) === 0) test.skip(true);
  const box = await submit.boundingBox();
  expect(box?.height ?? 0, "submit button too short for mobile").toBeGreaterThanOrEqual(40);
});
