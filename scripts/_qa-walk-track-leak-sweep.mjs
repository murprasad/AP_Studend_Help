// Systematic track-leak sweep — what the user explicitly asked for:
// "Set course as non-AP and visit every page and make sure no AP
// reference shows up. Why is this simple task can't be performed?"
//
// Walks every authed page on SN as a SAT_MATH user and reports
// any AP/FRQ/"Predicted AP"/etc. text that leaks into the rendered
// body. Catches the bug class that was being found one-page-at-a-time.
//
// Usage:
//   node scripts/_qa-walk-track-leak-sweep.mjs
//   E2E_BASE_URL=https://staging.studentnest.pages.dev \
//     node scripts/_qa-walk-track-leak-sweep.mjs
//   TRACK=act node scripts/_qa-walk-track-leak-sweep.mjs
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "https://studentnest.ai";
const TRACK = process.env.TRACK ?? "sat";
const COURSE_BY_TRACK = { ap: "AP_WORLD_HISTORY", sat: "SAT_MATH", act: "ACT_MATH", psat: "PSAT_MATH" };
const COURSE = COURSE_BY_TRACK[TRACK] ?? "SAT_MATH";
const EMAIL = `qa-leak-${TRACK}-${Date.now()}@test.studentnest.ai`;
const PASSWORD = "Sweep#2026";

// Surfaces every fresh user could plausibly reach as a SAT student.
const PAGES = [
  "/dashboard",
  "/practice",
  "/diagnostic",
  "/study-plan",
  "/analytics",
  "/flashcards",
  "/mock-exam",
  "/sage-coach",
  "/community",
  "/settings",
  "/billing",
  "/resources",
];

// Patterns that should NOT appear on a non-AP track. Each is a regex
// + a short human description. Word boundary on bare "AP" so we don't
// match "apply", "happy", etc. — but DO match "AP Score", "AP exam".
const LEAK_PATTERNS = TRACK === "ap" ? [] : [
  { re: /\bAP\b\s+(Score|Exam|exam|score|courses|Premium|Calc|Lit|Bio)/, label: "AP literal in body" },
  { re: /Predicted\s+AP/i, label: '"Predicted AP …"' },
  { re: /\bFRQs?\b/i, label: "FRQ/FRQs (AP-only concept)" },
  { re: /try\s+1\s+FRQ/i, label: '"Try 1 FRQ" CTA' },
  { re: /AP\/SAT\/ACT/, label: '"AP/SAT/ACT" combined family label' },
  { re: /a\s+1[-–]5\s+scale/i, label: '"1-5 scale" (AP scoring)' },
  { re: /Estimated\s+AP\s+Score/i, label: '"Estimated AP Score"' },
  { re: /AP\s+Premium/, label: "AP Premium upsell" },
  { re: /real\s+AP\s+score/i, label: '"real AP score" copy' },
  { re: /1\s*\/\s*5\b/, label: "1/5 score badge (AP scale)" },
];

const browser = await chromium.launch({ headless: process.env.HEADLESS !== "0" });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();

async function waitHydrated(p) {
  try { await p.waitForLoadState("networkidle", { timeout: 6000 }); }
  catch { await p.waitForTimeout(1200); }
}

// ── Register + commit to non-AP track via /journey ──────────────────────────
console.log(`Walking ${BASE} as ${EMAIL} with track=${TRACK.toUpperCase()} course=${COURSE}`);
await page.goto(`${BASE}/register?track=${TRACK}`, { waitUntil: "domcontentloaded" });
await waitHydrated(page);
await page.fill('input[name="firstName"]', "Sweep");
await page.fill('input[name="lastName"]', TRACK.toUpperCase());
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', PASSWORD);
const gradeNative = page.locator('select[name="gradeLevel"]').first();
if (await gradeNative.count()) await gradeNative.selectOption({ index: 2 }).catch(() => {});
else {
  const tr = page.locator('label[for="gradeLevel"]').locator('xpath=following::button[@role="combobox"][1]').first();
  if (await tr.count()) { await tr.click(); await page.waitForTimeout(500); const opt = page.locator('[role="option"]').first(); await opt.waitFor({ state: "visible", timeout: 3000 }).catch(() => {}); await opt.click().catch(() => {}); }
}
const reqChecks = page.locator('input[type="checkbox"][required]');
const rcCount = await reqChecks.count();
for (let i = 0; i < rcCount; i++) await reqChecks.nth(i).check({ timeout: 1000 }).catch(() => {});
await page.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit?.(); });
await page.waitForURL((u) => !u.toString().includes("/register"), { timeout: 15000 }).catch(() => {});
await waitHydrated(page);

// Pick the track family on journey so user.track + course are committed.
await page.waitForTimeout(1500);
const familyBtn = page.locator(`button:has-text("${TRACK.toUpperCase()}")`).first();
if (await familyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  await familyBtn.click();
  await page.waitForTimeout(2500);
}

// ── Sweep every page + grep ─────────────────────────────────────────────────
let totalLeaks = 0;
const findings = [];
for (const path of PAGES) {
  await page.goto(`${BASE}${path}`).catch(() => {});
  await waitHydrated(page);
  await page.waitForTimeout(1500);
  const body = await page.locator("body").innerText().catch(() => "");
  const url = page.url();
  const reached = !url.includes("/login") && !url.includes("/register");

  const pageLeaks = [];
  for (const p of LEAK_PATTERNS) {
    const m = body.match(p.re);
    if (m) {
      pageLeaks.push({ label: p.label, snippet: m[0].slice(0, 80) });
    }
  }
  totalLeaks += pageLeaks.length;
  const status = !reached ? "⛔" : pageLeaks.length === 0 ? "✅" : "❌";
  console.log(`${status} ${path.padEnd(18)}${reached ? "" : `(redirected → ${new URL(url).pathname})`}${pageLeaks.length ? ` ${pageLeaks.length} leak(s)` : ""}`);
  for (const l of pageLeaks) {
    console.log(`     [${l.label}] "${l.snippet}"`);
  }
  if (pageLeaks.length) findings.push({ path, leaks: pageLeaks });
}

console.log(`\n=== SUMMARY ===`);
console.log(`Pages walked:   ${PAGES.length}`);
console.log(`Total leaks:    ${totalLeaks}`);
console.log(`Affected pages: ${findings.length}`);
if (findings.length) {
  console.log(`\nAffected page list:`);
  for (const f of findings) console.log(`  ${f.path} (${f.leaks.length})`);
}

await browser.close();
process.exit(totalLeaks > 0 ? 1 : 0);
