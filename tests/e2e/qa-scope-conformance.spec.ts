/**
 * QA — SN scope conformance across public pages
 *
 * SN supports AP / SAT / ACT / PSAT only. Any leak of PL exam families
 * (CLEP_*, DSST_*, ACCUPLACER) or links to PL hubs is a scope violation.
 *
 * Run: E2E_BASE_URL=https://studentnest.ai npx playwright test tests/qa-scope-conformance.spec.ts --reporter=list
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";

const PUBLIC_PAGES = [
  "/",
  "/pricing",
  "/contact",
  "/about",
  "/ap-prep",
  "/sat-prep",
  "/act-prep",
  "/psat-prep",
  "/am-i-ready",
  "/faq",
];

for (const path of PUBLIC_PAGES) {
  test(`scope: ${path} surfaces no CLEP / DSST / Accuplacer leaks`, async ({ page }) => {
    test.setTimeout(30_000);
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    expect(resp?.status(), `${path} should not 404`).toBeLessThan(400);

    const html = await page.content();

    // No internal nav linking to PL marketing hubs
    expect(html, `${path} has /clep-prep link — wrong product`).not.toMatch(/href=["']\/clep-prep["']/);
    expect(html, `${path} has /dsst-prep link — wrong product`).not.toMatch(/href=["']\/dsst-prep["']/);
    expect(html, `${path} has /accuplacer-prep link — wrong product`).not.toMatch(/href=["']\/accuplacer-prep["']/);

    // No PL exam family enum strings rendered in DOM
    expect(html, `${path} renders CLEP_* enum string in DOM`).not.toMatch(/[>"]CLEP_[A-Z]/);
    expect(html, `${path} renders DSST_* enum string in DOM`).not.toMatch(/[>"]DSST_[A-Z]/);
    expect(html, `${path} renders ACCUPLACER enum string in DOM`).not.toMatch(/[>"]ACCUPLACER[<"]/);
  });
}
