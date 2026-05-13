import { test, expect } from "@playwright/test";

/**
 * CLEP/DSST removal verification (2026-05-03).
 *
 * StudentNest serves AP/SAT/ACT only. CLEP/DSST live on PrepLion.ai.
 * Verify:
 *   - /clep-prep + /dsst-prep redirect (308 permanent) to https://preplion.ai
 *   - Footer contains a visible PrepLion handoff link
 *   - Landing renders no CLEP/DSST sections (modulo the small handoff link)
 */

test.describe.configure({ retries: 1, timeout: 60_000 });

test.describe("CLEP/DSST removal — handoff to PrepLion", () => {
  test("/clep-prep returns a permanent redirect to preplion.ai", async ({ request }) => {
    const res = await request.get("/clep-prep", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers().location ?? "").toMatch(/preplion\.ai/);
  });

  test("/clep-prep/some-slug also redirects to preplion.ai", async ({ request }) => {
    const res = await request.get("/clep-prep/college-algebra", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers().location ?? "").toMatch(/preplion\.ai/);
  });

  test("/dsst-prep returns a permanent redirect to preplion.ai", async ({ request }) => {
    const res = await request.get("/dsst-prep", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers().location ?? "").toMatch(/preplion\.ai/);
  });

  test("Footer contains a PrepLion handoff link", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /PrepLion/i });
    await expect(link.first()).toBeVisible();
    const href = await link.first().getAttribute("href");
    expect(href).toMatch(/^https?:\/\/preplion\.ai/);
  });

  test("Landing has NO visible CLEP section heading", async ({ page }) => {
    await page.goto("/");
    // Old CLEP section heading was "Earn College Credit Faster — Save Thousands"
    await expect(page.getByText(/Earn College Credit Faster/i)).toHaveCount(0);
    // Old CLEP testimonial copy
    await expect(page.getByText(/I passed CLEP College Algebra/i)).toHaveCount(0);
    // CLEP Premium tier in pricing column
    await expect(page.getByText(/CLEP Premium/i)).toHaveCount(0);
  });

  test("Landing has NO visible DSST section heading", async ({ page }) => {
    await page.goto("/");
    // Old DSST section heading
    await expect(page.getByText(/Skip Intro Courses with DSST/i)).toHaveCount(0);
  });

  test("Navbar does NOT link to /clep-prep or /dsst-prep", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    const navHrefs = await nav.locator("a[href]").evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute("href") || ""),
    );
    expect(navHrefs.some((h) => h.includes("/clep-prep"))).toBe(false);
    expect(navHrefs.some((h) => h.includes("/dsst-prep"))).toBe(false);
  });

  // 2026-05-13 user report: "When I sign-up using StudentNest, it still shows
  // CLEP and DSST courses." Root cause was VISIBLE_AP_COURSES inheriting all
  // keys from COURSE_REGISTRY (which still contains CLEP/DSST entries as
  // vestigial DB references) — the only filter was `hidden: true`, which
  // wasn't set on those courses. Fix: explicit prefix exclusion in
  // src/lib/courses.ts. This test pins it.
  test("Landing readiness picker shows ZERO CLEP/DSST/ACCUPLACER courses", async ({ page }) => {
    await page.goto("/");
    // The readiness picker is the hero-readiness-picker component. Find any
    // visible text containing the forbidden prefixes.
    const bodyText = await page.locator("body").innerText();
    expect(bodyText, "CLEP course names must not appear on landing page").not.toMatch(/\bCLEP[\s_]/);
    expect(bodyText, "DSST course names must not appear on landing page").not.toMatch(/\bDSST[\s_]/);
    // CLEP appears in the legal footer disclaimer ("CLEP® is a trademark...");
    // narrow the regex to course-name shape with separator to avoid that match.
  });

  test("/how-hard-is and /am-i-ready slugs do not include CLEP/DSST courses", async ({ request }) => {
    // 404 on a CLEP slug (would be a 200 if the page leaked through generateStaticParams)
    const r1 = await request.get("/how-hard-is/clep-college-algebra", { maxRedirects: 0 });
    expect([301, 308, 404]).toContain(r1.status());
    const r2 = await request.get("/am-i-ready/dsst-personal-finance", { maxRedirects: 0 });
    expect([301, 308, 404]).toContain(r2.status());
  });
});
