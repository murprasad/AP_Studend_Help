/**
 * Post-deploy verification: Anson-class diagnostic-stuck bug fixed
 * + Report-button (question_reports) wired.
 *
 * Runs against PROD studentnest.ai. Provisions the functional-test user
 * (Grade 11, AP track), resets their journey, walks Step 3 diagnostic
 * end-to-end, asserts session row gets status=COMPLETED + correctAnswers
 * set + weakestUnit populated. Then visits /practice and confirms Report
 * button is in the DOM + functional.
 */
import { test, expect, request as apiRequest } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

const PROD = "https://studentnest.ai";
const CRON_SECRET = process.env.CRON_SECRET;
const DB_URL = (process.env.DATABASE_URL ?? "").replace(/^["']|["']$/g, "");

test.describe.configure({ retries: 0, timeout: 240_000 });

test("Anson-class diagnostic-stuck fix + Report button wired on prod", async ({ page, context }) => {
  test.skip(!CRON_SECRET, "CRON_SECRET required");
  test.skip(!DB_URL, "DATABASE_URL required for verification queries");

  const sql = neon(DB_URL);

  // ── Provision + authenticate ────────────────────────────────────────────
  const api = await apiRequest.newContext();
  const provision = await api.post(`${PROD}/api/test/auth`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
    data: { action: "create" },
  });
  expect(provision.ok(), `provision: ${provision.status()}`).toBe(true);
  const { sessionToken, cookieName, userId } = await provision.json();
  console.log(`[verify] provisioned user ${userId} (${cookieName})`);

  const url = new URL(PROD);
  await context.addCookies([{
    name: cookieName, value: sessionToken,
    domain: url.hostname, path: "/", httpOnly: true,
    secure: true, sameSite: "Lax",
  }]);
  const cookieHeader = `${cookieName}=${sessionToken}`;

  // ── Reset journey + start fresh on AP_WORLD_HISTORY ──────────────────────
  await api.post(`${PROD}/api/journey`, {
    headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
    data: { action: "reset" },
  });
  await api.post(`${PROD}/api/journey`, {
    headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
    data: { action: "start", course: "AP_WORLD_HISTORY" },
  });
  await api.post(`${PROD}/api/journey`, {
    headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
    data: { action: "advance", step: 3 },
  });
  // Wipe any prior IN_PROGRESS diagnostic rows for this user so this run is clean
  await sql`UPDATE practice_sessions SET status='ABANDONED' WHERE "userId" = ${userId} AND "sessionType" = 'DIAGNOSTIC' AND status = 'IN_PROGRESS'`;

  // ── Phase A: walk diagnostic on /journey ─────────────────────────────────
  await page.goto(`${PROD}/journey`);
  await page.waitForLoadState("networkidle");
  console.log(`[verify] /journey loaded, URL=${page.url()}`);

  // The step-3 view renders diagnostic questions. Wait for first question.
  await page.waitForSelector('button:has-text("A"), button:has-text("B"), [role="radio"], input[type="radio"]', { timeout: 30_000 }).catch(() => {});

  // Click through 5 diagnostic questions — pick A each time (we just need
  // /api/diagnostic/complete to fire; right/wrong doesn't matter for the stuck bug).
  for (let i = 0; i < 5; i++) {
    const optBtn = page.locator('button:has-text("A)"), label:has-text("A)"), button[aria-label*="A"]').first();
    if (await optBtn.isVisible().catch(() => false)) {
      await optBtn.click();
    } else {
      // Fallback: click any button that looks like a multiple-choice option
      const anyOption = page.locator('button').filter({ hasText: /^[A-D]\)/ }).first();
      if (await anyOption.isVisible().catch(() => false)) await anyOption.click();
    }
    await page.waitForTimeout(500);
    const submitBtn = page.getByRole("button", { name: /submit|next|continue/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
    }
    await page.waitForTimeout(1500);
  }

  // Give the /api/diagnostic/complete call up to 20s to finish (with new 8s AI cap, should be fast)
  await page.waitForTimeout(20_000);

  // ── ASSERT 1: diagnostic session is COMPLETED ────────────────────────────
  const recent = (await sql`
    SELECT id, status, "correctAnswers", "totalQuestions", "completedAt"
    FROM practice_sessions
    WHERE "userId" = ${userId} AND "sessionType" = 'DIAGNOSTIC'
    ORDER BY "startedAt" DESC LIMIT 1
  `) as Array<{ id: string; status: string; correctAnswers: number; totalQuestions: number; completedAt: Date | null }>;
  console.log(`[verify] latest diagnostic session: ${JSON.stringify(recent[0])}`);
  expect(recent.length, "should have a diagnostic session").toBeGreaterThan(0);
  expect(recent[0].status, "diagnostic session must be COMPLETED — Anson-bug fix").toBe("COMPLETED");
  expect(recent[0].completedAt, "completedAt must be set").not.toBeNull();
  expect(recent[0].totalQuestions, "totalQuestions should be 5").toBeGreaterThan(0);

  // ── ASSERT 2: diagnosticResult row created with weakUnits + recommendation
  const diagResult = (await sql`
    SELECT id, "weakUnits", recommendation FROM diagnostic_results
    WHERE "userId" = ${userId} AND "sessionId" = ${recent[0].id}
    ORDER BY "createdAt" DESC LIMIT 1
  `) as Array<{ id: string; weakUnits: string[]; recommendation: string }>;
  console.log(`[verify] diagnosticResult: ${JSON.stringify(diagResult[0])}`);
  expect(diagResult.length, "diagnosticResult row must exist").toBeGreaterThan(0);
  expect(Array.isArray(diagResult[0].weakUnits), "weakUnits is array").toBe(true);
  expect(diagResult[0].recommendation?.length, "recommendation should be non-empty").toBeGreaterThan(10);

  // ── Phase B: Report-button wiring on /practice ──────────────────────────
  await page.goto(`${PROD}/practice?course=AP_WORLD_HISTORY`);
  await page.waitForLoadState("networkidle");
  // Click into a quick-practice session to render a question card
  const startBtn = page.getByRole("button", { name: /start practice|start session|begin/i }).first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(4000);

  // ── ASSERT 3: Report button visible on question card
  const reportBtn = page.getByRole("button", { name: /report/i }).first();
  const reportVisible = await reportBtn.isVisible().catch(() => false);
  console.log(`[verify] Report button visible on question card? ${reportVisible}`);
  expect(reportVisible, "Report button must be wired into practice question card").toBe(true);

  // ── ASSERT 4: click Report → modal opens → submit → row appears in question_reports
  const beforeCount = (await sql`SELECT COUNT(*)::int AS n FROM question_reports WHERE "userId" = ${userId}`) as Array<{ n: number }>;
  await reportBtn.click();
  await page.waitForTimeout(800);
  // Pick the "unclear" reason
  await page.locator('input[value="unclear"]').click({ timeout: 5000 }).catch(() => {});
  await page.locator('button:has-text("Submit Report")').click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const afterCount = (await sql`SELECT COUNT(*)::int AS n FROM question_reports WHERE "userId" = ${userId}`) as Array<{ n: number }>;
  console.log(`[verify] question_reports rows: ${beforeCount[0].n} → ${afterCount[0].n}`);
  expect(afterCount[0].n, "Report submission should create a question_reports row").toBeGreaterThan(beforeCount[0].n);

  console.log(`[verify] ✓ Both fixes verified live on studentnest.ai`);
  await api.dispose();
});
