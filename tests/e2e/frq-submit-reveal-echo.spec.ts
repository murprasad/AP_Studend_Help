import { test, expect, request as apiRequest } from "@playwright/test";

/**
 * E2E gate for FRQ submit→reveal echo (Beta 9.0.6 fix).
 *
 * The bug: rubric stored as flat array `[{step:..., keywords:...}]` but
 * parser expected `{subParts: [...]}`. Result: rubric.subParts parsed to
 * empty, SaqInput fell back to a hardcoded A/B/C scaffold (so user could
 * type), but SaqReveal had empty rubric.subParts → labels list empty →
 * StudentAnswerEcho displayed "(no answer recorded)" despite DB having
 * the user's content.
 *
 * This test walks the real flow: navigate to /frq-practice, click an SAQ
 * card, type 100+ chars, click reveal, assert "Your answer" section
 * echoes the typed text and "(no answer recorded)" is NOT visible.
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe.configure({ retries: 2, timeout: 90_000 });

test.describe("FRQ submit → reveal echo (Beta 9.0.6)", () => {
  test.beforeEach(async ({ baseURL }) => {
    if (!CRON_SECRET) test.skip();
    // Set onboarding_completed cookie via API so middleware bridges /frq-practice
    // (test fixture has stale-JWT-style state where DB has date but JWT is null
    // for the test runner user — same shape as a real user mid-flow).
    const api = await apiRequest.newContext();
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "complete-onboarding" },
    });
    await api.dispose();
  });

  test("SAQ submit echoes typed answer (NOT 'no answer recorded')", async ({ page, baseURL }) => {
    // Plant the bridge cookie so middleware lets us reach /frq-practice
    // even with a stale JWT (matches real-user state after quickstart).
    await page.context().addCookies([{
      name: "onboarding_completed",
      value: "true",
      domain: new URL(baseURL ?? "https://studentnest.ai").hostname,
      path: "/",
      secure: true,
      sameSite: "Lax",
    }]);

    await page.goto(`${baseURL}/frq-practice?course=AP_WORLD_HISTORY`, { waitUntil: "domcontentloaded" });
    expect(page.url(), "should not bounce to quickstart").not.toContain("/practice/quickstart");

    // Wait for FRQ list to load — look for any year-Q# button
    await page.locator('button').filter({ hasText: /\d{4}\s*Q\d+/ }).first().waitFor({ state: "visible", timeout: 30000 });

    // Find the FIRST SAQ-type card (filter by inner text containing "SAQ" badge)
    const allCards = await page.locator('button').filter({ hasText: /\d{4}\s*Q\d+/ }).all();
    let saqCard = null;
    for (const c of allCards) {
      const txt = await c.innerText();
      if (txt.includes("SAQ")) { saqCard = c; break; }
    }
    expect(saqCard, "no SAQ card available in AP_WORLD_HISTORY list").not.toBeNull();
    await saqCard!.click();

    // Wait for FrqPracticeCard to fetch + render textareas (SAQ has 3)
    await page.locator('textarea').first().waitFor({ state: "visible", timeout: 30000 });
    const taCount = await page.locator('textarea').count();
    expect(taCount, "SAQ should render 3 sub-part textareas").toBe(3);

    // Type a substantive answer (>100 chars) into Part A textarea
    const TEST_ANSWER = "This is a test answer that demonstrates one specific historical example of cultural exchange in the period before 1450, intentionally over 100 characters so the min-char validation passes and the reveal page is reached.";
    await page.locator('textarea').first().fill(TEST_ANSWER);

    // Click "Reveal rubric & sample response"
    await page.getByRole("button", { name: /reveal/i }).click();

    // Wait for the reveal section to render
    await page.locator('text=/your answer/i').first().waitFor({ state: "visible", timeout: 15000 });

    // KEY ASSERTION: typed text appears in body, "(no answer recorded)" does NOT
    const bodyText = await page.locator("body").innerText();
    expect(bodyText, "reveal must NOT show '(no answer recorded)' fallback").not.toContain("(no answer recorded)");
    expect(bodyText, "reveal must echo first 50 chars of typed answer").toContain(TEST_ANSWER.slice(0, 50));
  });
});
