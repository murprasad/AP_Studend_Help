import { test, expect } from "@playwright/test";

/**
 * Persona B — Returning user clicks every sidebar item.
 *
 * Matrix 10.4 — returning user × tier. For each sidebar item on the
 * shared test-user fixture, assert:
 *   1. Page loads with status < 400
 *   2. Does not 500 anywhere in its network graph
 *   3. Renders expected heading / content (copy anchor)
 *   4. No unhandled rejections / console errors (soft — some pages emit
 *      warnings we don't block on yet)
 *
 * Fixture: shared authed test user (provisioned by auth.setup.ts with
 *   onboardingCompletedAt set + onboarding_completed localStorage flag).
 *
 * Test user tier varies (reset-test-users cron runs post-deploy). Specs
 * below DO NOT assume free vs premium — they only assert the page works.
 * Dedicated limit-hit / paywall-visibility specs live elsewhere.
 */

test.describe.configure({ retries: 2, timeout: 45_000 });

const SIDEBAR_PATHS: Array<{ path: string; mustContain: RegExp; mustNot?: RegExp }> = [
  { path: "/dashboard",    mustContain: /dashboard|today|streak|goal|practice/i },
  { path: "/practice",     mustContain: /practice|question|start|course/i },
  { path: "/flashcards",   mustContain: /flashcard|show answer|no flashcards/i },
  { path: "/diagnostic",   mustContain: /diagnostic|start|assessment/i },
  { path: "/mock-exam",    mustContain: /mock|exam|timer|question/i },
  { path: "/frq-practice", mustContain: /frq|free.?response|essay|written|premium|upgrade/i },
  { path: "/ai-tutor",     mustContain: /tutor|sage|ask|chat|message/i },
  { path: "/sage-coach",   mustContain: /sage|coach|plan|week|study/i },
  { path: "/community",    mustContain: /community|discussion|thread|post/i },
  { path: "/analytics",    mustContain: /analytics|progress|mastery|accuracy|score/i },
  { path: "/study-plan",   mustContain: /plan|study|week|schedule/i },
  { path: "/resources",    mustContain: /resource|library|video|reading|book|material/i },
  { path: "/billing",      mustContain: /plan|billing|subscription|premium|free|upgrade/i },
];

for (const { path, mustContain, mustNot } of SIDEBAR_PATHS) {
  test(`${path} — loads, shows expected content, no 5xx in network graph`, async ({ page }) => {
    const fivexx: Array<{ url: string; status: number }> = [];
    const pageErrors: string[] = [];
    page.on("response", (r) => {
      if (r.status() >= 500) fivexx.push({ url: r.url(), status: r.status() });
    });
    page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));

    const res = await page.goto(path, { waitUntil: "domcontentloaded" });

    // Middleware may bounce a brand-new test user to /onboarding — if so,
    // the auth.setup already set the cookie/localStorage flag; a bounce
    // here means that flag didn't stick. Tolerated (skip, not fail) because
    // auth.setup has a race-sensitive window.
    if (page.url().includes("/onboarding") && path !== "/onboarding") {
      test.skip(true, `${path} bounced to /onboarding — test fixture not primed`);
    }

    expect(res?.status(), `${path} returned ${res?.status()}`).toBeLessThan(400);

    const body = await page.locator("body").innerText();

    // Copy anchor — at least one expected phrase must be present
    expect(body, `${path}: expected text matching ${mustContain} on page`).toMatch(mustContain);

    // Negative pattern (rarely set)
    if (mustNot) {
      expect(body, `${path}: must not contain ${mustNot}`).not.toMatch(mustNot);
    }

    // Never a stack trace / error boundary fallback
    expect(body.toLowerCase()).not.toContain("application error");
    expect(body.toLowerCase()).not.toContain("internal server error");

    // No 5xx network responses
    expect(
      fivexx,
      `${path}: 5xx responses:\n${fivexx.map((e) => `  ${e.status} ${e.url}`).join("\n")}`,
    ).toEqual([]);

    // No unhandled rejections
    expect(pageErrors, `${path}: unhandled rejections:\n${pageErrors.join("\n")}`).toEqual([]);
  });
}
