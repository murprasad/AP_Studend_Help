/**
 * P0 REPRO — "Failed to submit answer" on StudentNest.
 *
 * Registers a fresh user via the real Radix grade <Select>, drives the journey
 * to a real diagnostic/practice MCQ, clicks an option + Submit, and CAPTURES the
 * EXACT POST /api/practice/<id> response (status + JSON body). Also records any
 * 500 on /api/user and whether the question rendered with clickable options.
 *
 *   E2E_BASE_URL=https://studentnest.ai node scripts/_repro-submit-fail.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "https://studentnest.ai";
const TRACK = process.env.TRACK ?? "sat";
const EMAIL = `repro-submit-${Date.now()}@test.studentnest.ai`;
const PASSWORD = "TestPass123!";
const waitHydrated = async (p) => { try { await p.waitForLoadState("networkidle", { timeout: 8000 }); } catch { await p.waitForTimeout(1500); } };

const submitResponses = [];
const userResponses = [];
const allFailed = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

// Capture submit + /api/user responses with bodies.
page.on("response", async (r) => {
  const u = r.url();
  const method = r.request().method();
  if (/\/api\/practice\/[^/]+$/.test(u) && method === "POST") {
    let bodyText = "";
    try { bodyText = await r.text(); } catch {}
    submitResponses.push({ status: r.status(), url: u, body: bodyText.slice(0, 800) });
    console.log(`\n>>> SUBMIT RESPONSE: ${r.status()} ${u}\n${bodyText.slice(0, 800)}\n`);
  }
  if (/\/api\/user(\?|$)/.test(u)) {
    userResponses.push({ status: r.status(), method });
  }
  if (r.status() >= 400) allFailed.push(`${r.status()} ${method} ${u}`);
});

try {
  // ── Register ──
  await page.goto(`${BASE}/register?track=${TRACK}`, { waitUntil: "domcontentloaded" });
  await waitHydrated(page);
  await page.fill('input[name="firstName"]', "Repro");
  await page.fill('input[name="lastName"]', "Submit");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  const combo = page.locator('[role="combobox"]').first();
  if (await combo.count()) {
    await combo.click();
    await page.locator('[role="option"]').nth(2).click({ timeout: 3000 }).catch(async () => {
      await page.locator('[role="option"]').first().click({ timeout: 2000 });
    });
  }
  await page.locator('button[type="submit"]').first().click().catch(() => {});
  await page.evaluate(() => { const f = document.querySelector("form"); f?.requestSubmit?.(); });
  await page.waitForURL((u) => !u.toString().includes("/register?"), { timeout: 15000 });
  await waitHydrated(page);
  if (page.url().includes("/register?")) throw new Error(`registration did not submit — still on ${page.url()}`);
  console.log(`✅ Registered → ${new URL(page.url()).pathname}`);

  // ── Drive journey, answering each MCQ + capturing submit responses ──
  await page.waitForTimeout(1500);
  const cardSel = `button:has-text("${TRACK.toUpperCase()} ")`;
  const optionSel = 'button:has-text("(A)"), button:has-text("A)"), button:has-text("A."), button[aria-label*="Option A" i]';
  const advanceSel = 'button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit"), button:has-text("Start"), button:has-text("See your"), button:has-text("dashboard"), button:has-text("practicing"), button:has-text("Get started"), button:has-text("Skip")';
  let submittedAny = false;
  let renderedOptions = false;
  for (let i = 0; i < 30; i++) {
    const onJourney = page.url().includes("/journey");
    const card = page.locator(cardSel).first();
    if (await card.isVisible({ timeout: 1000 }).catch(() => false)) { await card.click().catch(() => {}); await page.waitForTimeout(1200); }
    const opt = page.locator(optionSel).first();
    if (await opt.isVisible({ timeout: 800 }).catch(() => false)) {
      renderedOptions = true;
      await opt.click().catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.keyboard.press("End").catch(() => {});
    await page.mouse.wheel(0, 1200).catch(() => {});
    await page.waitForTimeout(400);
    const adv = page.locator(advanceSel).first();
    if (await adv.isVisible({ timeout: 1200 }).catch(() => false)) {
      const label = (await adv.innerText().catch(() => "")).toLowerCase();
      const before = submitResponses.length;
      await adv.click().catch(() => {});
      await page.waitForTimeout(1800);
      if (submitResponses.length > before) submittedAny = true;
      if (/dashboard|practicing|see your/.test(label)) break;
    }
    if (!onJourney && !page.url().includes("/journey")) {
      // We've reached dashboard/practice — go drive a real practice session.
      break;
    }
  }

  // ── Force a clean practice session to get a deterministic MCQ submit ──
  await page.goto(`${BASE}/practice`); await waitHydrated(page); await page.waitForTimeout(2500);
  // Try to start a session — click a Start/Begin button if present.
  const startBtn = page.locator('button:has-text("Start"), button:has-text("Begin"), button:has-text("Practice")').first();
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click().catch(() => {});
    await page.waitForTimeout(4000);
  }
  // Answer up to 3 MCQs in the practice session, capturing each submit.
  for (let q = 0; q < 3; q++) {
    await page.waitForTimeout(1500);
    const opt = page.locator(optionSel).first();
    if (!(await opt.isVisible({ timeout: 2000 }).catch(() => false))) break;
    renderedOptions = true;
    await opt.click().catch(() => {});
    await page.waitForTimeout(600);
    const submitBtn = page.locator('button:has-text("Submit")').first();
    const before = submitResponses.length;
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click().catch(() => {});
      await page.waitForTimeout(3000);
      if (submitResponses.length > before) submittedAny = true;
    }
    // Advance to next question.
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click().catch(() => {});
    }
  }

  // ── Check page for the failure toast text ──
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const failToast = /failed to submit|unable to submit/i.test(bodyText);

  console.log(`\n=== REPRO SUMMARY @ ${BASE} ===`);
  console.log(`Rendered MCQ options at least once: ${renderedOptions}`);
  console.log(`Submitted at least one answer: ${submittedAny}`);
  console.log(`"Failed to submit" toast visible on page: ${failToast}`);
  console.log(`\nSubmit responses (${submitResponses.length}):`);
  for (const s of submitResponses) console.log(`  ${s.status} ${s.url}\n     ${s.body}`);
  console.log(`\n/api/user responses (${userResponses.length}): ${userResponses.map((u) => `${u.status} ${u.method}`).join(", ")}`);
  console.log(`\nAll failed (>=400) requests (${allFailed.length}):`);
  for (const f of allFailed.slice(0, 25)) console.log(`  ${f}`);
} catch (e) {
  console.log(`WALK ERROR: ${e.message}`);
  console.log(`Submit responses captured: ${submitResponses.length}`);
  for (const s of submitResponses) console.log(`  ${s.status} ${s.body}`);
} finally {
  await browser.close();
}
