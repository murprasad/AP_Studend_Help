/**
 * tests/e2e/diagnostic-silent-failure-fix.spec.ts
 *
 * Verifies fix for the diagnostic-silent-failure bug that bounced 3 of 3
 * last new users (Cherri 2026-05-06, Ayden 2026-05-10, Mariam 2026-05-11).
 *
 * BEFORE: catch block silently called onComplete({predictedScore: null}),
 *         user saw "Predicted Score = 1" / empty Step 5, bounced.
 *
 * AFTER:  retry 3x with 1s/2s backoff. On final failure: red toast +
 *         onComplete with client-computed predictedScore (NOT null).
 *
 * This test FORCES the API to fail (via Playwright route mocking) and
 * verifies the toast + fallback advance happen.
 *
 * Strategy: jump the test user directly to currentStep=3 via /api/journey
 * so we don't have to drive Steps 0-2 in the UI (those have their own
 * flake surface and aren't what we're verifying).
 */
import { test, expect, request as apiRequest } from "@playwright/test";

const CRON_SECRET = process.env.CRON_SECRET;

test.describe.configure({ retries: 0, timeout: 180_000 });

test.describe("Diagnostic silent-failure fix (Mariam/Ayden/Cherri bug)", () => {
  test("toast + fallback score when /api/diagnostic/complete returns 500", async ({ page, baseURL }) => {
    if (!CRON_SECRET || !baseURL) test.skip();

    // ── Phase A: park journey at step 3 via API ────────────────────────────
    // We need a journey row that is at currentStep=3 with course=AP_WORLD_HISTORY.
    // The authed-flows fixture user is already logged in (storageState).
    // We just need to (re)write their journey row.
    const api = await apiRequest.newContext();
    // Reset any prior journey state (e.g. completed from auth.setup).
    const cookieHeader = await getJwtCookieHeader(page);
    await api.post(`${baseURL}/api/journey`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { action: "reset" },
    });
    // Start a new journey on a real course
    await api.post(`${baseURL}/api/journey`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { action: "start", course: "AP_WORLD_HISTORY" },
    });
    // Advance to step 3
    await api.post(`${baseURL}/api/journey`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { action: "advance", step: 3 },
    });
    await api.dispose();

    // ── Phase B: instrument network + nav to /journey ──────────────────────
    let completeAttempts = 0;
    const startTimes: number[] = [];

    // Force /api/diagnostic/complete to always 500.
    await page.route("**/api/diagnostic/complete", (route) => {
      completeAttempts++;
      startTimes.push(Date.now());
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "simulated_worker_timeout" }),
      });
    });

    // Bust any cached journey_status flag the auth fixture wrote so we don't
    // get bounced off /journey to /dashboard. The auth fixture set
    // localStorage.journey_status_v1 = "exited" — clear that.
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("journey_status_v1");
        localStorage.removeItem("onboarding_completed");
      } catch { /* ignore */ }
    });

    await page.goto("/journey", { waitUntil: "domcontentloaded" });

    // ── Phase C: drive Step 3 ──────────────────────────────────────────────
    // Wait for the Step 3 header to be visible (component renders this).
    await expect(page.getByText(/Step 3 · Diagnostic/i)).toBeVisible({ timeout: 30_000 });

    // Read the total Q count from the header text "Question 1 of N".
    const headerText = (await page.getByText(/Question \d+ of \d+/i).first().textContent()) ?? "";
    const totalQs = parseInt(headerText.match(/of (\d+)/)?.[1] ?? "5", 10);
    console.log(`[diagnostic-fix] diagnostic has ${totalQs} questions`);

    let answered = 0;
    for (let i = 0; i < totalQs; i++) {
      const qIdx = i + 1;
      // Wait for the question header to confirm we're on the expected Q.
      await expect(page.getByText(new RegExp(`Question ${qIdx} of ${totalQs}`))).toBeVisible({ timeout: 15_000 });

      // Click the first option (A). Option buttons have a "(A)" prefix span.
      const optionA = page.locator('button').filter({ hasText: /^\(A\)/ }).first();
      await optionA.waitFor({ state: "visible", timeout: 10_000 });
      await optionA.click();
      answered++;

      // After feedback renders, "Next" or "See my score" appears.
      const isLast = qIdx === totalQs;
      const btnName = isLast ? /See my score/i : /Next/i;
      const advBtn = page.getByRole("button", { name: btnName });
      await advBtn.waitFor({ state: "visible", timeout: 10_000 });
      await advBtn.click();

      if (isLast) break;
      // Small settle for state transition.
      await page.waitForTimeout(200);
    }

    console.log(`[diagnostic-fix] answered ${answered}/${totalQs} diagnostic questions`);

    // ── Phase D: assert retry + toast + advance ────────────────────────────
    // 1. /api/diagnostic/complete was called at least 1x (will be 3x by spec).
    await expect.poll(() => completeAttempts, { timeout: 12_000 }).toBeGreaterThanOrEqual(1);

    // 2. Toast title (run this assertion BEFORE the advance check so its
    // pass/fail is captured even if Step 4 takes longer to render).
    const toast = page.getByText("Couldn't save your full diagnostic", { exact: true }).first();
    await expect(toast, "fix toast title should be visible").toBeVisible({ timeout: 8_000 });

    // Capture the toast description text BEFORE it auto-dismisses (~5s).
    const toastBody = page.locator('li[role="status"]').filter({ hasText: /Couldn't save your full diagnostic/ }).first();
    const toastText = await toastBody.textContent({ timeout: 3_000 }).catch(() => "(toast dismissed before read)");
    await page.screenshot({ path: "test-results/diagnostic-fix-toast.png", fullPage: false });

    // Wait for max-attempts to settle, then snapshot the counter.
    await page.waitForTimeout(3_500);
    console.log(`[diagnostic-fix] /api/diagnostic/complete attempts: ${completeAttempts}`);
    console.log(`[diagnostic-fix] inter-retry deltas (ms): ${startTimes.slice(1).map((t, i) => t - startTimes[i]).join(", ")}`);
    console.log(`[diagnostic-fix] toast text: ${toastText}`);

    expect(completeAttempts, "expected retries 2-3, fix uses MAX_ATTEMPTS=3").toBeGreaterThanOrEqual(2);
    expect(completeAttempts).toBeLessThanOrEqual(3);

    // 3. Journey must advance — assert Step 4 header is visible.
    // Component DOM: <p class="...">Step 4 of 5</p>
    const advanced = page.getByText("Step 4 of 5", { exact: true });
    await expect(advanced, "journey should advance past step 3 via fallback").toBeVisible({ timeout: 15_000 });
    console.log(`[diagnostic-fix] advanced to Step 4`);

    // Bonus: read out the projected score the fallback computed.
    const projectedScore = await page.locator('text=/^[1-5]$/').first().textContent().catch(() => "(?)");
    console.log(`[diagnostic-fix] client-computed projected score: ${projectedScore}`);

    await page.screenshot({ path: "test-results/diagnostic-fix-step4.png", fullPage: false });

    console.log("[diagnostic-fix] PASS — retry + toast + fallback advance verified");
  });
});

/**
 * Pull the JWT cookie out of the loaded storage state so we can speak to
 * /api/journey from the apiRequest context (which doesn't inherit cookies
 * from the page automatically).
 */
async function getJwtCookieHeader(page: import("@playwright/test").Page): Promise<string> {
  const cookies = await page.context().cookies();
  const jwt = cookies.find((c) =>
    c.name === "next-auth.session-token" ||
    c.name === "__Secure-next-auth.session-token",
  );
  if (!jwt) throw new Error("no next-auth cookie in storage state — auth.setup must run first");
  return `${jwt.name}=${jwt.value}`;
}
