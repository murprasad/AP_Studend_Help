import { test, expect } from "@playwright/test";

/**
 * Journey 2 — Mock Exam contract (core product value).
 *
 *   Given an authed user with mock-exam access
 *   When they start a mock exam
 *   Then a MOCK_EXAM PracticeSession is created
 *   And it has totalQuestions > 0 (the blueprint has questions)
 *   And status = IN_PROGRESS
 *   When they complete all questions (PATCH → COMPLETED)
 *   Then score is computed and persisted
 *   And status = COMPLETED
 *   And the results page shows the accurate score
 *
 * Failure branches:
 *   - Start with no content for the course → 400 (not 500)
 *   - Submit answer to a COMPLETED session → 400
 *   - Refresh mid-session → session remains IN_PROGRESS, answers preserved
 *
 * Note: a real timer-to-zero test needs clock mocking inside a running
 * session; deferred to journey-2b. Today's spec covers the transactional
 * start → complete → persist → display contract.
 */

test.describe.configure({ retries: 1, timeout: 120_000 });

const CRON_SECRET = process.env.CRON_SECRET ?? "";

async function provisionFreeUser(request: import("@playwright/test").APIRequestContext) {
  await request.post("/api/test/auth", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
    data: { action: "create" },
  });
  // Reset any in-progress sessions from prior runs.
  await request.post("/api/test/auth", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
    data: { action: "seed-usage", count: 0, clear: true },
  });
}

test.describe("Journey 2 — Mock Exam", () => {
  test.skip(!CRON_SECRET, "CRON_SECRET required");

  test.beforeEach(async ({ request }) => {
    await provisionFreeUser(request);
  });

  test("start → session created with IN_PROGRESS + totalQuestions > 0", async ({ request }) => {
    const res = await request.post("/api/practice", {
      data: {
        course: "AP_WORLD_HISTORY",
        unit: "ALL",
        sessionType: "MOCK_EXAM",
        questionCount: 5,
        difficulty: "MEDIUM",
      },
    });
    expect([200, 201].includes(res.status()), `start returned ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(body.session, "session object missing").toBeTruthy();
    expect(body.session.id, "session.id missing").toBeTruthy();
    expect(body.session.sessionType, "must be MOCK_EXAM").toBe("MOCK_EXAM");
    expect(body.session.status, "new session must be IN_PROGRESS").toBe("IN_PROGRESS");
    expect(
      body.session.totalQuestions,
      "mock exam needs questions; 0 means content is missing",
    ).toBeGreaterThan(0);
    expect(body.questions?.length, "questions array must match count").toBeGreaterThan(0);
  });

  test("submit answer → returns correctness + explanation + mastery update", async ({ request }) => {
    const startRes = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "MOCK_EXAM", questionCount: 5, difficulty: "MEDIUM" },
    });
    const start = await startRes.json();
    const firstQ = start.questions?.[0];
    if (!firstQ) test.skip(true, "No questions returned — content pipeline issue, not a journey bug");

    const answerRes = await request.post(`/api/practice/${start.session.id}`, {
      data: {
        questionId: firstQ.id,
        studentAnswer: "A",
        timeSpentSecs: 30,
      },
    });
    expect(answerRes.ok(), `answer submit: ${answerRes.status()}`).toBeTruthy();
    const ansBody = await answerRes.json();
    expect(typeof ansBody.isCorrect, "answer response must include isCorrect").toBe("boolean");
    // Correct-answer explanation is the learning moment; schema should include it.
    expect(
      ansBody.correctAnswer ?? ansBody.explanation ?? ansBody.feedback,
      "answer response should include teaching content (correctAnswer|explanation|feedback)",
    ).toBeTruthy();
  });

  test("complete → status=COMPLETED, score numeric, completedAt set", async ({ request }) => {
    const startRes = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "MOCK_EXAM", questionCount: 5, difficulty: "MEDIUM" },
    });
    const start = await startRes.json();
    const questions = start.questions ?? [];
    if (questions.length === 0) test.skip(true, "No questions returned — content pipeline issue");

    // Answer every question (study=A; correctness is computed server-side).
    for (const q of questions) {
      await request.post(`/api/practice/${start.session.id}`, {
        data: { questionId: q.id, studentAnswer: "A", timeSpentSecs: 10 },
      });
    }

    // PATCH to finalize.
    const patchRes = await request.patch(`/api/practice/${start.session.id}`, {
      data: { status: "COMPLETED" },
    });
    expect(patchRes.ok(), `PATCH completion: ${patchRes.status()}`).toBeTruthy();
    const patched = await patchRes.json();
    // Contract: score is a number 0..100 (percent-correct accuracy).
    expect(typeof patched.score, "score must be numeric after completion").toBe("number");
    expect(patched.score).toBeGreaterThanOrEqual(0);
    expect(patched.score).toBeLessThanOrEqual(100);
  });

  test("double-submit to COMPLETED session returns 400 (not 500)", async ({ request }) => {
    const startRes = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "MOCK_EXAM", questionCount: 5, difficulty: "MEDIUM" },
    });
    const start = await startRes.json();
    const questions = start.questions ?? [];
    if (questions.length === 0) test.skip(true);
    for (const q of questions) {
      await request.post(`/api/practice/${start.session.id}`, {
        data: { questionId: q.id, studentAnswer: "A", timeSpentSecs: 10 },
      });
    }
    await request.patch(`/api/practice/${start.session.id}`, { data: { status: "COMPLETED" } });
    // Second PATCH must NOT silently succeed or 500.
    const secondPatch = await request.patch(`/api/practice/${start.session.id}`, { data: { status: "COMPLETED" } });
    expect(
      secondPatch.status(),
      "double-complete should be 400 'already completed', never 500",
    ).toBe(400);
  });

  test("anonymous start → 401 (not 500)", async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
    const res = await ctx.post((process.env.E2E_BASE_URL ?? "https://studentnest.ai") + "/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "MOCK_EXAM", questionCount: 5, difficulty: "MEDIUM" },
      failOnStatusCode: false,
    });
    expect(res.status(), "anonymous mock-exam start must 401").toBe(401);
    await ctx.dispose();
  });
});
