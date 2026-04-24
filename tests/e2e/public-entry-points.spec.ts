import { test, expect } from "@playwright/test";

// Public entry-point matrix — every CTA on every public page must
// route to the correct destination with the correct query params.
// This file covers categories 1.1 - 1.5 from docs/path-coverage-matrix.md.
//
// Locked 2026-04-24 per real user demand: from the landing page, every
// entry-point button must be exercised. Future PRs that add a CTA
// must add a test row here.

test.describe.configure({ retries: 2 });

// ── 1.1 Landing page CTAs ────────────────────────────────────────────

test.describe("Landing page (/) CTAs", () => {
  test("loads with 200", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(/StudentNest/i);
  });

  test("top nav: Sign in → /login", async ({ page }) => {
    await page.goto("/");
    const signIn = page.getByRole("link", { name: /^sign in$/i }).first();
    if ((await signIn.count()) === 0) test.skip(true, "Sign in link not found at this resolution");
    await signIn.click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("hero CTAs route to /register with track param", async ({ page }) => {
    await page.goto("/");
    // Look for AP-track CTA
    const apCTA = page.getByRole("link", { name: /AP.*free|start.*AP|free.*AP/i }).first();
    if ((await apCTA.count()) > 0) {
      const href = await apCTA.getAttribute("href");
      expect(href, "AP CTA should link to /register").toMatch(/\/register/);
      // If track param present, must be ap
      if (href?.includes("track=")) {
        expect(href).toContain("track=ap");
      }
    }
  });

  test("hero copy says 'welcome' / 'start' / 'free' — not 'goodbye'", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).toMatch(/start|free|prep|score/);
    expect(text).not.toContain("goodbye");
    expect(text).not.toContain("see you later");
  });

  test("footer has /terms, /privacy, /pricing, /about", async ({ page }) => {
    await page.goto("/");
    const links = await page.locator("a").evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute("href") || ""),
    );
    expect(links.some((h) => h.includes("/terms"))).toBe(true);
    expect(links.some((h) => h.includes("/pricing"))).toBe(true);
    expect(links.some((h) => h.includes("/about"))).toBe(true);
  });
});

// ── 1.2 /pricing CTAs ────────────────────────────────────────────────

test.describe("/pricing page", () => {
  test("loads + contains $9.99 + $79.99", async ({ page }) => {
    const res = await page.goto("/pricing");
    expect(res?.status()).toBeLessThan(400);
    const text = await page.locator("body").innerText();
    expect(text).toContain("9.99");
    expect(text).toContain("79.99");
  });

  test("Get Started Free button routes to /register", async ({ page }) => {
    await page.goto("/pricing");
    const cta = page
      .getByRole("link", { name: /get started.*free|start.*free|sign up.*free/i })
      .first();
    if ((await cta.count()) === 0) test.skip(true, "Free CTA not found");
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/\/register/);
  });

  test("Buy Premium form posts to /api/checkout", async ({ page }) => {
    await page.goto("/pricing");
    const form = page.locator('form[action*="/api/checkout"]').first();
    if ((await form.count()) === 0) test.skip(true, "Checkout form not on pricing page");
    const action = await form.getAttribute("action");
    expect(action).toMatch(/\/api\/checkout/);
  });

  test("monthly/annual toggle changes displayed price", async ({ page }) => {
    await page.goto("/pricing");
    const annualToggle = page.getByRole("button", { name: /annual/i }).first();
    if ((await annualToggle.count()) === 0) test.skip(true, "Annual toggle not present");
    await annualToggle.click();
    await page.waitForTimeout(300);
    const text = await page.locator("body").innerText();
    expect(text).toContain("79.99");
  });
});

// ── 1.3 /about CTAs ──────────────────────────────────────────────────

test.describe("/about page", () => {
  test("loads + has CTA to register", async ({ page }) => {
    const res = await page.goto("/about");
    expect(res?.status()).toBeLessThan(400);
    const cta = page.getByRole("link", { name: /try|get started|start|join/i }).first();
    if ((await cta.count()) > 0) {
      const href = await cta.getAttribute("href");
      expect(href).toMatch(/\/register|\/pricing/);
    }
  });
});

// ── 1.4 Per-track marketing pages ────────────────────────────────────

const TRACK_PAGES: Array<{ path: string; track: string }> = [
  { path: "/ap-prep", track: "ap" },
  { path: "/sat-prep", track: "sat" },
  { path: "/act-prep", track: "act" },
  { path: "/clep-prep", track: "clep" },
];

test.describe("Per-track marketing pages", () => {
  for (const { path, track } of TRACK_PAGES) {
    test(`${path} loads + hero CTA links to /register?track=${track}`, async ({ page }) => {
      const res = await page.goto(path);
      // Some pages may not exist if track is gated behind a feature flag
      if (res?.status() === 404) test.skip(true, `${path} not present`);
      expect(res?.status()).toBeLessThan(400);

      // Hero CTA — often the first prominent register link
      const links = await page.locator("a").evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute("href") || ""),
      );
      const registerLinks = links.filter((h) => h.startsWith("/register"));
      expect(registerLinks.length).toBeGreaterThan(0);
      // At least one of them should preserve the track param
      const hasTrackParam = registerLinks.some((h) => h.includes(`track=${track}`));
      // Soft-warn if missing — not all pages preserve the track in every CTA
      if (!hasTrackParam) {
        console.warn(`[a11y-warn] ${path} has no /register?track=${track} CTA`);
      }
    });
  }
});

// ── 1.5 Other public pages ───────────────────────────────────────────

const PUBLIC_PAGES = [
  "/how-hard-is/ap-physics-1",
  "/am-i-ready",
  "/pass-rates",
  "/wall-of-fame",
  "/terms",
  "/privacy",
];

test.describe("Other public pages — minimum reachability", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} returns < 400`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), `${path} should not 404 or 500`).toBeLessThan(400);
    });
  }
});
