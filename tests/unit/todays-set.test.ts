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
  it("1. Picks 12 Qs concentrated in 3 weakest units", () => {
    const r = generateTodaysSet({
      candidatePool: buildPool(["A", "B", "C", "D", "E"]),
      pastResponses: [],
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
    expect(inWeak).toBeGreaterThanOrEqual(10);
    expect(r.conceptKeys).toEqual(["unit:A", "unit:B", "unit:C"]);
  });

  it("2. Skips questions answered in last 14 days", () => {
    const r = generateTodaysSet({
      candidatePool: buildPool(["A"], 30),
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
      pastResponses: [],
      unitMasteries: [{ unit: "A", masteryScore: 40 }],
    });
    expect(r.questionIds.length).toBe(5);
  });

  it("4. Wrong answers from 7+ days ago get top priority", () => {
    const pool = buildPool(["A"], 10);
    const r = generateTodaysSet({
      candidatePool: pool,
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

  it("5. expectedDeltaPctHint scales with mastery gap", () => {
    const big = generateTodaysSet({
      candidatePool: buildPool(["A", "B", "C"]),
      pastResponses: [],
      unitMasteries: [
        { unit: "A", masteryScore: 10 },
        { unit: "B", masteryScore: 20 },
        { unit: "C", masteryScore: 30 },
      ],
    });
    const small = generateTodaysSet({
      candidatePool: buildPool(["A", "B", "C"]),
      pastResponses: [],
      unitMasteries: [
        { unit: "A", masteryScore: 70 },
        { unit: "B", masteryScore: 75 },
        { unit: "C", masteryScore: 78 },
      ],
    });
    expect(big.expectedDeltaPctHint).toBeGreaterThan(small.expectedDeltaPctHint);
  });
});
