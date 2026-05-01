import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * Routing-gap regression specs (2026-05-01).
 *
 * Closes gaps surfaced in the routing map / gap analysis:
 *   - G1: /journey was not in the middleware matcher → unauthed users
 *         hitting /journey directly didn't bounce to /login.
 *   - G5: authed user with no UserJourney row was untested. This is the
 *         state every brand-new user sees on first /dashboard load.
 *   - G6: Step 5 had 3 main tiles click-tested (journey-rail-96.spec.ts)
 *         but the Premium "unlock unlimited everything" link was only
 *         visibility-checked. Per feedback_test_clicks_not_just_visibility
 *         (HARD REQUIREMENT), every interactive surface needs a click test.
 *   - G7: ADMIN routing was fully untested. Non-ADMIN hitting /admin
 *         should redirect to /dashboard. ADMIN should pass through.
 *
 * All specs require CRON_SECRET (skipped otherwise — graceful PR-CI degrade)
 * and use the existing /api/test/auth provisioning endpoint.
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe.configure({ retries: 2, timeout: 60_000 });

// ─── G7: Admin routing ───────────────────────────────────────────────────────

test.describe("G7 — admin routing", () => {
  test.beforeEach(async () => {
    if (!CRON_SECRET) test.skip();
  });

  test("non-ADMIN hits /admin → redirects to /dashboard", async ({ page }) => {
    // The default test user provisioned by auth.setup.ts is NOT an admin.
    const nav: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) nav.push(frame.url());
    });

    await page.goto("/admin", { waitUntil: "domcontentloaded", timeout: 15000 });

    expect(page.url(), `Expected /dashboard, got ${page.url()}`).toContain("/dashboard");
    expect(nav.length, `Redirect chain too long: ${nav.join(" → ")}`).toBeLessThan(4);
  });

  test("non-ADMIN hits /admin/manage → redirects to /dashboard", async ({ page }) => {
    await page.goto("/admin/manage", { waitUntil: "domcontentloaded", timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
    expect(page.url()).not.toContain("/admin");
  });

  test("non-ADMIN hits /admin/anything-deep → redirects to /dashboard", async ({ page }) => {
    await page.goto("/admin/foo/bar/baz", { waitUntil: "domcontentloaded", timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });
});

// ─── G1: /journey middleware coverage ────────────────────────────────────────

test.describe("G1 — /journey middleware coverage", () => {
  test("authed user can hit /journey directly without redirect loop", async ({ page }) => {
    if (!CRON_SECRET) test.skip();
    // The test user has completed the journey (auth.setup.ts marks them).
    // Hitting /journey directly should land on Step 5 ("You're set up")
    // without bouncing through middleware → /journey → middleware → ...
    const nav: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) nav.push(frame.url());
    });

    await page.goto("/journey", { waitUntil: "domcontentloaded", timeout: 15000 });

    expect(page.url(), `Expected /journey, got ${page.url()}`).toContain("/journey");
    // Loop guard: if middleware exempts /journey but middleware also runs
    // ON /journey, an unhandled exemption would bounce. We've added /journey
    // to isOnboardingRoute so this should land cleanly.
    expect(nav.length, `Redirect chain too long: ${nav.join(" → ")}`).toBeLessThan(4);
  });

  test("unauthed user hitting /journey → redirects to /login", async ({ baseURL }) => {
    if (!baseURL) test.skip();
    // Use a pristine context with no auth cookies so middleware sees
    // unauthed → its withAuth `authorized` callback returns false →
    // built-in redirect to /login. Before G1 was fixed, /journey was
    // not in the matcher, so middleware never ran on it and the page
    // rendered (broken) for unauthed users.
    const api = await apiRequest.newContext({ storageState: undefined });
    const r = await api.get(`${baseURL}/journey`, { maxRedirects: 0 });
    // Either 302 to /login or 307. NOT 200.
    expect(r.status(), `Expected redirect, got ${r.status()}`).toBeGreaterThanOrEqual(300);
    expect(r.status()).toBeLessThan(400);
    const location = r.headers()["location"] ?? "";
    expect(location, `Expected /login redirect, got ${location}`).toMatch(/\/login|\/api\/auth/);
    await api.dispose();
  });
});

// ─── G5: authed-no-Journey-row state ─────────────────────────────────────────

test.describe("G5 — authed user with no UserJourney row", () => {
  /**
   * Mints a fresh JWT after the DB reset and plants it in the browser
   * context, replacing the stale onboarded-state cookie that auth.setup.ts
   * stored. Without this, the JWT still says onboardingCompletedAt=ISO
   * even though the DB row is null, so middleware doesn't redirect.
   */
  async function freshAuthForG5(baseURL: string, page: import("@playwright/test").Page) {
    const api = await apiRequest.newContext();
    // Reset DB first so the create action below mints a JWT reflecting
    // the null onboardingCompletedAt state.
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET!}`, "Content-Type": "application/json" },
      data: { action: "reset-onboarding" },
    });
    const provisionRes = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET!}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    const provision = await provisionRes.json();
    const cookieHeader = `${provision.cookieName}=${provision.sessionToken}`;
    // Drop the journey row entirely so currentStep is null.
    await api.post(`${baseURL}/api/journey`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { action: "reset" },
    });
    await api.dispose();

    // Replace the storage-state cookie with the freshly minted one.
    const url = new URL(baseURL);
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: provision.cookieName,
        value: provision.sessionToken,
        domain: url.hostname,
        path: "/",
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "Lax",
      },
    ]);
  }

  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET || !baseURL) test.skip();
  });

  test("/dashboard with null onboardingCompletedAt → /journey rail loads cleanly", async ({ page, context, baseURL }) => {
    await freshAuthForG5(baseURL!, page);
    // Drop any localStorage cache that would pre-empt the redirect.
    await context.addInitScript(() => {
      try {
        localStorage.removeItem("onboarding_completed");
        localStorage.removeItem("journey_status_v1");
      } catch { /* ignore */ }
    });

    const nav: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) nav.push(frame.url());
    });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 15000 });

    // Should land somewhere safe — /journey, /practice/quickstart, or
    // /onboarding (legacy alias). The exact target depends on which
    // middleware fix is active, but the user MUST NOT crash on a stuck page.
    const finalUrl = page.url();
    expect(
      finalUrl.includes("/journey") || finalUrl.includes("/practice/quickstart") || finalUrl.includes("/onboarding"),
      `Expected onboarding-rail target, got ${finalUrl}`,
    ).toBe(true);
    expect(nav.length, `Redirect chain too long: ${nav.join(" → ")}`).toBeLessThan(5);
  });

  test("/journey with no UserJourney row → renders Step 0 course pick", async ({ page, context, baseURL }) => {
    await freshAuthForG5(baseURL!, page);
    await context.addInitScript(() => {
      try {
        localStorage.removeItem("onboarding_completed");
        localStorage.removeItem("journey_status_v1");
      } catch { /* ignore */ }
    });

    await page.goto("/journey", { waitUntil: "networkidle", timeout: 20000 });

    // Step 0 renders the JourneyShell + Step0CoursePick component, which
    // shows "Welcome to StudentNest" as the H1. Assert that specific
    // heading + the "Start my plan" button so we know the page is
    // FUNCTIONAL, not just rendering an empty shell.
    await expect(page.getByRole("heading", { name: /Welcome to StudentNest/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Start my plan/i })).toBeVisible({ timeout: 5000 });
  });
});

// ─── G6: Step 5 Premium upgrade link click ───────────────────────────────────

test.describe("G6 — Step 5 Premium upgrade link click-navigates", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET || !baseURL) test.skip();
    // Land the user on Step 5 by setting currentStep=5 directly.
    const api = await apiRequest.newContext();
    const r = await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "create" },
    });
    const j = await r.json();
    const cookieHeader = `${j.cookieName}=${j.sessionToken}`;
    await api.post(`${baseURL}/api/journey`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { action: "start", course: "AP_WORLD_HISTORY" },
    });
    await api.post(`${baseURL}/api/journey`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { action: "advance", step: 5 },
    });
    await api.dispose();
  });

  test("Step 5 Premium upgrade link clicks through to /billing with utm tag", async ({ page }) => {
    await page.goto("/journey", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /You're set up/i })).toBeVisible({ timeout: 15000 });

    // Find the subtle "unlock unlimited everything" Premium link and CLICK it.
    // Per feedback_test_clicks_not_just_visibility, visibility alone is NOT
    // proof — the click must actually navigate.
    const upgradeLink = page.getByRole("link", { name: /unlock unlimited everything|Unlock full prep/i }).first();
    await expect(upgradeLink).toBeVisible({ timeout: 5000 });
    await upgradeLink.click();
    await page.waitForURL(/\/billing/, { timeout: 10000 });

    // Verify the utm tag is attached so analytics can attribute the conversion.
    expect(page.url()).toContain("/billing");
    expect(page.url()).toMatch(/utm_source=journey_done|utm_source=journey_done|step5_tile/);
  });
});
