import { test, expect } from "@playwright/test";

test("fresh user dashboard exposes Focus, but does not default into it", async ({ page, baseURL }) => {
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
  console.log(body.slice(0, 1200));
  expect(body).toMatch(/Focus|Study your way|Turn on Focus Mode/i);
  expect(body).not.toMatch(/Focus Mode on — calm/i);
});
