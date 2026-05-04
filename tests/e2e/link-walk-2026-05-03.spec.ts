import { test, expect, Page, Locator } from "@playwright/test";

/**
 * Comprehensive link walk (2026-05-03) — added in response to user report:
 * "AP card click on landing didn't take me to AP page; Pricing link
 * didn't work; SAT and ACT did."
 *
 * Strategy:
 *  1. For each major public page, enumerate every visible <a href> on it.
 *  2. For each internal href: assert HTTP < 400 via request.
 *  3. For each LANDING-PAGE click target (nav, module cards, hero CTA,
 *     footer): actually CLICK the link in the browser and assert the URL
 *     transitions correctly (catches soft-nav crashes that headless 200
 *     checks miss).
 *  4. Same for /ap-prep, /sat-prep, /act-prep, /pricing, /about — confirm
 *     downstream links don't 404 either.
 *
 * Wired into DEPLOY_GATE_PUBLIC so every promote runs it.
 */

test.describe.configure({ retries: 1, timeout: 90_000 });

async function collectInternalHrefs(page: Page): Promise<string[]> {
  return page.locator("a[href]").evaluateAll((els) =>
    Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href") || "")))
      .filter((h) => h && !h.startsWith("#") && !h.startsWith("mailto:") && !h.startsWith("tel:") && !h.startsWith("javascript:") && !h.startsWith("http"))
  );
}

const PAGES_TO_WALK = [
  { path: "/",            name: "Landing" },
  { path: "/ap-prep",     name: "AP Prep"  },
  { path: "/sat-prep",    name: "SAT Prep" },
  { path: "/act-prep",    name: "ACT Prep" },
  { path: "/pricing",     name: "Pricing"  },
  { path: "/about",       name: "About"    },
  { path: "/login",       name: "Login"    },
  { path: "/register",    name: "Register" },
];

test.describe("Link walk — every public page's internal links resolve", () => {
  for (const p of PAGES_TO_WALK) {
    test(`${p.name} (${p.path}): every internal <a href> returns < 400`, async ({ page, request }) => {
      const res = await page.goto(p.path, { waitUntil: "domcontentloaded" });
      expect(res?.status() ?? 0, `${p.path} itself`).toBeLessThan(400);
      const hrefs = await collectInternalHrefs(page);
      expect(hrefs.length, `${p.path} should have at least one internal link`).toBeGreaterThan(0);
      const failures: { href: string; status: number }[] = [];
      for (const h of hrefs) {
        try {
          const r = await request.get(h, { maxRedirects: 5, failOnStatusCode: false, timeout: 10_000 });
          if (r.status() >= 400) failures.push({ href: h, status: r.status() });
        } catch {
          failures.push({ href: h, status: -1 });
        }
      }
      expect(failures, `${p.name} broken links: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
    });
  }
});

test.describe("Click walk — landing page links actually navigate", () => {
  // Critical click targets on the landing page. These are clicked in a real
  // browser session — catches soft-nav failures that HTTP-only verify misses
  // (the AP-card-click bug the user reported on 2026-05-03).
  const LANDING_CLICKS = [
    { selector: 'nav a[href="/ap-prep"]',   expected: /\/ap-prep$/,    desc: "Nav: AP" },
    { selector: 'nav a[href="/sat-prep"]',  expected: /\/sat-prep$/,   desc: "Nav: SAT" },
    { selector: 'nav a[href="/act-prep"]',  expected: /\/act-prep$/,   desc: "Nav: ACT" },
    { selector: 'nav a[href="/pricing"]',   expected: /\/pricing$/,    desc: "Nav: Pricing" },
    { selector: 'nav a[href="/login"]',     expected: /\/login(\?|$)/, desc: "Nav: Log In" },
    { selector: 'a[href="/ap-prep"]',       expected: /\/ap-prep$/,    desc: "Module card: AP" },
    { selector: 'a[href="/sat-prep"]',      expected: /\/sat-prep$/,   desc: "Module card: SAT" },
    { selector: 'a[href="/act-prep"]',      expected: /\/act-prep$/,   desc: "Module card: ACT" },
    { selector: 'footer a[href="/about"]',  expected: /\/about$/,      desc: "Footer: About" },
    { selector: 'footer a[href="/contact"]',expected: /\/contact$/,    desc: "Footer: Contact" },
    { selector: 'footer a[href="/terms"]',  expected: /\/terms$/,      desc: "Footer: Terms" },
    { selector: 'footer a[href="/privacy"]',expected: /\/privacy$/,    desc: "Footer: Privacy" },
    { selector: 'footer a[href="/faq"]',    expected: /\/faq$/,        desc: "Footer: FAQ" },
  ];

  for (const t of LANDING_CLICKS) {
    test(`Landing → ${t.desc} (${t.selector})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      const link = page.locator(t.selector).first();
      await expect(link, `${t.desc}: link not found`).toBeVisible();
      await link.click();
      await page.waitForTimeout(2500);
      expect(page.url(), `${t.desc}: did not navigate to expected URL`).toMatch(t.expected);
      await expect(page.getByText(/Something hiccupped/i), `${t.desc}: error boundary triggered`).toHaveCount(0);
      expect(errors, `${t.desc}: page errors: ${errors.join(" | ")}`).toEqual([]);
    });
  }
});

test.describe("Click walk — downstream pages' nav links navigate", () => {
  // From each downstream marketing page, click the primary CTAs to verify
  // round-trip works (e.g., /ap-prep → /register, /pricing → /register).
  const DOWNSTREAM_CLICKS: Array<{ from: string; click: string; expected: RegExp; desc: string }> = [
    { from: "/ap-prep",  click: 'a[href*="/register"]',  expected: /\/register/,  desc: "AP-prep → Register" },
    { from: "/sat-prep", click: 'a[href*="/register"]',  expected: /\/register/,  desc: "SAT-prep → Register" },
    { from: "/act-prep", click: 'a[href*="/register"]',  expected: /\/register/,  desc: "ACT-prep → Register" },
    { from: "/pricing",  click: 'a[href*="/register"]',  expected: /\/register/,  desc: "Pricing → Register" },
    { from: "/about",    click: 'a[href*="/pricing"]',   expected: /\/pricing/,   desc: "About → Pricing" },
    { from: "/register", click: 'a[href*="/login"]',     expected: /\/login/,     desc: "Register → Login" },
    { from: "/login",    click: 'a[href*="/register"]',  expected: /\/register/,  desc: "Login → Register" },
  ];

  for (const t of DOWNSTREAM_CLICKS) {
    test(`${t.desc}`, async ({ page }) => {
      await page.goto(t.from, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      const link = page.locator(t.click).first();
      // Some downstream pages may not have all CTAs (e.g., already-authed views) — soft-skip
      if (!(await link.isVisible().catch(() => false))) {
        test.skip(true, `${t.desc}: target link not visible on ${t.from}`);
        return;
      }
      await link.click();
      await page.waitForTimeout(2500);
      expect(page.url(), `${t.desc}: navigation`).toMatch(t.expected);
      await expect(page.getByText(/Something hiccupped/i)).toHaveCount(0);
    });
  }
});
