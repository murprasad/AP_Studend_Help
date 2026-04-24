import { describe, it, expect } from "vitest";
import { predictApScore, type ScoreInput } from "../../src/lib/score-predictors/ap";

/**
 * AP Score predictor accuracy tests (user request: "AP score calculation accuracy").
 *
 * Locks the scaling function + confidence + composite weighting behavior in
 * src/lib/score-predictors/ap.ts so silent drift (e.g. someone adjusting
 * weights during a UX tweak) gets caught by CI.
 *
 * Expected behavior (from source — DEFAULT_CUTOFFS = { s5:70, s4:55, s3:40, s2:25 }):
 *   rawPercent ≥ 70 → 5
 *   55 ≤ raw < 70  → 4
 *   40 ≤ raw < 55  → 3 (passing)
 *   25 ≤ raw < 40  → 2
 *   raw < 25       → 1
 *
 * Composite (with mock):  0.4·mastery + 0.3·recent + 0.3·mock
 * Composite (no mock):    min(85, 0.6·mastery + 0.4·recent)
 * Low-signal (<20 answers, no mock): returns mastery as-is.
 */

const mockMastery = (pct: number) => [
  { unit: "UNIT_1", masteryScore: pct, totalAttempts: 10 },
  { unit: "UNIT_2", masteryScore: pct, totalAttempts: 10 },
];

function baseInput(): ScoreInput {
  return {
    masteryData: mockMastery(60),
    bestMockPercent: 60,
    recentAccuracy: 60,
    totalSessions: 5,
    totalAnswered: 100,
  };
}

describe("predictApScore — scaling", () => {
  it("maps rawPercent 80 to scaled 5", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(80), bestMockPercent: 80, recentAccuracy: 80 });
    expect(r.scaledScore).toBe(5);
  });

  it("maps rawPercent 60 to scaled 4", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(60), bestMockPercent: 60, recentAccuracy: 60 });
    expect(r.scaledScore).toBe(4);
  });

  it("maps rawPercent 45 to scaled 3 (passing)", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(45), bestMockPercent: 45, recentAccuracy: 45 });
    expect(r.scaledScore).toBe(3);
  });

  it("maps rawPercent 30 to scaled 2", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(30), bestMockPercent: 30, recentAccuracy: 30 });
    expect(r.scaledScore).toBe(2);
  });

  it("maps rawPercent 10 to scaled 1", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(10), bestMockPercent: 10, recentAccuracy: 10 });
    expect(r.scaledScore).toBe(1);
  });

  it("boundary: 70.0 is a 5, 69.9 is a 4", () => {
    const a = predictApScore({ ...baseInput(), masteryData: mockMastery(70), bestMockPercent: 70, recentAccuracy: 70 });
    const b = predictApScore({ ...baseInput(), masteryData: mockMastery(69), bestMockPercent: 70, recentAccuracy: 69 });
    expect(a.scaledScore).toBe(5);
    expect(b.scaledScore).toBe(4);
  });
});

describe("predictApScore — weighting", () => {
  it("with-mock: composite = 0.4*mastery + 0.3*recent + 0.3*mock", () => {
    // 0.4*50 + 0.3*40 + 0.3*60 = 20 + 12 + 18 = 50
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(50), bestMockPercent: 60, recentAccuracy: 40 });
    expect(r.rawPercent).toBe(50);
    expect(r.scaledScore).toBe(3);
  });

  it("no-mock: composite = 0.6*mastery + 0.4*recent, capped at 85", () => {
    // 0.6*100 + 0.4*100 = 100, but capped to 85 without mock
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(100), bestMockPercent: null, recentAccuracy: 100 });
    expect(r.rawPercent).toBe(85);
    expect(r.scaledScore).toBe(5);
  });

  it("cap prevents a 'no-mock 5 with 86%+ effort'", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(95), bestMockPercent: null, recentAccuracy: 90 });
    expect(r.rawPercent).toBe(85); // capped
  });
});

describe("predictApScore — low signal guard", () => {
  it("returns mastery-only when <20 answered and no mock", () => {
    const r = predictApScore({
      masteryData: mockMastery(75),
      bestMockPercent: null,
      recentAccuracy: 90,   // intentionally noisy
      totalSessions: 1,
      totalAnswered: 10,
    });
    expect(r.rawPercent).toBe(75);
  });

  it("applies full composite once totalAnswered >= 20", () => {
    const r = predictApScore({
      masteryData: mockMastery(60),
      bestMockPercent: null,
      recentAccuracy: 40,
      totalSessions: 2,
      totalAnswered: 20,
    });
    // 0.6*60 + 0.4*40 = 36 + 16 = 52 (below cap)
    expect(r.rawPercent).toBe(52);
  });

  it("confidence=low when no mock and <30 answered", () => {
    const r = predictApScore({ ...baseInput(), bestMockPercent: null, totalAnswered: 25 });
    expect(r.confidence).toBe("low");
  });

  it("confidence=medium with either >=30 answered or a mock", () => {
    const r = predictApScore({ ...baseInput(), totalAnswered: 30, bestMockPercent: null });
    expect(r.confidence).toBe("medium");
  });

  it("confidence=high with >=100 answered AND a mock", () => {
    const r = predictApScore({ ...baseInput(), totalAnswered: 100, bestMockPercent: 60 });
    expect(r.confidence).toBe("high");
  });
});

describe("predictApScore — distanceToThree", () => {
  it("is 0 when already at a 3", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(45), bestMockPercent: 45, recentAccuracy: 45 });
    expect(r.distanceToThree).toBe(0);
  });

  it("equals cutoff − rawPercent when below 3", () => {
    const r = predictApScore({ ...baseInput(), masteryData: mockMastery(30), bestMockPercent: 30, recentAccuracy: 30 });
    expect(r.rawPercent).toBe(30);
    expect(r.distanceToThree).toBe(10); // 40 - 30
  });
});

describe("predictApScore — boundary edges", () => {
  it("empty masteryData treats avgMastery as 0 (low-signal path)", () => {
    const r = predictApScore({
      masteryData: [],
      bestMockPercent: null,
      recentAccuracy: 80,
      totalSessions: 0,
      totalAnswered: 0,
    });
    expect(r.rawPercent).toBe(0);
    expect(r.scaledScore).toBe(1);
  });

  it("all 0s → scaled 1", () => {
    // Note: confidence is "medium" because bestMockPercent=0 is treated as
    // a mock that was actually taken (just scored poorly). A value of null
    // would yield "low". Product-review candidate: should a 0% mock
    // downgrade confidence? Today the answer is no.
    const r = predictApScore({
      masteryData: mockMastery(0),
      bestMockPercent: 0,
      recentAccuracy: 0,
      totalSessions: 0,
      totalAnswered: 0,
    });
    expect(r.scaledScore).toBe(1);
    expect(r.confidence).toBe("medium");
  });

  it("custom cutoffs override defaults", () => {
    // Harder cutoffs simulating AP Physics 1
    const hard = { s5: 75, s4: 60, s3: 45, s2: 30 };
    const r = predictApScore(
      { ...baseInput(), masteryData: mockMastery(70), bestMockPercent: 70, recentAccuracy: 70 },
      hard,
    );
    expect(r.rawPercent).toBe(70);
    // 70 ≥ s4 (60) but < s5 (75) → scaled 4 under hard cutoffs (5 under default)
    expect(r.scaledScore).toBe(4);
  });
});
