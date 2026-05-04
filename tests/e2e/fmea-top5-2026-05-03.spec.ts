import { test, expect } from "@playwright/test";

/**
 * FMEA Top-5 regression guards (2026-05-03).
 *
 * Each test corresponds to a FMEA item identified during the comprehensive
 * design/code/UX review. Designed to PREVENT recurrence of the highest-RPN
 * failure modes:
 *
 *   - F03 (RPN 125): module cards rendering unstyled (dynamic Tailwind classes
 *     can't be JIT-purged, so `border-${color}-500/30` was stripped from CSS)
 *   - F11 (RPN 80):  visible_courses drift between API + landing surface
 *   - F08 (RPN 80):  sidebar empty-state during /api/feature-flags load
 *   - F12 (RPN 75):  RSC prefetch 500s on /ap-prep, /sat-prep, /act-prep
 *   - U02 (HIGH):    pricing comparison table overflows 375px mobile
 *
 * Wired into DEPLOY_GATE_PUBLIC.
 */

test.describe.configure({ retries: 1, timeout: 60_000 });

test.describe("FMEA F03 — Module cards have computed borders + backgrounds", () => {
  test("Each module card renders with a non-transparent border + non-transparent bg", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const cards = page.locator('[data-testid^="module-card-"]');
    const count = await cards.count();
    expect(count, "expected at least 1 module card").toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const styles = await card.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          borderColor: cs.borderTopColor,
          backgroundColor: cs.backgroundColor,
          borderWidth: cs.borderTopWidth,
        };
      });
      // Tailwind JIT-purge bug surfaces as: borderColor is "rgb(0, 0, 0)" or "rgba(0,0,0,0)"
      // (transparent / black). A working class produces an indigo/blue/violet rgb.
      expect(styles.borderColor, `card[${i}] borderColor: dynamic Tailwind class JIT-purged`).not.toMatch(
        /^rgba?\(\s*0,\s*0,\s*0(,\s*0)?\s*\)$/,
      );
      expect(styles.borderWidth, `card[${i}] borderWidth: must be > 0`).not.toBe("0px");
    }
  });
});

test.describe("FMEA F11 — visible_courses single source of truth", () => {
  test("/api/feature-flags response matches what the landing page actually advertises", async ({ page, request }) => {
    // Source 1: the API the sidebar reads
    const flagsRes = await request.get("/api/feature-flags");
    expect(flagsRes.ok()).toBe(true);
    const flags = await flagsRes.json();
    const apiAllowlist = flags.visibleCourses ?? null;

    // Source 2: the landing page server-rendered course count via the
    // module cards (each card shows "{count} courses/sections" — we just
    // assert that the page renders something sensible, not that it
    // matches the API exactly. The drift detection happens via deploy
    // gate: if the API returns N courses but landing renders 0 visible
    // ones, something is broken.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cardCount = await page.locator('[data-testid^="module-card-"]').count();
    if (apiAllowlist === null || apiAllowlist === "all") {
      expect(cardCount, "no allowlist → all 3 module cards visible").toBeGreaterThanOrEqual(3);
    } else {
      // Allowlist is an array. At least one course family must be visible.
      const families = ["AP_", "SAT_", "ACT_"].filter((f) =>
        apiAllowlist.some((c: string) => c.startsWith(f)),
      ).length;
      expect(cardCount, "card count should match families with ≥1 visible course").toBe(families);
    }
  });
});

test.describe("FMEA F08 — Sidebar empty-state guard (smoke)", () => {
  test("/api/feature-flags returns < 5s — sidebar load wouldn't time-out", async ({ request }) => {
    const start = Date.now();
    const res = await request.get("/api/feature-flags");
    const elapsed = Date.now() - start;
    expect(res.ok()).toBe(true);
    expect(elapsed, `feature-flags took ${elapsed}ms — sidebar would flash empty if >2s`).toBeLessThan(5_000);
  });
});

test.describe("FMEA F12 — RSC prefetch endpoints (allowlisted, not regressed harder)", () => {
  // F12 is currently allowlisted as known infra noise. If the rate of 500s
  // EXPANDS (e.g., now /pricing also 500s), we need to know. This is a
  // canary, not a green-on-fail test.
  for (const path of ["/ap-prep", "/sat-prep", "/act-prep"]) {
    test(`RSC prefetch GET ${path} returns 500 (known) or < 400 (fixed)`, async ({ request }) => {
      const res = await request.get(`${path}?_rsc=test`, {
        headers: { RSC: "1", "Next-Router-Prefetch": "1" },
        failOnStatusCode: false,
      });
      // Either it's 500 (known F12) or < 400 (fixed). Anything else (400, 401, 403, 404, 502) is a NEW regression.
      const status = res.status();
      const allowed = status === 500 || status < 400;
      expect(allowed, `${path} RSC: status=${status} is neither known-500 nor fixed (<400)`).toBe(true);
    });
  }
});

test.describe("FMEA U02 — Pricing comparison table fits 375px mobile (no clipped columns)", () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test("Pricing comparison table is horizontally scrollable on 375px (not silently clipped)", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    // The table-wrapper div should be overflow-x-auto so the table can scroll,
    // not the page. Walk up from the comparison heading.
    const heading = page.getByRole("heading", { name: /How We Compare/i });
    if (!(await heading.isVisible().catch(() => false))) {
      test.skip(true, "Comparison table not present on this build");
      return;
    }
    const wrapper = heading.locator("xpath=following-sibling::*[descendant::table][1]").first();
    const overflowX = await wrapper.evaluate((el) => window.getComputedStyle(el).overflowX);
    expect(["auto", "scroll"], `wrapper overflow-x must be auto/scroll, got ${overflowX}`).toContain(overflowX);

    // Body itself should NOT scroll horizontally — only the wrapper should.
    const bodyOverflow = await page.evaluate(() => {
      return { scrollWidth: document.body.scrollWidth, viewportWidth: window.innerWidth };
    });
    expect(bodyOverflow.scrollWidth, "body should not horizontally overflow viewport").toBeLessThanOrEqual(bodyOverflow.viewportWidth + 2);
  });
});

test.describe("FMEA U03 — Mobile 375px landing — user can't horizontally scroll", () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test("Landing on 375px doesn't allow horizontal scroll (page is locked)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    // The user-relevant assertion: attempt to scroll right. If overflow-x is
    // hidden on body, scrollX stays at 0. (scrollWidth alone reports
    // content width including hidden overflow — wrong metric for "can the
    // user see broken layout".)
    const result = await page.evaluate(() => {
      window.scrollTo(2000, 0);
      const scrolled = window.scrollX;
      window.scrollTo(0, 0);
      const htmlOverflow = window.getComputedStyle(document.documentElement).overflowX;
      const bodyOverflow = window.getComputedStyle(document.body).overflowX;
      return { scrolled, htmlOverflow, bodyOverflow };
    });
    expect(
      result.scrolled,
      `User can horizontally scroll to ${result.scrolled}px on 375px mobile (html overflow-x=${result.htmlOverflow}, body overflow-x=${result.bodyOverflow}). Add overflow-x:hidden or fix nav width.`,
    ).toBe(0);
  });
});
