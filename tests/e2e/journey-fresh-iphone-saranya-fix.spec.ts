import { test, expect, devices, request as apiRequest } from "@playwright/test";

/**
 * Regression test for the Saranya bounce (2026-05-13).
 *
 * Real-user incident: r.saranya1608@gmail.com (Grade 11, AP track) signed
 * up at 23:31:11, then within 80 seconds created 4 QUICK_PRACTICE sessions
 * for AP_CHEMISTRY, never answered a question, and exited the journey.
 * Journey page hardcoded a default course of AP_CHEMISTRY and Step 0
 * presented a "Your course: AP Chemistry" card that tap-through behavior
 * sailed past. Step 1 then auto-fired POST /api/practice immediately on
 * mount, dropping the user into a chemistry MEDIUM question 3 seconds
 * after signup with no preamble.
 *
 * iPhone Safari iOS 18.7 (her actual UA) is approximated below by
 * iPhone-12 viewport + Chromium engine — Playwright WebKit isn't installed
 * on this CI host. The assertions cover the bug class, not engine-specific
 * rendering. (For genuine WebKit coverage we'd need a separate test job.)
 *
 * Asserts the three fresh-user-funnel fixes:
 *   1. Step 0 mounts in picker mode, NOT a pre-filled "Your course" card.
 *   2. AP_CHEMISTRY is not the silent default — track-aware default
 *      (AP_WORLD_HISTORY for AP track) only seeds the picker, never the
 *      "Start my plan" path without an explicit tap.
 *   3. Step 1 shows an interstitial before /api/practice fires — no
 *      auto-POST on mount.
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.use({ ...devices["iPhone 12"], defaultBrowserType: "chromium" });
test.describe.configure({ retries: 1, timeout: 60_000 });

async function resetTestUserJourney(baseURL: string) {
  const api = await apiRequest.newContext();
  const r = await api.post(`${baseURL}/api/test/auth`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
    data: { action: "create" },
  });
  const j = await r.json();
  const cookieHeader = `${j.cookieName}=${j.sessionToken}`;
  await api.post(`${baseURL}/api/journey`, {
    headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
    data: { action: "reset" },
  });
  await api.dispose();
}

test.describe("Saranya fresh-user fix (2026-05-13)", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    await resetTestUserJourney(baseURL!);
  });

  test("Step 0 mounts in picker mode for fresh users — no silent AP_CHEMISTRY default", async ({ page, context }) => {
    // Drop the local "exited" flag so /dashboard → /journey redirect fires.
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    // Capture every POST /api/practice — the bug was that this fired
    // automatically before the user did anything. Should be zero before
    // the user taps "Start" in Step 1.
    const practicePosts: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/practice")) {
        practicePosts.push(req.url());
      }
    });

    await page.goto("/journey");

    // Picker should be the first thing visible — not "Your course: X" card.
    await expect(page.getByRole("heading", { name: /Pick your course/i })).toBeVisible({ timeout: 15000 });

    // No "Start my plan" button should be reachable yet; user hasn't picked.
    // The Start button only appears in the summary view (after pick).
    const startButton = page.getByRole("button", { name: /Start my plan/i });
    expect(await startButton.count(), "Start button should not be on Step 0 picker view").toBe(0);

    // The picker should NOT pre-highlight AP Chemistry (the old buggy default).
    // We assert the "selected" visual state is absent on AP Chemistry by checking
    // that the card doesn't have the selected ring (border-blue-500 class).
    const chemistryCard = page.locator("button", { hasText: "AP Chemistry" }).first();
    if (await chemistryCard.count()) {
      const cls = await chemistryCard.getAttribute("class");
      expect(cls ?? "", "AP Chemistry should not be pre-selected on Step 0").not.toContain("border-blue-500");
    }

    // No POST /api/practice should have fired during Step 0.
    expect(practicePosts, "no /api/practice POST should fire before explicit pick").toEqual([]);
  });

  test("Explicit course pick required — picking AP_WORLD_HISTORY then Start fires /api/practice exactly once", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    const practicePosts: { url: string; body?: string }[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/practice")) {
        practicePosts.push({ url: req.url(), body: req.postData() ?? undefined });
      }
    });

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /Pick your course/i })).toBeVisible({ timeout: 15000 });

    // Tap AP World History
    await page.locator("button", { hasText: "AP World History" }).first().click();

    // Should now be in summary view with course pre-filled
    await expect(page.getByRole("heading", { name: /Welcome to StudentNest/i })).toBeVisible();
    await expect(page.getByText(/AP World History/i).first()).toBeVisible();

    const startButton = page.getByRole("button", { name: /Start my plan/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Step 1 should show the interstitial — NOT auto-fire /api/practice
    await expect(page.getByText(/quick questions to see where/i)).toBeVisible({ timeout: 10000 });
    expect(practicePosts.length, "no /api/practice POST should fire before tapping Start on the warm-up interstitial").toBe(0);

    // Tap "Start" on the interstitial — NOW practice should fire once
    await page.getByRole("button", { name: /^Start$/ }).click();

    // Wait for the POST to land
    await page.waitForRequest((req) => req.method() === "POST" && req.url().includes("/api/practice"), { timeout: 15000 });
    expect(practicePosts.length, "exactly one /api/practice POST should fire after tapping Start").toBe(1);
    const body = JSON.parse(practicePosts[0].body ?? "{}");
    expect(body.course, "the practice session must be for the course the user picked, not AP_CHEMISTRY").toBe("AP_WORLD_HISTORY");
  });

  test("Saranya pattern reproduced — page reload during Step 1 interstitial does NOT spawn orphan sessions", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { localStorage.removeItem("journey_status_v1"); } catch { /* ignore */ }
    });

    // Get to Step 1 interstitial
    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: /Pick your course/i })).toBeVisible({ timeout: 15000 });
    await page.locator("button", { hasText: "AP World History" }).first().click();
    await page.getByRole("button", { name: /Start my plan/i }).click();
    await expect(page.getByText(/quick questions to see where/i)).toBeVisible({ timeout: 10000 });

    // Now simulate Saranya's behavior: reload twice during the interstitial.
    const practicePosts: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/practice")) {
        practicePosts.push(req.url());
      }
    });

    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // No /api/practice POST should have fired across the reloads —
    // the interstitial is the gate.
    expect(practicePosts, "reloads at Step 1 interstitial must not auto-create QUICK_PRACTICE sessions").toEqual([]);
  });
});
