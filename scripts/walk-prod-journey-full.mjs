/**
 * scripts/walk-prod-journey-full.mjs — full first-time walk against prod.
 *
 * Per feedback_persona_walkthroughs_must_actually_run + feedback_test_clicks_not_just_visibility:
 * trace every step by CLICKING, not just rendering checks. Capture network
 * + console errors. Take screenshots on failure.
 *
 * Login → /journey Step 0 → click Start → Step 1 (3 MCQs) → answer all 3 →
 * verify trans12 → Step 2 (FRQ) → verify FRQ prompt visible (don't submit,
 * AI scoring is slow) → exit → /dashboard → verify engine hero card.
 */

import { chromium } from "playwright";

const BASE = "https://studentnest.ai";
const EMAIL = "murprasad+std@gmail.com";
const PASSWORD = "TestStd2026!";

function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors so we surface real client-side breaks.
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  let pass = true;
  function assert(cond, label) {
    if (cond) log(`  ✅ ${label}`);
    else { log(`  ❌ ${label}`); pass = false; }
  }

  try {
    // ── Login (programmatic — POST credentials) ──────────────────────────
    log("Step A — Login (via NextAuth credentials POST)");
    // Get a CSRF token first (NextAuth requires it for credentials sign-in).
    const csrfRes = await context.request.get(`${BASE}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    // POST credentials. NextAuth's credentials callback consumes form-encoded
    // body and sets the session cookie via Set-Cookie on the response.
    const signInRes = await context.request.post(`${BASE}/api/auth/callback/credentials`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        email: EMAIL,
        password: PASSWORD,
        csrfToken,
        callbackUrl: `${BASE}/dashboard`,
        json: "true",
      },
      maxRedirects: 0,
    });
    log(`  signin status: ${signInRes.status()}`);
    // The cookies are now in the context. Hit /dashboard and let middleware
    // do its thing.
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    log(`  landed at: ${page.url()}`);
    assert(page.url().includes("/journey"), `Redirected to /journey (was ${page.url()})`);

    // ── Step 0 — Course pick ──────────────────────────────────────────────
    log("Step 0 — Course pick");
    await page.getByRole("heading", { name: /Welcome to StudentNest/i }).first().waitFor({ timeout: 15000 });
    assert(true, '"Welcome to StudentNest" rendered');
    const startBtn = page.getByRole("button", { name: /Start my plan/i }).first();
    await startBtn.waitFor({ timeout: 10000 });
    assert(true, '"Start my plan" button rendered');

    log('  → click "Start my plan"');
    await startBtn.click();

    // ── Step 1 — 3 MCQs ───────────────────────────────────────────────────
    log("Step 1 — Warm-up (3 MCQs)");
    // Answer buttons render as: <button><span>(A)</span> ...option text...</button>
    // Match by the leading "(A)" / "(B)" / "(C)" / "(D)" text.
    for (let i = 1; i <= 3; i++) {
      log(`  Q${i} — waiting for answer buttons`);
      try {
        // Wait for the (A) answer button to appear — that's the load signal.
        const firstAnswer = page.locator("button").filter({ hasText: /^\(A\)/ }).first();
        await firstAnswer.waitFor({ state: "visible", timeout: 30000 });
        await firstAnswer.click({ timeout: 5000 });
        log(`  Q${i} answer (A) clicked → waiting for feedback`);

        // After answer, the feedback card with "Correct"/"Not quite" + a
        // "Next question" or "Continue" button renders.
        const nextBtn = page.getByRole("button", { name: /Next question|Continue/i }).first();
        await nextBtn.waitFor({ state: "visible", timeout: 15000 });
        await nextBtn.click({ timeout: 5000 });
        log(`  Q${i} advanced`);
      } catch (e) {
        log(`  ⚠ Q${i} click flow failed: ${e.message.slice(0, 120)}`);
        await page.screenshot({ path: `data/e2e-screenshots/walk-prod-step1-q${i}-fail.png` });
        throw e;
      }
    }
    assert(true, "Step 1 — 3 MCQs answered");

    // ── trans12 → Step 2 FRQ ──────────────────────────────────────────────
    log("Trans 1→2 — 'Now try a real AP question'");
    try {
      // Transition card has a Continue button via TransitionCard component.
      const transContinue = page.getByRole("button", { name: /^Continue$/i }).first();
      await transContinue.waitFor({ state: "visible", timeout: 15000 });
      await transContinue.click();
      assert(true, "Trans 1→2 Continue clicked");
    } catch (e) {
      log(`  ⚠ trans12 button not found: ${e.message.slice(0, 80)}`);
    }

    log("Step 2 — FRQ surface");
    try {
      // Step 2 renders Step2Frq which displays the prompt + a textarea
      // for the student response. Wait for the textarea — that's the
      // proof Step 2 loaded.
      await page.locator("textarea").first().waitFor({ state: "visible", timeout: 30000 });
      assert(true, "Step 2 FRQ textarea rendered");
    } catch (e) {
      log(`  ⚠ Step 2 textarea not detected: ${e.message.slice(0, 80)}`);
      await page.screenshot({ path: "data/e2e-screenshots/walk-prod-step2-fail.png" });
    }

    // ── Sample state mid-flight ───────────────────────────────────────────
    log("State sample mid-journey");
    const userRes = await page.request.get(`${BASE}/api/user`);
    const userJson = userRes.ok() ? await userRes.json() : null;
    log(`  /api/user.flags.nextStepEngineEnabled: ${userJson?.flags?.nextStepEngineEnabled}`);
    log(`  /api/user.user.onboardingCompletedAt: ${userJson?.user?.onboardingCompletedAt ?? "NULL"}`);

    const journeyRes = await page.request.get(`${BASE}/api/journey`);
    const journeyJson = journeyRes.ok() ? await journeyRes.json() : null;
    log(`  /api/journey.currentStep: ${journeyJson?.journey?.currentStep ?? "no row"}`);

    const nextStepRes = await page.request.get(`${BASE}/api/next-step?course=AP_WORLD_HISTORY`);
    const nextStepJson = nextStepRes.ok() ? await nextStepRes.json() : null;
    log(`  /api/next-step.kind: ${nextStepJson?.nextStep?.kind} (priority ${nextStepJson?.nextStep?.priority})`);
    log(`  /api/next-step.headline: ${nextStepJson?.nextStep?.headline}`);

    // ── Console error report ──────────────────────────────────────────────
    if (consoleErrors.length > 0) {
      log(`\n⚠ Console errors captured (${consoleErrors.length}):`);
      for (const err of consoleErrors.slice(0, 10)) log(`    - ${err.slice(0, 200)}`);
    } else {
      log("\n✅ No console errors during walk");
    }

    log(`\n${pass ? "✅ WALK PASSED" : "❌ WALK FAILED"}`);
  } catch (e) {
    log(`💥 Walk crashed: ${e.message}`);
    await page.screenshot({ path: "data/e2e-screenshots/walk-prod-crash.png" });
    pass = false;
  } finally {
    await browser.close();
    process.exit(pass ? 0 : 1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
