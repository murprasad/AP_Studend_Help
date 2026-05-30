/**
 * QA — Pass probability / predicted score consistency across SN surfaces
 *
 * SN companion to PL's qa-cross-surface-passprob.spec.ts. SN has the
 * same architecture (loadReadinessSnapshot + computePassProbability)
 * but its metric is a scaled score (AP 1-5, SAT 400-1600, ACT 1-36)
 * not a 0-100 pass percent. The cross-surface assertion is the same
 * in spirit: any two surfaces showing the predicted score for the
 * same (user, course) must agree.
 *
 * Tests the canonical endpoint by smoke-checking it responds without
 * 5xx for a known test user. Full cross-surface diff is deferred to
 * a follow-up once SN's per-surface response shapes are normalized.
 *
 * Run: E2E_BASE_URL=https://studentnest.ai npx playwright test tests/qa-cross-surface-passprob.spec.ts --reporter=list
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";
const EMAIL = "murprasad+pass2@gmail.com";
const PASSWORD = "TestPass@329";
const COURSE = "AP_WORLD_HISTORY";

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  const acc = page.locator('button:has-text("Accept")').first();
  if (await acc.count()) await acc.click().catch(() => {});
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|journey|onboarding)/, { timeout: 30000 });
}

test("cross-surface readiness: pass-probability endpoint responds for test user", async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);

  const ppResp = await page.request.get(`${BASE}/api/pass-probability?course=${COURSE}`);
  expect(ppResp.status()).toBeLessThan(500);

  // Both /api/dashboard and /api/analytics also route through the
  // single-source engine. Smoke them.
  const dashResp = await page.request.get(`${BASE}/api/dashboard?course=${COURSE}`);
  expect(dashResp.status()).toBeLessThan(500);

  const analyResp = await page.request.get(`${BASE}/api/analytics?course=${COURSE}`);
  expect(analyResp.status()).toBeLessThan(500);
});
