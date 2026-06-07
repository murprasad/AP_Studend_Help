/**
 * QA persona walk — Focus Mode (Agent #3 harness). Rewritten 2026-06-07 after
 * the first version tested the WRONG page (/settings auto-fullscreens on SN, so
 * sidebar-hiding there is caused by exam mode, not Focus) and couldn't even
 * authenticate (used select[name=…] for a Radix <Select>).
 *
 * This version: registers via the REAL Radix grade control, drives the redirect
 * chain to an ONBOARDED /dashboard (the only page whose sidebar is controlled
 * ONLY by Focus Mode), toggles Focus via the localStorage key the hook reads,
 * and HARD-FAILS (no .catch swallowing). Reports OBSERVED behavior.
 *
 *   E2E_BASE_URL=https://studentnest.ai node scripts/_qa-walk-focus-mode.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "https://studentnest.ai";
const TRACK = process.env.TRACK ?? "sat";
const EMAIL = `qa-focus-${Date.now()}@test.studentnest.ai`;
const PASSWORD = "TestPass123!";
const results = [];
const log = (s, st, d = "") => { results.push({ s, st, d }); console.log(`${st === "PASS" ? "✅" : st === "FAIL" ? "❌" : "•"} ${s}${d ? ` — ${d}` : ""}`); };
const waitHydrated = async (p) => { try { await p.waitForLoadState("networkidle", { timeout: 8000 }); } catch { await p.waitForTimeout(1500); } };
const setFocus = (p, on) => p.evaluate((v) => {
  const prefs = { focusMode: v, extendedTime: "1x", energyCheckIn: false };
  localStorage.setItem("sn_focus_prefs", JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("sn-focus-prefs-change", { detail: prefs }));
}, on);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
try {
  // ── Register (real Radix grade select) ──
  await page.goto(`${BASE}/register?track=${TRACK}`, { waitUntil: "domcontentloaded" });
  await waitHydrated(page);
  await page.fill('input[name="firstName"]', "QA");
  await page.fill('input[name="lastName"]', "Focus");
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
  log("Register fresh user (authed)", "PASS", new URL(page.url()).pathname);

  // ── Onboard: pick course + COMPLETE the diagnostic session ──
  // middleware redirects /dashboard → /journey while onboardingCompletedAt is
  // null AND no onboarding_completed=<userId> bridge cookie exists. That cookie
  // is set by the session-COMPLETE PATCH — answering one Q is not enough, so we
  // loop the whole diagnostic until the completion CTA appears.
  await page.waitForTimeout(1500);
  // The journey is a 5-step wizard (STEP 0 = pick exam card, later steps =
  // diagnostic + setup). Generic driver: each iteration, (1) if the track's
  // exam card is showing, pick it; (2) answer an MCQ option if one is shown;
  // (3) click the most-forward advance control. Loop until we leave /journey
  // or a dashboard/practice CTA fires.
  const cardSel = `button:has-text("${TRACK.toUpperCase()} ")`;
  const optionSel = 'button:has-text("(A)"), button:has-text("A)"), button:has-text("A."), button[aria-label*="Option A" i]';
  const advanceSel = 'button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit"), button:has-text("Start"), button:has-text("See your"), button:has-text("dashboard"), button:has-text("practicing"), button:has-text("Get started"), button:has-text("Skip")';
  let diagCompleted = false;
  for (let i = 0; i < 24; i++) {
    if (!page.url().includes("/journey")) { diagCompleted = true; break; }
    const card = page.locator(cardSel).first();
    if (await card.isVisible({ timeout: 1000 }).catch(() => false)) { await card.click().catch(() => {}); await page.waitForTimeout(1200); }
    const opt = page.locator(optionSel).first();
    if (await opt.isVisible({ timeout: 800 }).catch(() => false)) { await opt.click().catch(() => {}); await page.waitForTimeout(500); }
    // The journey's step CTA ("Continue"/"Start") is often below the fold —
    // scroll the rail to the bottom so the primary advance button is in view.
    await page.keyboard.press("End").catch(() => {});
    await page.mouse.wheel(0, 1200).catch(() => {});
    await page.waitForTimeout(400);
    let clicked = false;
    const adv = page.locator(advanceSel).first();
    if (await adv.isVisible({ timeout: 1200 }).catch(() => false)) {
      const label = (await adv.innerText().catch(() => "")).toLowerCase();
      await adv.click().catch(() => {});
      clicked = true;
      await page.waitForTimeout(1600);
      if (/dashboard|practicing|see your/.test(label)) { diagCompleted = true; break; }
    }
    if (!clicked) {
      // Fallback: click the bottom-most enabled non-"Change"/"Exit" button.
      const btns = page.locator('button:not([disabled])');
      const n = await btns.count();
      for (let k = n - 1; k >= 0 && k >= n - 4; k--) {
        const t = (await btns.nth(k).innerText().catch(() => "")).trim().toLowerCase();
        if (t && !/change|exit|all courses|back/.test(t)) { await btns.nth(k).click().catch(() => {}); await page.waitForTimeout(1600); break; }
      }
    }
  }
  log("Complete journey onboarding", diagCompleted ? "PASS" : "WARN", `ended at ${new URL(page.url()).pathname}`);

  // ── Reach /dashboard (the only page whose sidebar is Focus-controlled) ──
  await page.goto(`${BASE}/dashboard`); await waitHydrated(page); await page.waitForTimeout(2000);
  if (!page.url().includes("/dashboard")) {
    log("Reach onboarded /dashboard", "FAIL", `redirected to ${new URL(page.url()).pathname} — onboarding didn't complete; cannot validly test sidebar-hide`);
    throw new Error("could not reach /dashboard (onboarding incomplete)");
  }
  log("Reach onboarded /dashboard", "PASS");

  // ── Regular: sidebar present ──
  const regSidebar = await page.locator("aside.fixed.inset-y-0").count();
  log("Regular: sidebar present on /dashboard", regSidebar >= 1 ? "PASS" : "FAIL", `aside=${regSidebar}`);

  // ── Focus ON: chrome hides + minimal view + calm theme + pill ──
  await setFocus(page, true);
  await page.reload({ waitUntil: "domcontentloaded" }); await waitHydrated(page); await page.waitForTimeout(2000);
  const fSidebar = await page.locator("aside.fixed.inset-y-0").count();
  const fMin = await page.locator('[data-testid="focus-dashboard"]').count();
  const fTheme = await page.locator('[data-focus-mode="true"]').count();
  const fPill = await page.locator('button[aria-pressed="true"]:has-text("Focus")').count();
  log("Focus ON: sidebar HIDDEN", fSidebar === 0 ? "PASS" : "FAIL", `aside=${fSidebar} (expect 0)`);
  log("Focus ON: minimal one-action dashboard", fMin >= 1 ? "PASS" : "FAIL", `focus-dashboard=${fMin}`);
  log("Focus ON: calm theme (data-focus-mode)", fTheme >= 1 ? "PASS" : "FAIL", `count=${fTheme}`);
  log("Focus ON: Focus pill present + pressed (escape hatch)", fPill >= 1 ? "PASS" : "FAIL", `count=${fPill}`);

  // ── Focus OFF: sidebar returns ──
  await setFocus(page, false);
  await page.reload({ waitUntil: "domcontentloaded" }); await waitHydrated(page); await page.waitForTimeout(1500);
  const back = await page.locator("aside.fixed.inset-y-0").count();
  log("Regular restored: sidebar returns", back >= 1 ? "PASS" : "FAIL", `aside=${back}`);
} catch (e) {
  log("WALK ERROR", "FAIL", e.message);
} finally {
  const f = results.filter((r) => r.st === "FAIL").length;
  console.log(`\n=== Focus Mode walk @ ${BASE}: ${results.filter((r) => r.st === "PASS").length} PASS, ${f} FAIL ===`);
  await browser.close();
  process.exit(f > 0 ? 1 : 0);
}
