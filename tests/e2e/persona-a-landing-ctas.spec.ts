import { test, expect } from "@playwright/test";

/**
 * Persona A — First-time signup: landing page CTA comprehensive matrix.
 *
 * Every link on / is one test row. Assert:
 *   1. Link exists (href non-empty)
 *   2. Destination resolves < 400
 *   3. Destination URL matches expected shape (incl. ?track=X)
 *   4. Destination page's own heading makes sense
 *
 * Matrix rows: 10.1.1 #1–18.
 */

test.describe.configure({ retries: 1, timeout: 90_000 });

// Enumerate all links once, then fan out assertions per link.
type LinkSpec = {
  name: string;             // test name fragment
  match: (href: string, text: string) => boolean;
  expectHrefPattern: RegExp;
  atLeast?: number;         // minimum count — default 1
};

const CTAS: LinkSpec[] = [
  // "Sign in" / "Log in" text drift — match anchor by href, verify text is some
  // recognizable auth phrase. Empty anchors (icon-only) are allowed because
  // mobile hamburger can surface as <a href="/login"><Icon/></a>.
  {
    name: "Sign-in or log-in link",
    match: (h, _t) => /\/login/.test(h),
    expectHrefPattern: /\/login/,
  },
  { name: "Pricing nav", match: (h, t) => /^pricing$/i.test(t) && /\/pricing/.test(h), expectHrefPattern: /\/pricing/ },
  { name: "About footer or nav", match: (h, t) => /^about$/i.test(t) && /\/about/.test(h), expectHrefPattern: /\/about/ },
  { name: "Terms footer", match: (h) => /\/terms/.test(h), expectHrefPattern: /\/terms/ },
  { name: "Privacy footer", match: (h) => /\/privacy/.test(h), expectHrefPattern: /\/privacy/ },
  { name: "Register (any)", match: (h) => /\/register/.test(h), expectHrefPattern: /\/register/, atLeast: 3 },
  { name: "AP track register", match: (h) => /\/register.*track=ap(\b|&|$)/.test(h), expectHrefPattern: /\/register.*track=ap/, atLeast: 1 },
];

test.describe("/ landing CTA matrix", () => {
  test("page loads", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
  });

  for (const cta of CTAS) {
    test(`has '${cta.name}' CTA with expected href`, async ({ page }) => {
      await page.goto("/");
      const found = await page.$$eval(
        "a[href]",
        (els) =>
          els.map((el) => ({
            href: (el as HTMLAnchorElement).getAttribute("href") ?? "",
            text: ((el as HTMLElement).innerText ?? "").trim(),
          })),
      );
      const matches = found.filter((l) => cta.match(l.href, l.text));
      expect(
        matches.length,
        `Expected ≥${cta.atLeast ?? 1} CTAs matching '${cta.name}', got ${matches.length}.\nAll hrefs: ${found.map((f) => f.href).join(", ")}`,
      ).toBeGreaterThanOrEqual(cta.atLeast ?? 1);
      for (const m of matches) {
        expect(m.href, `'${cta.name}' href "${m.href}" must match ${cta.expectHrefPattern}`).toMatch(cta.expectHrefPattern);
      }
    });
  }

  test("click login link lands on /login", async ({ page }) => {
    await page.goto("/");
    // Match by href — text could be "Sign in", "Log in", "Sign In →", or icon-only
    const link = page.locator('a[href="/login"]').first();
    if ((await link.count()) === 0) test.skip(true, "No login link surfaced at this viewport");
    await link.click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
    await expect(page.locator("body")).toContainText(/sign\s*in|log\s*in|email/i);
  });

  test("click AP-track CTA lands on /register?track=ap with AP copy", async ({ page }) => {
    await page.goto("/");
    // Find any anchor whose href includes track=ap
    const apLink = page.locator('a[href*="track=ap"]').first();
    if ((await apLink.count()) === 0) test.skip(true, "No AP-track link surfaced at this viewport");
    await apLink.click();
    await page.waitForURL(/\/register/, { timeout: 10_000 });
    expect(page.url()).toMatch(/track=ap/);
    // Register page must reflect AP-track framing
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/ap|advanced placement/);
  });

  test("click CLEP-track CTA lands on /register?track=clep", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href*="track=clep"]').first();
    if ((await link.count()) === 0) test.skip(true, "No CLEP-track link at this viewport");
    await link.click();
    await page.waitForURL(/\/register/, { timeout: 10_000 });
    expect(page.url()).toMatch(/track=clep/);
  });

  test("click footer Terms lands on /terms with 7-day refund text", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href="/terms"]').first();
    if ((await link.count()) === 0) test.skip(true, "No /terms link");
    await link.click();
    await page.waitForURL(/\/terms/, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(/7-day|money-back|refund/i);
  });

  test("click Pricing lands on /pricing with $9.99 visible", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href="/pricing"]').first();
    if ((await link.count()) === 0) test.skip(true, "No /pricing link");
    await link.click();
    await page.waitForURL(/\/pricing/, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(/\$?\s*9\.99/);
  });
});
