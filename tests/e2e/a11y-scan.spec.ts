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
          // Per-target detail (added 2026-04-25) — without this we just
          // know the rule name, not which element to fix. Limit to 5
          // per rule to keep the log readable.
          for (const node of v.nodes.slice(0, 5)) {
            const target = node.target.join(", ");
            const summary = node.failureSummary?.replace(/\n/g, " | ").slice(0, 200) ?? "";
            console.log(`    target: ${target}`);
            if (summary) console.log(`           ${summary}`);
          }
          if (v.nodes.length > 5) console.log(`    (+${v.nodes.length - 5} more elements)`);
        }
      }
      expect(blocking).toHaveLength(0);
    });
  }
});

test.describe("Accessibility — authed pages", () => {
  for (const path of PAGES_AUTHED) {
    test(`${path} has no serious or critical a11y violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Authed pages have active polling (dashboard, billing) — networkidle
      // never settles. Give the DOM 2s to hydrate then scan whatever is
      // present. Axe only analyzes rendered DOM, so this is sufficient.
      await page.waitForTimeout(2000);
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
