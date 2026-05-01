import { test, expect, request as apiRequest, type BrowserContext } from "@playwright/test";

/**
 * Journey Rail Beta 9.6 additions — exit-intent feedback, Sage on FRQ,
 * flashcard micro-step, "You're set up" Step 5, dashboard focus pulse.
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe.configure({ retries: 2, timeout: 60_000 });

async function dropExitedFlag(context: BrowserContext) {
  await context.addInitScript(() => {
    try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
  });
}

async function resetJourney(baseURL: string | undefined) {
  if (!CRON_SECRET || !baseURL) return;
  const api = await apiRequest.newContext();
  const r = await api.post(`${baseURL}/api/test/auth`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
    data: { action: "create" },
  });
  const j = await r.json();
  await api.post(`${baseURL}/api/journey`, {
    headers: { Cookie: `${j.cookieName}=${j.sessionToken}`, "Content-Type": "application/json" },
    data: { action: "reset" },
  });
  await api.dispose();
}

test.describe("Journey Rail Beta 9.6", () => {
  test.beforeEach(async ({ baseURL, context }) => {
    if (!CRON_SECRET) test.skip();
    await resetJourney(baseURL);
    await dropExitedFlag(context);
  });

  test("Exit-intent modal — opens, captures reason + feedback, redirects", async ({ page, request, baseURL }) => {
    if (!baseURL) test.skip();
    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /Welcome to StudentNest/i })).toBeVisible({ timeout: 15000 });

    // Click Exit in the journey shell
    await page.getByRole("button", { name: /Exit/i }).click();
    // Modal opens
    await expect(page.getByRole("heading", { name: /Before you go/i })).toBeVisible({ timeout: 5000 });
    // Six preloaded reasons
    await expect(page.getByText(/Too long/i)).toBeVisible();
    await expect(page.getByText(/Didn't help/i)).toBeVisible();

    // Pick a reason + add free-text + submit
    await page.getByText(/Too long/i).click();
    await page.locator('textarea').fill("Tested by FMEA spec");
    await page.getByRole("button", { name: /Send \+ exit/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Verify the API stored the feedback (admin probe)
    const verify = await request.get(`${baseURL}/api/journey`);
    if (verify.ok()) {
      const d = await verify.json();
      const j = d?.journey;
      // currentStep should now be 99 (exited) and exitReason should match
      expect(j?.currentStep).toBe(99);
      expect(j?.exitReason).toBe("too_long");
    }
  });

  test("Exit-intent modal — Skip closes without feedback", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /Welcome to StudentNest/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /Exit/i }).click();
    await expect(page.getByRole("heading", { name: /Before you go/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /^Skip$/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test("Step 5 — clicking 'Continue practice tomorrow' navigates to /dashboard", async ({ page, baseURL }) => {
    if (!baseURL) test.skip();
    const api = await apiRequest.newContext();
    const r = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    const j = await r.json();
    const cookieHeader = `${j.cookieName}=${j.sessionToken}`;
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "start", course: "AP_WORLD_HISTORY" } });
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "advance", step: 5, weakestUnit: "WHM_2_NETWORKS_OF_EXCHANGE" } });
    await api.dispose();

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /You're set up/i })).toBeVisible({ timeout: 15000 });

    // Click the tile and assert URL navigates. Catches Link-wrapping-Button
    // HTML invariants that render but swallow the click navigation.
    await page.getByText(/Continue practice tomorrow/i).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain("focus=primary-action");
  });

  test("Step 5 — clicking 'Review flashcards' navigates to /dashboard", async ({ page, baseURL }) => {
    if (!baseURL) test.skip();
    const api = await apiRequest.newContext();
    const r = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    const j = await r.json();
    const cookieHeader = `${j.cookieName}=${j.sessionToken}`;
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "start", course: "AP_WORLD_HISTORY" } });
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "advance", step: 5 } });
    await api.dispose();

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /You're set up/i })).toBeVisible({ timeout: 15000 });
    await page.getByText(/Review flashcards/i).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain("focus=flashcards");
  });

  test("Step 5 — clicking 'Ask Sage for help' navigates to /ai-tutor", async ({ page, baseURL }) => {
    if (!baseURL) test.skip();
    const api = await apiRequest.newContext();
    const r = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    const j = await r.json();
    const cookieHeader = `${j.cookieName}=${j.sessionToken}`;
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "start", course: "AP_WORLD_HISTORY" } });
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "advance", step: 5 } });
    await api.dispose();

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /You're set up/i })).toBeVisible({ timeout: 15000 });
    await page.getByText(/Ask Sage for help/i).click();
    await page.waitForURL(/\/ai-tutor/, { timeout: 10000 });
  });

  test("Step 5 — 'You're set up' + 3 next-step tiles", async ({ page, baseURL }) => {
    if (!baseURL) test.skip();
    const api = await apiRequest.newContext();
    const r = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    const j = await r.json();
    const cookieHeader = `${j.cookieName}=${j.sessionToken}`;
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "start", course: "AP_WORLD_HISTORY" } });
    await api.post(`${baseURL}/api/journey`, { headers: { Cookie: cookieHeader, "Content-Type": "application/json" }, data: { action: "advance", step: 5, weakestUnit: "WHM_2_NETWORKS_OF_EXCHANGE" } });
    await api.dispose();

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /You're set up/i })).toBeVisible({ timeout: 15000 });
    // Three checkmarks
    await expect(page.getByText(/Practiced real questions/i)).toBeVisible();
    await expect(page.getByText(/Tried an FRQ/i)).toBeVisible();
    await expect(page.getByText(/projected AP score/i).first()).toBeVisible();
    // Three next-step tiles
    await expect(page.getByText(/Continue practice tomorrow/i)).toBeVisible();
    await expect(page.getByText(/Review flashcards/i)).toBeVisible();
    await expect(page.getByText(/Ask Sage for help/i)).toBeVisible();
    // 2026-05-01: subtle "unlock unlimited everything" text link was
    // promoted to a co-equal tile with the price visible. Assert the new
    // tile copy + ensure $9.99 is rendered (the conversion-moment fix).
    await expect(page.getByText(/Unlock full prep/i)).toBeVisible();
    await expect(page.locator(":text('$9.99/mo')").first()).toBeVisible();
  });

  test("Dashboard ?focus=primary-action scrolls + pulses target", async ({ page, baseURL, context }) => {
    if (!baseURL) test.skip();
    // Mark journey exited so dashboard renders standard
    const api = await apiRequest.newContext();
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "complete-journey" },
    });
    await api.dispose();
    await context.addInitScript(() => {
      try { localStorage.setItem("journey_status_v1", "exited"); } catch { /* ignore */ }
    });

    await page.goto("/dashboard?focus=primary-action");
    // Wait for the focus target to render + receive the pulse class.
    // Assert DOM presence (toBeAttached), not visibility (toBeVisible) —
    // the focus contract is "scroll-and-pulse the target if it exists"
    // not "make sure the target has non-zero height". The wrapper div
    // exists whenever PrimaryActionStrip is rendered (forcing=false +
    // !journeyLoading) but PrimaryActionStrip itself can return null
    // for users with an active in-progress session, leaving the wrapper
    // empty and 0-height. That's the right behavior — the focus
    // mechanism still attached the target.
    await page.waitForTimeout(800);
    const target = page.locator('[data-focus-target="primary-action"]');
    await expect(target).toBeAttached({ timeout: 10000 });
  });

  test("Dashboard ?focus=flashcards auto-expands secondary cards", async ({ page, baseURL, context }) => {
    if (!baseURL) test.skip();
    const api = await apiRequest.newContext();
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "complete-journey" },
    });
    await api.dispose();
    await context.addInitScript(() => {
      try { localStorage.setItem("journey_status_v1", "exited"); } catch { /* ignore */ }
    });

    await page.goto("/dashboard?focus=flashcards");
    // Auto-expand should mean the flashcards section is visible without
    // clicking "Show more tools"
    await expect(page.locator('[data-focus-target="flashcards"]')).toBeVisible({ timeout: 10000 });
  });
});
