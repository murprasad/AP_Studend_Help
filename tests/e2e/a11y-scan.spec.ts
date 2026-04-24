import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// WCAG 2.1 AA accessibility scan on every public + critical authed page.
// Prevents the kind of regressions that would tank SEO + invite ADA
// litigation. We assert ZERO serious or critical violations; minor and
// moderate are reported but not blocking.

const PAGES_PUBLIC = [
  "/",
  "/pricing",
  "/about",
  "/login",
  "/register",
];

const PAGES_AUTHED = [
  "/dashboard",
  "/practice",
  "/billing",
  "/frq-practice",
  "/analytics",
];

test.describe("Accessibility — public pages", () => {
  for (const path of PAGES_PUBLIC) {
    test(`${path} has no serious or critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      if (blocking.length > 0) {
        console.log(`A11y violations on ${path}:`);
        for (const v of blocking) {
          console.log(`  [${v.impact}] ${v.id} — ${v.description}`);
          console.log(`    Help: ${v.helpUrl}`);
        }
      }
      expect(blocking).toHaveLength(0);
    });
  }
});

test.describe("Accessibility — authed pages", () => {
  for (const path of PAGES_AUTHED) {
    test(`${path} has no serious or critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      if (blocking.length > 0) {
        console.log(`A11y violations on ${path}:`);
        for (const v of blocking) {
          console.log(`  [${v.impact}] ${v.id} — ${v.description}`);
        }
      }
      expect(blocking).toHaveLength(0);
    });
  }
});
