/**
 * 2026-05-31 — F2-routing (#100 SAT=CB parity Sprint S3).
 *
 * Unit tests for the tier-weighted allocation used by the live Module-2
 * routing endpoint. The HTTP handler itself is integration-tested via the
 * existing mock-exam Playwright spec; the allocation math is pure and
 * lives in this module-2 test for fast feedback.
 *
 * The allocation table being verified:
 *   HARD   → 70% HARD + 25% MEDIUM + 5% EASY
 *   MEDIUM → 35% HARD + 45% MEDIUM + 20% EASY
 *   EASY   → 10% HARD + 35% MEDIUM + 55% EASY
 */
import { describe, it, expect } from "vitest";
import { inferModule2Tier } from "@/lib/sat-scaled-score";

// Mirror the tierTargets function from the route so we can unit-test the
// allocation shape without bringing up the prisma/next runtime.
function tierTargets(
  tier: "EASY" | "MEDIUM" | "HARD",
  total: number,
): { EASY: number; MEDIUM: number; HARD: number } {
  const WEIGHTS = {
    HARD:   { EASY: 0.05, MEDIUM: 0.25, HARD: 0.70 },
    MEDIUM: { EASY: 0.20, MEDIUM: 0.45, HARD: 0.35 },
    EASY:   { EASY: 0.55, MEDIUM: 0.35, HARD: 0.10 },
  } as const;
  const w = WEIGHTS[tier];
  const easy = Math.round(total * w.EASY);
  const medium = Math.round(total * w.MEDIUM);
  const hard = Math.max(0, total - easy - medium);
  return { EASY: easy, MEDIUM: medium, HARD: hard };
}

describe("Module-2 tier-weighted allocation (F2-routing #100)", () => {
  it("HARD tier favours HARD difficulty (≥60%)", () => {
    const t = tierTargets("HARD", 22);
    expect(t.HARD / 22).toBeGreaterThanOrEqual(0.6);
    expect(t.HARD).toBeGreaterThan(t.MEDIUM);
    expect(t.MEDIUM).toBeGreaterThan(t.EASY);
  });
  it("EASY tier favours EASY difficulty (≥50%)", () => {
    const t = tierTargets("EASY", 22);
    expect(t.EASY / 22).toBeGreaterThanOrEqual(0.5);
    expect(t.EASY).toBeGreaterThan(t.MEDIUM);
    expect(t.MEDIUM).toBeGreaterThan(t.HARD);
  });
  it("MEDIUM tier centres on MEDIUM (35-50%)", () => {
    const t = tierTargets("MEDIUM", 22);
    expect(t.MEDIUM / 22).toBeGreaterThanOrEqual(0.35);
    expect(t.MEDIUM / 22).toBeLessThanOrEqual(0.5);
  });
  it("allocations sum to total for typical M2 counts", () => {
    for (const n of [11, 22, 27, 44]) {
      for (const tier of ["EASY", "MEDIUM", "HARD"] as const) {
        const t = tierTargets(tier, n);
        expect(t.EASY + t.MEDIUM + t.HARD).toBe(n);
      }
    }
  });
});

describe("inferModule2Tier — F8 helper, used by F2-routing", () => {
  function build(answers: ReadonlyArray<boolean>): ReadonlyArray<{ isCorrect: boolean }> {
    return answers.map((a) => ({ isCorrect: a }));
  }

  it("returns HARD when M1 ≥ 75% correct", () => {
    // 22 Q M1, 18 correct = 81.8%
    const resp = build([
      ...Array(18).fill(true),
      ...Array(4).fill(false),
      ...Array(22).fill(false), // M2 doesn't affect tier routing
    ]);
    expect(inferModule2Tier(resp)).toBe("HARD");
  });
  it("returns MEDIUM when M1 ≈ 60%", () => {
    const resp = build([
      ...Array(13).fill(true),
      ...Array(9).fill(false),
      ...Array(22).fill(false),
    ]);
    expect(inferModule2Tier(resp)).toBe("MEDIUM");
  });
  it("returns EASY when M1 < 50%", () => {
    const resp = build([
      ...Array(8).fill(true),
      ...Array(14).fill(false),
      ...Array(22).fill(false),
    ]);
    expect(inferModule2Tier(resp)).toBe("EASY");
  });
  it("returns null for sessions < 10 Qs", () => {
    expect(inferModule2Tier([{ isCorrect: true }, { isCorrect: false }])).toBeNull();
  });
});
