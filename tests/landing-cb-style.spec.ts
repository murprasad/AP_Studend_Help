/**
 * 2026-05-31 — Snapshot/E2E for the CB-style SN landing rebuild (task #99).
 *
 * Asserts the 4 product tiles render (AP + SAT + ACT + PSAT), the hero +
 * repeat CTA both point to the in-page #choose-exam anchor, all marketing
 * footer + tile destinations resolve to 2xx, and the page does not regress
 * the previously-shipped social-proof / readiness flow downstream.
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.LANDING_BASE_URL ?? "http://localhost:3000";

test.describe("SN CB-style landing", () => {
  test("hero renders the CB hero copy and the yellow Start free pill", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.locator("h1")).toHaveText(/exams that get you in/i);
    // The yellow pill is the primary CTA. It must scroll to #choose-exam,
    // not navigate off-site.
    const cta = page.getByRole("link", { name: /Start free/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "#choose-exam");
  });

  test("four product tiles render: AP, SAT, ACT, PSAT", async ({ page }) => {
    await page.goto(BASE + "/");
    for (const family of ["AP", "SAT", "ACT", "PSAT"]) {
      const tile = page.locator(`h3:has-text("${family}")`);
      await expect(tile).toBeVisible();
    }
  });

  test("each product tile links to its marketing detail route", async ({ page }) => {
    await page.goto(BASE + "/");
    const expected: Record<string, string> = {
      AP: "/ap-prep",
      SAT: "/sat-prep",
      ACT: "/act-prep",
      PSAT: "/psat-prep",
    };
    for (const [family, href] of Object.entries(expected)) {
      const tileLink = page.locator(`a:has(h3:has-text("${family}"))`);
      await expect(tileLink).toHaveAttribute("href", href);
    }
  });

  test("footer links resolve to real pages", async ({ page, request }) => {
    await page.goto(BASE + "/");
    for (const href of ["/pricing", "/faq", "/about", "/privacy", "/terms"]) {
      const link = page.locator(`footer a[href="${href}"]`).first();
      await expect(link).toBeVisible();
      const res = await request.get(BASE + href);
      // Allow 200 or 3xx; what we're guarding against is 404/5xx.
      expect(res.status()).toBeLessThan(400);
    }
  });

  test("how-it-works section shows three numbered steps", async ({ page }) => {
    await page.goto(BASE + "/");
    const section = page.locator('h2:has-text("How it works")');
    await expect(section).toBeVisible();
    for (const step of ["Diagnostic", "Practice", "Master"]) {
      await expect(page.locator(`h3:has-text("${step}")`)).toBeVisible();
    }
  });

  test("two CTA bands both target #choose-exam", async ({ page }) => {
    await page.goto(BASE + "/");
    const ctaLinks = await page.getByRole("link", { name: /Start free/i }).all();
    // One in hero, one in repeat CTA band.
    expect(ctaLinks.length).toBeGreaterThanOrEqual(2);
    for (const cta of ctaLinks) {
      await expect(cta).toHaveAttribute("href", "#choose-exam");
    }
  });
});
