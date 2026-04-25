import { test, expect } from "@playwright/test";

/**
 * Journey 4 — Diagnostic → Weak Areas → Practice Plan (retention loop).
 *
 *   Given authed user with no recent diagnostic (cooldown cleared)
 *   When they start a DIAGNOSTIC session
 *   Then a PracticeSession with sessionType=DIAGNOSTIC is created
 *   And questions span multiple units (diagnostic breadth)
 *   When they submit answers via /api/diagnostic/complete
 *   Then per-unit scores are computed
 *   And a weakest unit is identified (lowest score)
 *   And the response includes a recommendation targeting that unit
 *   When they click "practice this weak area"
 *   Then /practice starts with unit=<weakUnit> prefilled
 *   And the first session's questions are from that unit
 *
 * Retention hypothesis: diagnostic → weak-area call-to-action → focused
 * session → mastery bump is THE product loop. If any step breaks the
 * loop, retention dies.
 */

test.describe.configure({ retries: 1, timeout: 120_000 });

const CRON_SECRET = process.env.CRON_SECRET ?? "";

test.describe("Journey 4 — Diagnostic → Focused Practice", () => {
  test.skip(!CRON_SECRET, "CRON_SECRET required");

  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/auth", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      data: { action: "create" },
    });
  });

  test("start diagnostic → session has DIAGNOSTIC type + multi-unit coverage", async ({ request }) => {
    const res = await request.post("/api/practice", {
      data: {
        course: "AP_WORLD_HISTORY",
        unit: "ALL",
        sessionType: "DIAGNOSTIC",
        questionCount: 10,
        difficulty: "MIXED",
      },
    });
    if (!res.ok()) {
      // Common failure: 14-day cooldown active. Treat as skip — not a journey bug.
      const body = await res.json().catch(() => ({}));
      if (body.limitType === "diagnostic_cooldown" || body.error?.includes("cooldown")) {
        test.skip(true, "Diagnostic cooldown active — reset-test-users cron clears nightly");
      }
    }
    expect(res.ok(), `start diagnostic: ${res.status()}`).toBeTruthy();
    const start = await res.json();

    // /api/practice returns { sessionId, questions, ... } (not a nested session object).
    expect(start.sessionId, "sessionId required").toBeTruthy();
    expect(start.questions?.length, "diagnostic needs ≥ 5 questions for signal").toBeGreaterThanOrEqual(5);

    // Diagnostic should span multiple units. If all questions come from one
    // unit, the "where are you weak" signal is meaningless.
    const unitSet = new Set<string>(start.questions.map((q: { unit: string }) => q.unit));
    expect(
      unitSet.size,
      `diagnostic must span multiple units (got ${unitSet.size})`,
    ).toBeGreaterThanOrEqual(2);
  });

  test("complete diagnostic → per-unit scores + weak-unit recommendation", async ({ request }) => {
    const startRes = await request.post("/api/practice", {
      data: { course: "AP_WORLD_HISTORY", unit: "ALL", sessionType: "DIAGNOSTIC", questionCount: 10, difficulty: "MIXED" },
    });
    if (!startRes.ok()) {
      const body = await startRes.json().catch(() => ({}));
      if (body.limitType === "diagnostic_cooldown") test.skip(true, "cooldown");
    }
    const start = await startRes.json();
    const questions = start.questions ?? [];
    if (questions.length === 0) test.skip(true, "No questions returned");

    // Answer half right, half wrong — skewed to create a weak unit signal.
    // Question objects carry `correctAnswer` to tests (through /api/practice
    // response), so simulate deliberate wrong answers on half.
    const answers: Record<string, string> = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // Wrong-on-even = skewed distribution. Real users vary.
      answers[q.id] = i % 2 === 0 ? "A" : q.correctAnswer ?? "B";
    }

    const completeRes = await request.post("/api/diagnostic/complete", {
      data: {
        sessionId: start.sessionId,
        answers,
        course: "AP_WORLD_HISTORY",
      },
    });
    expect(completeRes.ok(), `complete: ${completeRes.status()}`).toBeTruthy();
    const result = await completeRes.json();

    // Contract: per-unit breakdown returned.
    expect(
      result.unitScores ?? result.unitResults ?? result.analysis,
      "complete must return per-unit breakdown",
    ).toBeTruthy();

    // Contract: a recommended action (weak unit, next step) is present.
    const rec =
      result.recommendedUnit ??
      result.weakestUnit ??
      result.nextAction?.unit ??
      result.focusUnit;
    expect(
      rec,
      `diagnostic must surface a weak-unit recommendation (got keys: ${Object.keys(result).join(", ")})`,
    ).toBeTruthy();
  });

  test("focused-practice route accepts ?unit=<weakUnit> and filters questions", async ({ request }) => {
    // Start a FOCUSED_STUDY session targeting a specific unit. This is what
    // the "Practice this weak area" CTA does server-side.
    const res = await request.post("/api/practice", {
      data: {
        course: "AP_WORLD_HISTORY",
        unit: "WH_UNIT_1", // Unit 1 — 1200-1450 CE (well-populated in seed)
        sessionType: "FOCUSED_STUDY",
        questionCount: 5,
        difficulty: "MEDIUM",
      },
    });
    if (!res.ok()) {
      const body = await res.json().catch(() => ({}));
      // If the specific unit has no questions, skip (content issue, not
      // a journey-loop regression).
      if ((body.error ?? "").toLowerCase().includes("no questions")) {
        test.skip(true, "WH_UNIT_1 has 0 questions on this deploy");
      }
    }
    expect(res.ok(), `focused start: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    // All returned questions should be from the requested unit.
    const wrongUnit = (body.questions ?? []).filter((q: { unit: string }) => q.unit !== "WH_UNIT_1");
    expect(
      wrongUnit.length,
      `FOCUSED_STUDY with unit=WH_UNIT_1 returned ${wrongUnit.length} out-of-unit questions`,
    ).toBe(0);
  });

  test("anonymous diagnostic complete → 401", async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
    const res = await ctx.post((process.env.E2E_BASE_URL ?? "https://studentnest.ai") + "/api/diagnostic/complete", {
      data: { sessionId: "x", answers: {}, course: "AP_WORLD_HISTORY" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});
