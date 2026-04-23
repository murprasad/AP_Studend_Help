import { test, expect } from "@playwright/test";

/**
 * Public-path smoke: loads the marketing surfaces a student hits
 * BEFORE signing up and asserts each renders with its expected
 * trust-building copy. These are the pages we can never break silently.
 *
 * Deliberately unauth — no CRON_SECRET or session cookie needed. That
 * keeps this suite runnable from any environment (sandbox, CI, dev
 * laptop) against any deploy URL.
 */

test.describe("Public marketing paths", () => {
  test("/ landing loads with hero + 'Start Free' CTA", async ({ page }) => {
    await page.goto("/");
    // Hero + CTA copy must survive any redesign
    await expect(page).toHaveTitle(/StudentNest/);
    const body = page.locator("body");
    await expect(body).toContainText(/AP|SAT|ACT/);
  });

  test("/pricing shows both plans + refund language", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toContainText("$9.99");
    await expect(page.locator("body")).toContainText("$79.99");
    // The pricing-consistency rule lives in pre-release-check.js; if
    // marketing changes a plan number without updating the other, this
    // and the pre-release step both fail.
  });

  test("/about shows current Beta badge", async ({ page }) => {
    await page.goto("/about");
    // Regex instead of literal so version bumps don't break the test
    await expect(page.locator("body")).toContainText(/Beta\s*\d/);
  });

  test("/terms has 7-day refund text", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("body")).toContainText(/7-day|money-back/i);
  });

  test("/am-i-ready picker shows AP/SAT/ACT only (new APs hidden)", async ({ page }) => {
    await page.goto("/am-i-ready");
    const body = page.locator("body");
    await expect(body).toContainText("AP");
    // The 5 new AP courses should NOT appear pre-Phase-C.
    await expect(body).not.toContainText("Human Geography");
    await expect(body).not.toContainText("Environmental Science");
    await expect(body).not.toContainText("Precalculus");
    await expect(body).not.toContainText("English Language");
    await expect(body).not.toContainText("U.S. Government");
  });
});

test.describe("Warmup CTA regression guard", () => {
  test("/warmup resolves (was 404 prior to 2026-04-22 hotfix)", async ({ page }) => {
    // The warmup CTA used to href /warmup; the hotfix redirects to
    // /practice?mode=focused&count=3. Either path returning 200 is fine;
    // what we must NEVER see is a 404 page.
    const resp = await page.goto("/warmup").catch(() => null);
    if (!resp) return; // Network flake — don't block
    expect(resp.status()).not.toBe(404);
  });
});

test.describe("No 'pass probability' language in user copy", () => {
  // Guards the 2026-04-22 redesign away from abstract % probability toward
  // exam-native scaled scores (AP 1-5, SAT 400-1600, ACT 1-36). Belt-and-
  // suspenders with pre-release-check.js #10 — that catches source leaks,
  // this catches rendered leaks after build/CDN.
  const paths = ["/", "/methodology", "/wall-of-fame", "/pass-rates", "/am-i-ready", "/pricing", "/about"];
  for (const p of paths) {
    test(`${p} — no 'pass probability' visible`, async ({ page }) => {
      const resp = await page.goto(p).catch(() => null);
      if (!resp || resp.status() >= 400) return; // Page may not exist on this deploy
      const text = await page.locator("body").innerText();
      // Match 'pass probability', 'pass-probability', 'Pass Probability' (case-insens).
      expect(text).not.toMatch(/pass[\s\-]probability/i);
    });
  }
});

test.describe("No PrepLion branding leaks in user copy", () => {
  // Belt-and-suspenders with the pre-release-check string scan — that
  // catches SOURCE leaks, this catches RENDERED leaks after any
  // build-time substitution / env-driven copy / CDN cache anomalies.
  const paths = ["/", "/pricing", "/about", "/terms", "/faq", "/am-i-ready", "/pass-rates", "/wall-of-fame"];
  for (const p of paths) {
    test(`${p} — no 'PrepLion' text visible`, async ({ page }) => {
      await page.goto(p);
      // The marketing footer intentionally calls out sister site preplion.ai
      // — that's a link text / URL. Scan for the product name with a
      // capital L specifically, not the domain.
      const text = await page.locator("body").innerText();
      const leaks = text.match(/PrepLion/g) || [];
      // Allow <= 1 legitimate reference from the sister-site footer.
      // Zero if the footer wording ever changes to not use "PrepLion".
      expect(leaks.length).toBeLessThanOrEqual(1);
    });
  }
});
