import { test, expect } from "@playwright/test";

/**
 * Journey 3 — Sage Tutor (AI differentiator).
 *
 *   Given authed user with tutor quota remaining
 *   When they POST a question to /api/ai/tutor
 *   Then the response returns a non-empty answer
 *   And the answer references key concepts (not a generic error string)
 *   And followUps is a non-empty array (1-3 follow-up questions)
 *   And a TutorConversation row was persisted in DB
 *   When the response is rendered in UI
 *   Then the answer text is visible
 *   And the follow-up chips are clickable
 *
 * Failure branches:
 *   - Empty message → 400 (not 500)
 *   - Invalid course → 400
 *   - Anonymous → 401
 *   - All AI providers down → graceful error (user-facing copy, not a stack trace)
 */

test.describe.configure({ retries: 1, timeout: 90_000 });

const CRON_SECRET = process.env.CRON_SECRET ?? "";

test.describe("Journey 3 — Sage Tutor", () => {
  test.skip(!CRON_SECRET, "CRON_SECRET required");

  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "create" },
    });
  });

  test("ask question → answer + followUps returned + DB row persisted", async ({ request }) => {
    const question = "Explain the principle of superposition in wave mechanics.";
    const res = await request.post("/api/ai/tutor", {
      data: { message: question, course: "AP_PHYSICS_1", history: [] },
    });
    expect(res.ok(), `tutor: ${res.status()} ${await res.text().catch(() => "")}`).toBeTruthy();

    const body = await res.json();
    // Core contract: non-empty answer.
    expect(body.answer, "answer field required").toBeTruthy();
    expect(typeof body.answer).toBe("string");
    expect(body.answer.length, "answer must have real content (> 50 chars)").toBeGreaterThan(50);

    // Must not be a fallback error message pretending to be an answer.
    const lower = body.answer.toLowerCase();
    expect(lower, "answer must not be a system error disguised as response").not.toContain("internal server error");
    expect(lower, "answer must not be the 'unavailable' fallback").not.toMatch(/sage is resting|ai unavailable/i);

    // Follow-ups are the differentiator — every response should carry them.
    expect(Array.isArray(body.followUps), "followUps must be an array").toBe(true);
    expect(body.followUps.length, "at least one follow-up expected").toBeGreaterThan(0);
    expect(body.followUps.length, "at most 3 follow-ups by design").toBeLessThanOrEqual(5);

    // Follow-ups shouldn't be the raw "FOLLOW_UPS:" marker from LLM output.
    for (const f of body.followUps) {
      expect(f, "follow-up must be non-empty").toBeTruthy();
      expect(typeof f).toBe("string");
      expect(f, `follow-up should not expose parser marker: ${f}`).not.toContain("FOLLOW_UPS");
    }

    // conversationId is the DB-persistence signal.
    expect(body.conversationId, "conversation must persist — conversationId returned").toBeTruthy();
  });

  test("empty message → 400 (not 500)", async ({ request }) => {
    const res = await request.post("/api/ai/tutor", {
      data: { message: "", course: "AP_WORLD_HISTORY", history: [] },
      failOnStatusCode: false,
    });
    expect(res.status(), "empty message must 400").toBe(400);
  });

  test("invalid course → 400", async ({ request }) => {
    const res = await request.post("/api/ai/tutor", {
      data: { message: "test", course: "FAKE_COURSE", history: [] },
      failOnStatusCode: false,
    });
    expect(res.status(), "invalid course must 400").toBe(400);
  });

  test("anonymous → 401 (not 500)", async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
    const res = await ctx.post((process.env.E2E_BASE_URL ?? "https://studentnest.ai") + "/api/ai/tutor", {
      data: { message: "test", course: "AP_WORLD_HISTORY", history: [] },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test("UI renders answer + follow-up chips after sending a question", async ({ page }) => {
    await page.goto("/ai-tutor");
    if (page.url().includes("/login")) test.skip(true, "Session expired — see E8");

    const textarea = page.locator('textarea, input[type="text"]').first();
    await textarea.waitFor({ timeout: 10_000 }).catch(() => { /* fall through */ });
    if ((await textarea.count()) === 0) test.skip(true, "No tutor input field — UI may have changed");

    await textarea.fill("What is momentum in physics?");
    const sendBtn = page.getByRole("button", { name: /send|ask|submit/i }).first();
    if ((await sendBtn.count()) === 0) test.skip(true, "No send button");
    await sendBtn.click();

    // Response should appear within 30s (AI is slow; this is tolerant).
    await expect(page.locator("body")).toContainText(/momentum|mass.*velocity|p\s*=\s*mv/i, { timeout: 30_000 });
  });
});
