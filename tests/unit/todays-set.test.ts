import { describe, it, expect } from "vitest";
import { generateTodaysSet } from "../../src/lib/todays-set";

const NOW = new Date("2026-05-28T00:00:00Z");
function daysAgo(n: number): Date { return new Date(NOW.getTime() - n * 86400000); }

function buildPool(units: string[], perUnit = 10): { id: string; unit: string; difficulty: string }[] {
  const out: { id: string; unit: string; difficulty: string }[] = [];
  for (const u of units) {
    for (let i = 0; i < perUnit; i++) out.push({ id: `${u}-q${i}`, unit: u, difficulty: "MEDIUM" });
  }
  return out;
}

describe("Today's Set generator", () => {
  it("1. Picks 12 Qs concentrated in 3 weakest units (with 20% exploration tail)", () => {
    // 2026-06-01 — v1.1: adds an EXPLORATION_RATIO tail so ~2-3 of 12 Qs
    // come from non-weak units. Without this, a user's "weakest unit" got
    // 25+ consecutive sessions of identical targeting (persona walkthrough
    // bug #4). Must seed pastResponses to bypass diagnostic-mode short-circuit.
    const r = generateTodaysSet({
      candidatePool: buildPool(["A", "B", "C", "D", "E"]),
      nowMs: NOW.getTime(),
      pastResponses: [{ questionId: "seed", isCorrect: true, confidenceSelf: 4, answeredAt: daysAgo(60) }],
      unitMasteries: [
        { unit: "A", masteryScore: 20 },
        { unit: "B", masteryScore: 40 },
        { unit: "C", masteryScore: 50 },
        { unit: "D", masteryScore: 90 },
        { unit: "E", masteryScore: 95 },
      ],
    });
    expect(r.questionIds.length).toBe(12);
    const inWeak = r.questionIds.filter(id => id.startsWith("A-") || id.startsWith("B-") || id.startsWith("C-")).length;
    // Most still weak; ~2-3 reserved for exploration of D/E
    expect(inWeak).toBeGreaterThanOrEqual(9);
    expect(inWeak).toBeLessThanOrEqual(12);
    expect(r.conceptKeys).toEqual(["unit:A", "unit:B", "unit:C"]);
  });

  it("1b. Diagnostic-mode: brand-new user with no past responses gets evenly-distributed first set", () => {
    // 2026-06-01 Bug #13 fix: targeting "weakest" is meaningless before
    // baseline data exists (every unit has the same default mastery).
    // For pastResponses === [], distribute across ALL units instead.
    const r = generateTodaysSet({
      candidatePool: buildPool(["A", "B", "C", "D", "E"]),
      nowMs: NOW.getTime(),
      pastResponses: [],
      unitMasteries: [
        { unit: "A", masteryScore: 50 },
        { unit: "B", masteryScore: 50 },
        { unit: "C", masteryScore: 50 },
        { unit: "D", masteryScore: 50 },
        { unit: "E", masteryScore: 50 },
      ],
    });
    expect(r.questionIds.length).toBe(12);
    // Should touch all 5 units, not just 3
    const unitsTouched = new Set(r.questionIds.map((id) => id.split("-")[0]));
    expect(unitsTouched.size).toBeGreaterThanOrEqual(4);
    expect(r.conceptKeys.length).toBe(5);
  });

  it("2. Skips questions answered in last 14 days", () => {
    const r = generateTodaysSet({
      candidatePool: buildPool(["A"], 30),
      nowMs: NOW.getTime(),
      pastResponses: Array.from({ length: 10 }, (_, i) => ({
        questionId: `A-q${i}`, isCorrect: true, confidenceSelf: 4, answeredAt: daysAgo(3),
      })),
      unitMasteries: [{ unit: "A", masteryScore: 40 }],
    });
    expect(r.questionIds.length).toBe(12);
    for (let i = 0; i < 10; i++) {
      expect(r.questionIds).not.toContain(`A-q${i}`);
    }
  });

  it("3. Falls back to fewer Qs when pool is thin", () => {
    const r = generateTodaysSet({
      candidatePool: buildPool(["A"], 5), // only 5 total
      nowMs: NOW.getTime(),
      pastResponses: [],
      unitMasteries: [{ unit: "A", masteryScore: 40 }],
    });
    expect(r.questionIds.length).toBe(5);
  });

  it("4. Wrong answers from 7+ days ago get top priority", () => {
    const pool = buildPool(["A"], 10);
    const r = generateTodaysSet({
      candidatePool: pool,
      nowMs: NOW.getTime(),
      pastResponses: [
        // q3 wrong 10 days ago, q5 correct yesterday (high conf)
        { questionId: "A-q3", isCorrect: false, confidenceSelf: 2, answeredAt: daysAgo(20) },
        { questionId: "A-q5", isCorrect: true, confidenceSelf: 5, answeredAt: daysAgo(20) },
      ],
      unitMasteries: [{ unit: "A", masteryScore: 40 }],
    });
    // q3 (old wrong) should be prioritized over q5 (old confident-correct)
    const idxQ3 = r.questionIds.indexOf("A-q3");
    const idxQ5 = r.questionIds.indexOf("A-q5");
    expect(idxQ3).toBeGreaterThanOrEqual(0);
    expect(idxQ5).toBeGreaterThanOrEqual(0);
    expect(idxQ3).toBeLessThan(idxQ5);
  });

  it("5. expectedDeltaPctHint scales with mastery gap (non-diagnostic users)", () => {
    // Seed a past response so we bypass diagnostic-mode (where expectedDelta
    // is fixed at 0.02 since the goal is baseline coverage, not lift).
    const seed = { questionId: "seed", isCorrect: true, confidenceSelf: 4, answeredAt: daysAgo(60) };
    const big = generateTodaysSet({
      candidatePool: buildPool(["A", "B", "C"]),
      nowMs: NOW.getTime(),
      pastResponses: [seed],
      unitMasteries: [
        { unit: "A", masteryScore: 10 },
        { unit: "B", masteryScore: 20 },
        { unit: "C", masteryScore: 30 },
      ],
    });
    const small = generateTodaysSet({
      candidatePool: buildPool(["A", "B", "C"]),
      nowMs: NOW.getTime(),
      pastResponses: [seed],
      unitMasteries: [
        { unit: "A", masteryScore: 70 },
        { unit: "B", masteryScore: 75 },
        { unit: "C", masteryScore: 78 },
      ],
    });
    expect(big.expectedDeltaPctHint).toBeGreaterThan(small.expectedDeltaPctHint);
  });
});
