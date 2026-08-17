import { test, expect } from "@playwright/test";

/**
 * SAT dashboard semantics UAT.
 *
 * This is the product-level guard for the exact issue we just found:
 * SAT must not inherit CLEP/DSST pass-probability language.
 *
 * If the logged-in SAT surface still reads like a pass/fail product,
 * the student trust bar is not met.
 */

test.describe.configure({ retries: 1, timeout: 45_000 });

test("SAT dashboard uses score-native framing and suppresses pass-probability language", async ({ page, baseURL }) => {
  const root = baseURL ?? "https://preplion.ai";
  const email = process.env.E2E_USER ?? "qa-sat@test.preplion.ai";
  const password = process.env.E2E_PASS ?? "QaSatBluebook329";

  await page.goto(`${root}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(password);
  await Promise.allSettled([
    page.waitForURL(/\/(dashboard|journey|onboarding)/, { timeout: 30000 }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForTimeout(2000);

  await page.goto(`${root}/dashboard`, { waitUntil: "domcontentloaded" });
  const body = await page.locator("body").innerText();
  expect(body.toLowerCase()).not.toContain("pass probability");
  expect(body).toMatch(/SAT|1600|800|score|ready/i);
});
