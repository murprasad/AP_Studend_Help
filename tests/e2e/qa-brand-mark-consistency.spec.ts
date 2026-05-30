/**
 * QA — SN brand mark must be consistent across public pages
 *
 * SN brand: Sparkles icon + "Student"+"Nest" wordmark with .gradient-text.
 *
 * Run: E2E_BASE_URL=https://studentnest.ai npx playwright test tests/qa-brand-mark-consistency.spec.ts --reporter=list
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";

const BRAND_PAGES = [
  "/",
  "/pricing",
  "/contact",
  "/about",
  "/ap-prep",
  "/sat-prep",
  "/act-prep",
  "/am-i-ready",
  "/faq",
  "/login",
  "/register",
];

for (const path of BRAND_PAGES) {
  test(`brand: ${path} uses Sparkles + gradient-text "Student" + "Nest"`, async ({ page }) => {
    test.setTimeout(30_000);
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    expect(resp?.status(), `${path} should not 404`).toBeLessThan(400);

    const html = await page.content();

    expect(html, `${path} missing Lucide Sparkles icon`).toMatch(/lucide-sparkles/);
    expect(html, `${path} missing canonical .gradient-text class`).toMatch(/gradient-text/);
    expect(html, `${path} missing StudentNest wordmark`).toMatch(/StudentNest|Student<\/span><span[^>]*>Nest/);

    // No PrepLion-brand leak (Crown icon, "PrepLion" wordmark)
    expect(html, `${path} has Crown icon — wrong product brand`).not.toMatch(/lucide-crown/);
    expect(html, `${path} has PrepLion wordmark — wrong product`).not.toMatch(/PrepLion/);
  });
}
