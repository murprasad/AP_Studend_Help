/**
 * Unified score predictor entry point.
 *
 * Routes a (course, inputs) pair to the correct per-exam predictor and
 * normalizes the result shape so UI code (dashboard hero, sidebar ring,
 * analytics) can stay generic across AP/SAT/ACT without caring which
 * score scale is in play.
 *
 * Language + input model intentionally mirrors PrepLion's pass-engine
 * so a future unified prep product can share the surface code.
 */

import type { ApCourse } from "@prisma/client";
import { predictApScore, type ScoreInput as ApScoreInput } from "./ap";
import { predictSatScore, type SatInput } from "./sat";
import { predictActScore, type ActInput, type ActSectionKey } from "./act";

export type ExamFamily = "AP" | "SAT" | "ACT";

export interface UnifiedReadiness {
  /** Exam family the prediction belongs to. Drives how `scaledScore` is rendered. */
  family: ExamFamily;

  /** The exam-native score:
   *  - AP  → 1-5
   *  - SAT → 400-1600
   *  - ACT → 1-36 */
  scaledScore: number;

  /** "5" | "1480" | "28" etc — pre-formatted for display. */
  scaledDisplay: string;

  /** Max on the native scale — drives ring-fill math in the UI. */
  scaleMax: number;

  /** "On track for a 5" / "Competitive school range" / "Selective college range" */
  label: string;

  /** low | medium | high — drives whether the raw number is shown. */
  confidence: "low" | "medium" | "high";

  /** Hide the raw number when signal is too noisy to anchor it. */
  showScore: boolean;

  /** Optional: section breakdown for SAT (2) / ACT (4). Omitted for AP. */
  sectionBreakdown?: Array<{ label: string; score: number; max: number }>;

  /** Rough national percentile if available (SAT/ACT). Not defined for AP. */
  percentile?: number;

  /** Standard user-facing disclaimer. Same shape across exams. */
  disclaimer: string;
}

export const EXAM_FAMILY_DISCLAIMER: Record<ExamFamily, string> = {
  AP: "StudentNest is not affiliated with the College Board. Your AP score above is our estimate from your practice data — the official AP score is assigned by the College Board based on your real exam.",
  SAT: "StudentNest is not affiliated with the College Board. Your SAT composite above is our estimate from your practice data — the official SAT score is assigned by the College Board based on your real exam.",
  ACT: "StudentNest is not affiliated with ACT Inc. Your ACT composite above is our estimate from your practice data — the official ACT score is assigned by ACT Inc. based on your real exam.",
};

// Exam family classification by course enum.
export function examFamilyOf(course: string): ExamFamily {
  if (course.startsWith("SAT_")) return "SAT";
  if (course.startsWith("ACT_")) return "ACT";
  return "AP"; // all AP_* courses fall through here
}

// ── AP router ──
export function readinessForAp(course: ApCourse, input: ApScoreInput, hasDiagnostic: boolean): UnifiedReadiness {
  // Per-course AP cutoffs from COURSE_REGISTRY could be threaded here
  // once apCutoffs field is populated per course. For now use defaults.
  const r = predictApScore(input, undefined, hasDiagnostic);
  return {
    family: "AP",
    scaledScore: r.scaledScore,
    scaledDisplay: String(r.scaledScore),
    scaleMax: 5,
    label: r.label,
    confidence: r.confidence,
    showScore: r.showScore,
    percentile: undefined,
    disclaimer: EXAM_FAMILY_DISCLAIMER.AP,
  };
}

// ── SAT router ──
export function readinessForSat(input: SatInput, hasDiagnostic: boolean): UnifiedReadiness {
  const r = predictSatScore(input, hasDiagnostic);
  return {
    family: "SAT",
    scaledScore: r.scaledScore,
    scaledDisplay: String(r.scaledScore),
    scaleMax: 1600,
    label: r.label,
    confidence: r.confidence,
    showScore: r.showScore,
    sectionBreakdown: [
      { label: "Math", score: r.sectionScores.math, max: 800 },
      { label: "Reading & Writing", score: r.sectionScores.readingWriting, max: 800 },
    ],
    percentile: r.percentile,
    disclaimer: EXAM_FAMILY_DISCLAIMER.SAT,
  };
}

// ── ACT router ──
export function readinessForAct(input: ActInput, hasDiagnostic: boolean): UnifiedReadiness {
  const r = predictActScore(input, hasDiagnostic);
  const order: ActSectionKey[] = ["english", "math", "reading", "science"];
  const displayNames: Record<ActSectionKey, string> = {
    english: "English", math: "Math", reading: "Reading", science: "Science",
  };
  return {
    family: "ACT",
    scaledScore: r.scaledScore,
    scaledDisplay: String(r.scaledScore),
    scaleMax: 36,
    label: r.label,
    confidence: r.confidence,
    showScore: r.showScore,
    sectionBreakdown: order.map((k) => ({
      label: displayNames[k], score: r.sectionScores[k], max: 36,
    })),
    percentile: r.percentile,
    disclaimer: EXAM_FAMILY_DISCLAIMER.ACT,
  };
}

export { predictApScore, predictSatScore, predictActScore };
export type { ApScoreInput, SatInput, ActInput };
