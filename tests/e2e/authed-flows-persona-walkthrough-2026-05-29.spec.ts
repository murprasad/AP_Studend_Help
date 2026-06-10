/**
 * SN student persona walkthrough — Readiness flavor.
 * Run: E2E_BASE_URL=https://studentnest.ai npx playwright test tests/persona-walkthrough-2026-05-29.spec.ts --reporter=list
 */
import { test, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";
const EMAIL = process.env.E2E_USER || "murprasad+sat@gmail.com";
const PASSWORD = process.env.E2E_PASS || "TestSat@329";
const COURSE = process.env.E2E_COURSE || "SAT_READING_WRITING";

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  const acc = page.locator('button:has-text("Accept")').first();
  if (await acc.count()) await acc.click().catch(() => {});
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|journey|onboarding)/, { timeout: 30000 });
  const welcome = page.locator('button:has-text("Get Started")').first();
  if (await welcome.isVisible({ timeout: 2000 }).catch(() => false)) {
    await welcome.click().catch(() => {});
  }
}

test("SN — student persona walkthrough", async ({ page }) => {
  test.setTimeout(120_000);
  try {
    await login(page);
  } catch (e) {
    console.log(`Login failed for ${EMAIL}: ${(e as Error).message.slice(0, 200)}`);
    console.log("Try setting E2E_USER + E2E_PASS env vars to a known SN account.");
    throw e;
  }

  console.log("\n══ STEP 1 — /api/pass-probability (SN reads as 'Readiness') ══");
  const ppResp = await page.request.get(`${BASE}/api/pass-probability?course=${COURSE}`);
  console.log(`status: ${ppResp.status()}`);
  const pp = await ppResp.json().catch(() => null);
  console.log(JSON.stringify(pp, null, 2));

  console.log("\n══ STEP 2 — /api/todays-set ══");
  const tsResp = await page.request.get(`${BASE}/api/todays-set?course=${COURSE}`);
  console.log(`status: ${tsResp.status()}`);
  const ts = await tsResp.json().catch(() => null);
  console.log(JSON.stringify(ts, null, 2));

  console.log("\n══ STEP 3 — Dashboard ══");
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const heroVisible = await page.locator('[data-testid="readiness-hero"], [data-testid="readiness-hero-empty"], [data-testid="readiness-hero-loading"]').first().isVisible({ timeout: 5000 }).catch(() => false);
  const setVisible = await page.locator('[data-testid="todays-set-cta"], [data-testid="todays-set-empty"], [data-testid="todays-set-done"]').first().isVisible({ timeout: 5000 }).catch(() => false);
  const certVisible = await page.locator('[data-testid="pass-ready-cert"]').first().isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`hero rendered: ${heroVisible}`);
  console.log(`todaysSet rendered: ${setVisible}`);
  console.log(`cert rendered: ${certVisible}`);

  const bodyText = (await page.locator("main").first().innerText().catch(() => "")).slice(0, 600);
  console.log(`\nDashboard top text:\n${bodyText}`);

  await page.screenshot({ path: "test-results/persona-sn-dashboard.png", fullPage: false });
  console.log("📸 saved: test-results/persona-sn-dashboard.png");

  console.log("\n══ STEP 4 — Click Today's Set ══");
  const cta = page.locator('[data-testid="todays-set-cta"]').first();
  if (await cta.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cta.click().catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    console.log(`landed on: ${page.url()}`);
    await page.screenshot({ path: "test-results/persona-sn-after-click.png" });
    console.log("📸 saved: test-results/persona-sn-after-click.png");
  } else {
    console.log("Today's Set CTA NOT VISIBLE — cannot test click flow");
  }
});
