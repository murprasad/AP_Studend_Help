/**
 * Pass Probability formula — 12 unit tests covering the canonical input
 * shapes. Should pass deterministically without any DB or network.
 */
import { describe, it, expect } from "vitest";
import { computePassProbability, passThresholdForCourse } from "../../src/lib/pass-probability";

const NOW = new Date("2026-05-28T00:00:00Z");
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 86400000);
}

describe("pass-probability v1.0", () => {
  it("1. Fresh user with no data returns null + 0 sampleSize", () => {
    const r = computePassProbability({
      recentMocks: [],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(r.passProbability).toBeNull();
    expect(r.confidenceInterval).toBeNull();
    expect(r.sampleSize).toBe(0);
    expect(r.drivers).toEqual([]);
  });

  it("2. User below SAMPLE_SIZE_FLOOR (4 drills) returns null pp", () => {
    const r = computePassProbability({
      recentMocks: [],
      recentDrillResponses: Array(4).fill({ isCorrect: true, answeredAt: NOW }),
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(r.passProbability).toBeNull();
    expect(r.sampleSize).toBe(4);
    // Components were computed but the headline is null per PRD.
    expect(r.components.drillTerm).toBeGreaterThan(0);
  });

  it("3. Single 67% mock (Mia's scenario) gives a passing prediction", () => {
    const r = computePassProbability({
      recentMocks: [{ score: 0.67, takenAt: daysAgo(1) }],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    // sampleSize = 88 from one mock — well over floor.
    expect(r.sampleSize).toBe(88);
    expect(r.passProbability).not.toBeNull();
    expect(r.passProbability!).toBeGreaterThan(0.6);
    expect(r.confidenceInterval).toBeLessThanOrEqual(0.15);
  });

  it("4. Two recent mocks: most-recent weighted more than older", () => {
    const recentHi = computePassProbability({
      recentMocks: [{ score: 0.80, takenAt: NOW }, { score: 0.50, takenAt: daysAgo(7) }],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    const recentLo = computePassProbability({
      recentMocks: [{ score: 0.50, takenAt: NOW }, { score: 0.80, takenAt: daysAgo(7) }],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(recentHi.passProbability!).toBeGreaterThan(recentLo.passProbability!);
  });

  it("5. Drill-only user (no mocks) gets full weight on drills", () => {
    const r = computePassProbability({
      recentMocks: [],
      recentDrillResponses: Array(20).fill({ isCorrect: true, answeredAt: NOW }),
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(r.passProbability).not.toBeNull();
    expect(r.passProbability!).toBeGreaterThan(0.7);
    // Mock term should be 0; drill term carries the redistributed weight.
    expect(r.components.mockTerm).toBe(0);
    expect(r.components.drillTerm).toBeGreaterThan(0);
  });

  it("6. Mock-only user gets full weight on mocks", () => {
    const r = computePassProbability({
      recentMocks: [{ score: 0.70, takenAt: NOW }],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(r.components.drillTerm).toBe(0);
    expect(r.components.mockTerm).toBeGreaterThan(0);
  });

  it("7. Abandoned sessions penalty: 5 abandons drops pp by ~0.10 (capped)", () => {
    const clean = computePassProbability({
      recentMocks: [{ score: 0.80, takenAt: NOW }],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    const messy = computePassProbability({
      recentMocks: [{ score: 0.80, takenAt: NOW }],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 8, // 8*0.02=0.16, capped at 0.10
      passThreshold: 0.5,
    });
    expect(clean.passProbability! - messy.passProbability!).toBeCloseTo(0.10, 2);
  });

  it("8. Confidence interval shrinks as sample size grows", () => {
    const small = computePassProbability({
      recentMocks: [{ score: 0.70, takenAt: NOW }],
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    const big = computePassProbability({
      recentMocks: [
        { score: 0.70, takenAt: NOW },
        { score: 0.70, takenAt: daysAgo(7) },
        { score: 0.70, takenAt: daysAgo(14) },
      ],
      recentDrillResponses: Array(30).fill({ isCorrect: true, answeredAt: NOW }),
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(big.confidenceInterval!).toBeLessThan(small.confidenceInterval!);
  });

  it("9. Drivers: concepts ranked by deltaIfMastered, top 5 returned", () => {
    const r = computePassProbability({
      recentMocks: [{ score: 0.65, takenAt: NOW }],
      recentDrillResponses: [],
      conceptMasteries: [
        { conceptKey: "high",   mastery: 0.95 }, // already mastered — no delta
        { conceptKey: "almost", mastery: 0.69 }, // would push coverage
        { conceptKey: "weak1",  mastery: 0.40 }, // would push coverage
        { conceptKey: "weak2",  mastery: 0.30 }, // would push coverage
        { conceptKey: "weak3",  mastery: 0.20 }, // would push coverage
        { conceptKey: "weak4",  mastery: 0.10 }, // would push coverage
        { conceptKey: "weak5",  mastery: 0.05 }, // would push coverage
      ],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(r.drivers.length).toBeLessThanOrEqual(5);
    expect(r.drivers.every(d => d.deltaIfMastered > 0)).toBe(true);
    expect(r.drivers.find(d => d.conceptKey === "high")).toBeUndefined();
  });

  it("10. Pass threshold per course: SAT requires higher raw score for same pp", () => {
    const clepShape = computePassProbability({
      recentMocks: [{ score: 0.55, takenAt: NOW }], // just above CLEP threshold
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    const satShape = computePassProbability({
      recentMocks: [{ score: 0.55, takenAt: NOW }], // below SAT threshold
      recentDrillResponses: [],
      conceptMasteries: [],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.75,
    });
    expect(clepShape.passProbability!).toBeGreaterThan(satShape.passProbability!);
  });

  it("11. Course-specific pass threshold helper", () => {
    expect(passThresholdForCourse("CLEP_INTRODUCTORY_SOCIOLOGY")).toBe(0.5);
    expect(passThresholdForCourse("DSST_PERSONAL_FINANCE")).toBe(0.5);
    expect(passThresholdForCourse("SAT_READING_WRITING")).toBe(0.75);
    expect(passThresholdForCourse("PSAT_MATH")).toBe(0.75);
    expect(passThresholdForCourse("ACT_ENGLISH")).toBe(0.65);
    expect(passThresholdForCourse("AP_BIOLOGY")).toBe(0.60);
    expect(passThresholdForCourse("UNKNOWN_X")).toBe(0.60);
  });

  it("12. Concept coverage awards partial credit between 0.30 and 0.70 mastery (gradient, not step)", () => {
    // 2026-06-01 (v1.1) — was a step function bug: students mid-journey at
    // 0.65 mastery got 0 coverage credit, same as 0% mastery. Now a 0.65-mastery
    // student gets partial credit reflecting their progress.
    const r = computePassProbability({
      recentMocks: [{ score: 0.70, takenAt: NOW }],
      recentDrillResponses: [],
      conceptMasteries: [
        { conceptKey: "a", mastery: 0.40 }, // 0.25 credit (in ramp)
        { conceptKey: "b", mastery: 0.50 }, // 0.50 credit (in ramp)
        { conceptKey: "c", mastery: 0.65 }, // 0.875 credit (in ramp)
      ],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    // Expected: avg of (0.25, 0.50, 0.875) ≈ 0.542; coverageTerm = 0.1 * 0.542 ≈ 0.054
    expect(r.components.coverageTerm).toBeGreaterThan(0.04);
    expect(r.components.coverageTerm).toBeLessThan(0.07);
    expect(r.drivers.length).toBeGreaterThan(0);
  });

  it("12b. Mastery below 0.30 still contributes 0 to coverage", () => {
    const r = computePassProbability({
      recentMocks: [{ score: 0.70, takenAt: NOW }],
      recentDrillResponses: [],
      conceptMasteries: [
        { conceptKey: "a", mastery: 0.20 },
        { conceptKey: "b", mastery: 0.10 },
        { conceptKey: "c", mastery: 0.00 },
      ],
      abandonedSessionsLast7d: 0,
      passThreshold: 0.5,
    });
    expect(r.components.coverageTerm).toBe(0);
  });
});
