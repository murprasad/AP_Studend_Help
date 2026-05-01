/**
 * scripts/debug-journey-to-dashboard-loop.mjs
 *
 * Reproduces the user-reported "goes back to /journey after going to dashboard."
 * Walks the +std user through journey advance step:5 via API (skipping the
 * MCQ click flow for speed), then opens /dashboard in a fresh browser
 * context and traces every redirect.
 */

import { chromium } from "playwright";
import { request as apiRequest } from "playwright";

const BASE = "https://studentnest.ai";
const EMAIL = "murprasad+std@gmail.com";
const PASSWORD = "TestStd2026!";

function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // ── 1. Login programmatically ─────────────────────────────────────────────
  log("Login");
  const csrfRes = await context.request.get(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  await context.request.post(`${BASE}/api/auth/callback/credentials`, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    form: { email: EMAIL, password: PASSWORD, csrfToken, callbackUrl: `${BASE}/dashboard`, json: "true" },
    maxRedirects: 0,
  });

  // ── 2. Advance the journey to step 5 via API (skip MCQ clicks) ───────────
  log("POST /api/journey start");
  await context.request.post(`${BASE}/api/journey`, {
    headers: { "Content-Type": "application/json" },
    data: { action: "start", course: "AP_WORLD_HISTORY" },
  });
  log("POST /api/journey advance step:5");
  const advanceRes = await context.request.post(`${BASE}/api/journey`, {
    headers: { "Content-Type": "application/json" },
    data: { action: "advance", step: 5, weakestUnit: "WHM_2_NETWORKS_OF_EXCHANGE" },
  });
  log(`  status=${advanceRes.status()}`);
  const sc = advanceRes.headers()["set-cookie"];
  log(`  Set-Cookie:${sc ? " " + sc.slice(0, 150) : " (none)"}`);

  // ── 3. Verify /api/journey now returns currentStep=5 ─────────────────────
  const jRes = await context.request.get(`${BASE}/api/journey`);
  const j = await jRes.json();
  log(`/api/journey currentStep = ${j?.journey?.currentStep ?? "null"}`);
  log(`/api/journey completedAt = ${j?.journey?.completedAt ?? "null"}`);

  // ── 4. Verify /api/user reflects onboardingCompletedAt ───────────────────
  const uRes = await context.request.get(`${BASE}/api/user`);
  const u = await uRes.json();
  log(`/api/user.user.onboardingCompletedAt = ${u?.user?.onboardingCompletedAt ?? "null"}`);
  log(`/api/user.flags.nextStepEngineEnabled = ${u?.flags?.nextStepEngineEnabled}`);

  // Instrument history.replaceState/pushState before navigation so we
  // capture who triggers each URL change with a stack trace.
  await context.addInitScript(() => {
    const origReplace = history.replaceState;
    const origPush = history.pushState;
    history.replaceState = function (...args) {
      console.log("[history.replaceState]", JSON.stringify(args[2]), "stack:", new Error().stack?.split("\n").slice(1, 6).join(" | "));
      return origReplace.apply(this, args);
    };
    history.pushState = function (...args) {
      console.log("[history.pushState]", JSON.stringify(args[2]), "stack:", new Error().stack?.split("\n").slice(1, 6).join(" | "));
      return origPush.apply(this, args);
    };
  });

  // ── 5. Now navigate to /dashboard and watch redirects ────────────────────
  log("\n→ GET /dashboard");
  const nav = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) nav.push(frame.url());
  });

  // Capture all cookies before nav
  const cookiesBeforeNav = await context.cookies();
  log("Cookies in context before nav:");
  for (const c of cookiesBeforeNav) {
    log(`  ${c.name} = ${c.value.slice(0, 50)}${c.value.length > 50 ? "..." : ""}  (path=${c.path}, secure=${c.secure})`);
  }

  // Capture all browser console + network for diagnosis.
  const consoleLogs = [];
  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleLogs.push(`[pageerror] ${err.message}`));

  const apiHits = [];
  page.on("response", async (resp) => {
    const url = resp.url();
    if (/\/api\/(journey|user)$/.test(url) || /\/api\/user\?/.test(url)) {
      try {
        const body = await resp.text();
        apiHits.push({ url, status: resp.status(), body: body.slice(0, 1500) });
      } catch { /* response body race */ }
    }
  });

  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  log("\n📡 Browser-side API responses:");
  for (const h of apiHits) {
    log(`  ${h.status} ${h.url.replace(BASE, "")}`);
    log(`    body: ${h.body.slice(0, 300)}`);
  }
  log("\n📜 Browser console (filtered, all):");
  // Filter out the noisy 500 spam — show distinct messages
  const seen = new Set();
  for (const l of consoleLogs) {
    const key = l.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    log(`  ${l.slice(0, 300)}`);
  }
  log(`\nTotal console messages: ${consoleLogs.length}`);

  log(`\nNav chain:`);
  for (const u of nav) log(`  → ${u}`);
  log(`Final URL: ${page.url()}`);

  if (page.url().includes("/dashboard")) {
    log("✅ EXPECTED — landed on /dashboard");
  } else if (page.url().includes("/journey")) {
    log("❌ BUG REPRODUCED — bounced back to /journey");
    log("   This happens when:");
    log("   - middleware passes (cookie matches OR JWT.onboardingCompletedAt set)");
    log("   - dashboard layout fetches /api/journey, reads currentStep");
    log("   - if currentStep is null, redirects to /journey (line 148)");
    log("   - if currentStep is mid-journey (0-4), redirects (line 155)");
    log("   - if currentStep is 5 or 99, no redirect");
  }

  // Also check what localStorage says
  const localJourneyKey = await page.evaluate(() => {
    try { return localStorage.getItem("journey_status_v1"); } catch { return "(error)"; }
  });
  log(`\nlocalStorage[journey_status_v1] = ${localJourneyKey}`);

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
