/**
 * REQ-148 — Distractor-plausibility heuristic gate tests.
 *
 * Tests the three deterministic heuristics in
 * scripts/_distractor-plausibility-sweep.mjs:
 *   - distractor-all-none-in-math
 *   - distractor-magnitude-absurd
 *   - distractor-verbatim-from-stem
 *
 * Reference: docs/COMPREHENSIVE_TEST_PLAN.md §L9
 *            scripts/_distractor-plausibility-sweep.mjs (heuristicCheck)
 *
 * NOTE: `heuristicCheck` is NOT yet exported from the .mjs script. This
 * test is currently authored as a **behavior contract** that mirrors the
 * logic. When the script is refactored to export the helpers, replace the
 * inline implementation with `import { heuristicCheck } from "../../scripts/_distractor-plausibility-sweep.mjs"`.
 * TODO(REQ-148): export `heuristicCheck` from the script for direct testing.
 */

import { describe, it, expect } from "vitest";

// --- BEGIN mirrored heuristics (keep in sync with _distractor-plausibility-sweep.mjs) ---
const MATH_SCI_COURSES = new Set<string>([
  "SAT_MATH",
  "ACT_MATH",
  "ACT_SCIENCE",
  "AP_CALCULUS_AB",
  "AP_CALCULUS_BC",
  "AP_STATISTICS",
  "AP_CHEMISTRY",
  "AP_BIOLOGY",
  "AP_PHYSICS_1",
  "AP_PHYSICS_2",
  "AP_PHYSICS_C_MECHANICS",
  "AP_PHYSICS_C_EM",
  "AP_ENVIRONMENTAL_SCIENCE",
]);
const ALL_OF_NONE_OF_PATTERN = /\b(all|none)\s+of\s+the\s+above\b/i;

function stripPrefix(s: string): string {
  return String(s).replace(/^[A-E]\)\s*/, "").trim();
}

function extractNumber(s: string): number | null {
  const m = String(s).match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

type Q = { course: string; questionText: string; options: string[]; correctAnswer: string };

function heuristicCheck(q: Q): { gate: string; reason: string } | null {
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  if (opts.length < 3) return null;
  const correctIdx = (q.correctAnswer || "").charCodeAt(0) - 65;
  if (correctIdx < 0 || correctIdx >= opts.length) return null;
  const correct = stripPrefix(opts[correctIdx]);

  if (MATH_SCI_COURSES.has(q.course)) {
    for (let i = 0; i < opts.length; i++) {
      const o = stripPrefix(opts[i]);
      if (ALL_OF_NONE_OF_PATTERN.test(o)) {
        return { gate: "distractor-all-none-in-math", reason: "" };
      }
    }
  }

  const correctNum = extractNumber(correct);
  if (correctNum !== null && Math.abs(correctNum) > 0.0001) {
    for (let i = 0; i < opts.length; i++) {
      if (i === correctIdx) continue;
      const o = stripPrefix(opts[i]);
      const distNum = extractNumber(o);
      if (distNum === null || distNum === 0) continue;
      const ratio = Math.abs(distNum / correctNum);
      if (ratio > 100000 || ratio < 0.00001) {
        return { gate: "distractor-magnitude-absurd", reason: "" };
      }
    }
  }

  const isWritingCourse = /COMPOSITION|MODULAR|LITERATURE|ENGLISH/.test(q.course || "");
  if (!isWritingCourse) {
    const stemLower = (q.questionText || "").toLowerCase();
    for (let i = 0; i < opts.length; i++) {
      if (i === correctIdx) continue;
      const o = stripPrefix(opts[i]).toLowerCase();
      if (o.length >= 30 && stemLower.includes(o)) {
        return { gate: "distractor-verbatim-from-stem", reason: "" };
      }
    }
  }

  return null;
}
// --- END mirrored heuristics ---

describe("REQ-148 — distractor plausibility heuristics", () => {
  describe("L9-N1: distractor-verbatim-from-stem", () => {
    it("fires when a long distractor substring matches the stem verbatim", () => {
      const verbatim = "the rate of change of a population over time when carrying capacity";
      const r = heuristicCheck({
        course: "AP_BIOLOGY",
        questionText: `A model describes ${verbatim}. What is the model called?`,
        options: ["A) Logistic growth", `B) ${verbatim}`, "C) Exponential", "D) Linear"],
        correctAnswer: "A",
      });
      expect(r?.gate).toBe("distractor-verbatim-from-stem");
    });

    it("does NOT fire on writing course (essay revision Qs legitimately quote stem)", () => {
      const verbatim = "she went to the store and bought some apples for her mother";
      const r = heuristicCheck({
        course: "AP_ENGLISH_LITERATURE",
        questionText: `Original: "${verbatim}." Pick the best revision.`,
        options: ["A) Trim adverbs", `B) ${verbatim}`, "C) Add detail", "D) Shorten"],
        correctAnswer: "A",
      });
      expect(r).toBeNull();
    });

    it("does NOT fire on short substring (< 30 chars)", () => {
      const r = heuristicCheck({
        course: "AP_BIOLOGY",
        questionText: "What is mitosis?",
        options: ["A) Cell division", "B) mitosis", "C) Photosynthesis", "D) Respiration"],
        correctAnswer: "A",
      });
      expect(r).toBeNull();
    });
  });

  describe("L9-N2 + L9-N6: distractor-magnitude-absurd", () => {
    it("L9-N2: fires when numeric distractor is 1e6× the correct value", () => {
      const r = heuristicCheck({
        course: "SAT_MATH",
        questionText: "What is 2 × 3?",
        options: ["A) 6", "B) 6000000", "C) 5", "D) 7"],
        correctAnswer: "A",
      });
      expect(r?.gate).toBe("distractor-magnitude-absurd");
    });

    it("L9-N6: does NOT fire on legitimately close values", () => {
      const r = heuristicCheck({
        course: "SAT_MATH",
        questionText: "What is 2 × 3?",
        options: ["A) 6", "B) 5", "C) 7", "D) 8"],
        correctAnswer: "A",
      });
      expect(r).toBeNull();
    });

    it("L9-N9: handles zero-valued distractor safely (no division by zero)", () => {
      const r = heuristicCheck({
        course: "SAT_MATH",
        questionText: "What is 2 × 3?",
        options: ["A) 6", "B) 0", "C) 5", "D) 7"],
        correctAnswer: "A",
      });
      // Zero distractor is skipped (correctNum/0 would be Infinity); should return null or another gate, not crash.
      expect(r).toBeNull();
    });
  });

  describe("L9-N3 + L9-N5: distractor-all-none-in-math", () => {
    it("L9-N3: fires when 'All of the above' appears in a math course", () => {
      const r = heuristicCheck({
        course: "AP_CALCULUS_AB",
        questionText: "Which integral form converges?",
        options: ["A) Form 1", "B) Form 2", "C) Form 3", "D) All of the above"],
        correctAnswer: "A",
      });
      expect(r?.gate).toBe("distractor-all-none-in-math");
    });

    it("L9-N4: fires on 'None of the above' too", () => {
      const r = heuristicCheck({
        course: "AP_CHEMISTRY",
        questionText: "Which compound is ionic?",
        options: ["A) NaCl", "B) CO2", "C) H2O", "D) None of the above"],
        correctAnswer: "A",
      });
      expect(r?.gate).toBe("distractor-all-none-in-math");
    });

    it("L9-N5: does NOT fire on humanities courses", () => {
      const r = heuristicCheck({
        course: "AP_US_HISTORY",
        questionText: "Which factors contributed to the Civil War?",
        options: ["A) Slavery", "B) Tariffs", "C) States' rights", "D) All of the above"],
        correctAnswer: "D",
      });
      expect(r).toBeNull();
    });
  });

  describe("guard rails", () => {
    it("returns null on non-MCQ (< 3 options)", () => {
      const r = heuristicCheck({
        course: "SAT_MATH",
        questionText: "What is 2 × 3?",
        options: ["A) 6", "B) 5"],
        correctAnswer: "A",
      });
      expect(r).toBeNull();
    });

    it("returns null when correctAnswer points outside options", () => {
      const r = heuristicCheck({
        course: "SAT_MATH",
        questionText: "What is 2 × 3?",
        options: ["A) 6", "B) 5", "C) 7", "D) 8"],
        correctAnswer: "Z",
      });
      expect(r).toBeNull();
    });
  });
});
