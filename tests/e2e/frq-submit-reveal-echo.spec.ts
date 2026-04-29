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
    const api = await apiRequest.newContext();
    // Mark DB onboarded so middleware allows /frq-practice
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "complete-onboarding" },
    });
    // CRITICAL: clear prior FRQ attempts so the page renders the INPUT
    // phase (not the auto-revealed state from a previous attempt).
    await api.post(`${baseURL}/api/test/auth`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
      data: { action: "clear-frq-attempts" },
    });
    await api.dispose();
  });

  test("SAQ submit echoes typed answer (NOT 'no answer recorded')", async ({ page, baseURL }) => {
    const consoleLogs: string[] = [];
    page.on("console", (msg) => { consoleLogs.push(`[${msg.type()}] ${msg.text()}`); });
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

    // Wait for the reveal section to render. After submit:
    //   - input textareas disappear
    //   - "Your answer" + rubric checklist appear
    //   - "Reveal rubric" button is replaced by "Next FRQ"
    // Wait for the visual transition (rubric checklist) — most reliable.
    await page.locator('text=/Official rubric/i').first().waitFor({ state: "visible", timeout: 20000 });
    // Extra settle time for studentAnswers state to populate the echo
    await page.waitForTimeout(1500);

    // KEY ASSERTION: typed text appears in body, "(no answer recorded)" does NOT
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("(no answer recorded)")) {
      console.log("\n--- console logs from page ---");
      for (const l of consoleLogs.filter((l) => l.includes("FrqPracticeCard"))) {
        console.log(l);
      }
      console.log("--- end console logs ---\n");
    }
    expect(bodyText, "reveal must NOT show '(no answer recorded)' fallback").not.toContain("(no answer recorded)");
    expect(bodyText, "reveal must echo first 50 chars of typed answer").toContain(TEST_ANSWER.slice(0, 50));
  });

  test("Reload after prior submission rehydrates the typed answer (Beta 9.0.7)", async ({ page, baseURL }) => {
    // This is the EXACT bug the user reported: submit once, navigate
    // away, come back, and reveal echo shows '(no answer recorded)'.
    // /api/frq/[id] auto-unlocks reveal but never returned latestAttempt
    // until 9.0.7. Now it does, and FrqPracticeCard rehydrates
    // studentAnswers from it.
    await page.context().addCookies([{
      name: "onboarding_completed",
      value: "true",
      domain: new URL(baseURL ?? "https://studentnest.ai").hostname,
      path: "/",
      secure: true,
      sameSite: "Lax",
    }]);

    // Step 1: navigate, find SAQ, submit content
    await page.goto(`${baseURL}/frq-practice?course=AP_WORLD_HISTORY`, { waitUntil: "domcontentloaded" });
    await page.locator('button').filter({ hasText: /\d{4}\s*Q\d+/ }).first().waitFor({ state: "visible", timeout: 30000 });
    const cards = await page.locator('button').filter({ hasText: /\d{4}\s*Q\d+/ }).all();
    let saqCard = null;
    let saqId: string | null = null;
    for (const c of cards) {
      const txt = await c.innerText();
      if (txt.includes("SAQ")) { saqCard = c; break; }
    }
    expect(saqCard, "no SAQ card available").not.toBeNull();
    await saqCard!.click();
    await page.locator('textarea').first().waitFor({ state: "visible", timeout: 30000 });

    const REHYDRATE_TEST_ANSWER = "Rehydrate-test answer A: cultural exchange between nomads and merchants in pre-1450 Eurasia included Silk Road trade. This crosses the 100-character threshold required by the FRQ submit guard.";
    await page.locator('textarea').first().fill(REHYDRATE_TEST_ANSWER);
    await page.getByRole("button", { name: /reveal/i }).click();
    await page.locator('text=/your answer/i').first().waitFor({ state: "visible", timeout: 15000 });

    // Step 2: navigate away, then come back to the same FRQ
    await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.goto(`${baseURL}/frq-practice?course=AP_WORLD_HISTORY`, { waitUntil: "domcontentloaded" });
    await page.locator('button').filter({ hasText: /\d{4}\s*Q\d+/ }).first().waitFor({ state: "visible", timeout: 30000 });

    // Click the SAME first SAQ card
    const cards2 = await page.locator('button').filter({ hasText: /\d{4}\s*Q\d+/ }).all();
    let saq2 = null;
    for (const c of cards2) {
      const txt = await c.innerText();
      if (txt.includes("SAQ")) { saq2 = c; break; }
    }
    await saq2!.click();
    await page.waitForTimeout(4000); // give /api/frq/[id] time to return + rehydrate

    // Step 3: assert prior text rehydrated, no '(no answer recorded)'
    const bodyText = await page.locator("body").innerText();
    expect(bodyText, "rehydrate must NOT show '(no answer recorded)'").not.toContain("(no answer recorded)");
    expect(bodyText, "rehydrate must echo prior submission text").toContain(REHYDRATE_TEST_ANSWER.slice(0, 50));
  });
});
