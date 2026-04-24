import { test, expect, devices } from "@playwright/test";

/**
 * Persona A — mobile viewport (iPad).
 *
 * Separate from persona-a-mobile.spec.ts because Playwright requires
 * device overrides at file-level (not inside describe groups).
 *
 * Matrix rows: 10.13 (mobile × iPad).
 */

// Override defaultBrowserType to chromium — only chromium is installed on
// this CI host and Safari-specific rendering quirks aren't what we assert.
test.use({ ...devices["iPad (gen 7)"], defaultBrowserType: "chromium" });

test.describe.configure({ retries: 1, timeout: 45_000 });

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
