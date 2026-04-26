/**
 * StudentNest readiness data loader — single source of truth for
 * score prediction across AP/SAT/ACT.
 *
 * Every surface that displays the scaled score (dashboard hero, sidebar
 * ring, analytics, practice summary) should read through
 * `loadReadinessSnapshot` — either directly (server routes) or via
 * `/api/readiness` (client components).
 *
 * Port of PrepLion's pass-engine-inputs with exam-family routing:
 * AP → 1-5 per-course predictor
 * SAT → 400-1600 per-section predictor
 * ACT → 1-36 per-section predictor
 */

import type { ApCourse, PrismaClient } from "@prisma/client";
import {
  readinessForAp,
  readinessForSat,
  readinessForAct,
  examFamilyOf,
  type UnifiedReadiness,
} from "@/lib/score-predictors";
import type { ActSectionKey } from "@/lib/score-predictors/act";
import { getScoreActions } from "@/lib/score-predictors/weaknesses";

const TWO_WEEKS_MS = 14 * 86_400_000;

async function safeRun<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

interface MasteryRow {
  unit: string;
  masteryScore: number;
  totalAttempts: number;
}

interface TwoWeekSession {
  totalQuestions: number;
  correctAnswers: number | null;
  completedAt: Date | null;
}

type MockSession = {
  totalQuestions: number;
  correctAnswers: number | null;
};

// SAT section routing — matches the schema unit enums.
function satSectionOf(unit: string): "math" | "reading_writing" {
  if (unit.includes("MATH") || unit.startsWith("SAT_MATH")) return "math";
  return "reading_writing";
}

// ACT section routing.
function actSectionOf(unit: string): ActSectionKey {
  if (unit.includes("ENGLISH")) return "english";
  if (unit.includes("MATH")) return "math";
  if (unit.includes("READING")) return "reading";
  return "science";
}

function avgMastery(rows: MasteryRow[]): { avgMastery: number; totalAttempts: number } {
  if (rows.length === 0) return { avgMastery: 0, totalAttempts: 0 };
  const sum = rows.reduce((s, r) => s + r.masteryScore, 0);
  const attempts = rows.reduce((s, r) => s + (r.totalAttempts || 0), 0);
  return { avgMastery: sum / rows.length, totalAttempts: attempts };
}

/**
 * Load readiness for (userId, course). Returns a UnifiedReadiness with
 * family-specific scaled score, label, confidence, disclaimer, and
 * (for SAT/ACT) section breakdown.
 *
 * Individual query failures degrade to empty / null rather than throw.
 */
export async function loadReadinessSnapshot(
  userId: string,
  course: ApCourse,
  prisma: PrismaClient,
): Promise<UnifiedReadiness & { totalSessions: number; totalAnswered: number; recentAccuracy: number; hasDiagnostic: boolean }> {
  const [masteryScores, diagnosticResult, twoWeekSessions, mockSessions] = await Promise.all([
    safeRun(
      prisma.masteryScore.findMany({
        where: { userId, course },
        select: { unit: true, masteryScore: true, totalAttempts: true },
      }),
      [] as MasteryRow[],
    ),
    safeRun(
      prisma.diagnosticResult.findFirst({
        where: { userId, course },
        orderBy: { createdAt: "desc" },
        select: { unitScores: true },
      }),
      null,
    ),
    safeRun(
      prisma.practiceSession.findMany({
        where: {
          userId,
          course,
          completedAt: { gte: new Date(Date.now() - TWO_WEEKS_MS) },
        },
        select: { totalQuestions: true, correctAnswers: true, completedAt: true },
      }),
      [] as TwoWeekSession[],
    ),
    safeRun(
      prisma.practiceSession.findMany({
        where: { userId, course, sessionType: "MOCK_EXAM" as const },
        orderBy: { completedAt: "desc" },
        take: 10,
        select: { totalQuestions: true, correctAnswers: true },
      }),
      [] as MockSession[],
    ),
  ]);

  const totalSessions = twoWeekSessions.length;
  const totalAnswered = twoWeekSessions.reduce((s, r) => s + (r.totalQuestions ?? 0), 0);
  const totalCorrect = twoWeekSessions.reduce((s, r) => s + (r.correctAnswers ?? 0), 0);
  const recentAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  // Best mock as percentage.
  const bestMockPercent = (() => {
    if (mockSessions.length === 0) return null;
    const rates = mockSessions
      .filter((m) => m.totalQuestions > 0 && m.correctAnswers !== null)
      .map((m) => ((m.correctAnswers! / m.totalQuestions) * 100));
    if (rates.length === 0) return null;
    return Math.max(...rates);
  })();

  const hasDiagnostic = !!diagnosticResult;
  const family = examFamilyOf(course as string);

  if (family === "AP") {
    // Phase A (Beta 8.1): compute top-3 actionable weakness items so the
    // dashboard can render "Boost your score: do these 3 things." Pure
    // function over data we already loaded — no extra DB hit.
    const actions = getScoreActions(
      course,
      masteryScores.map((m) => ({ unit: m.unit, masteryScore: m.masteryScore, totalAttempts: m.totalAttempts || 0 })),
      3,
    );

    return {
      ...readinessForAp(
        course,
        {
          masteryData: masteryScores.map((m) => ({ unit: m.unit, masteryScore: m.masteryScore, totalAttempts: m.totalAttempts || 0 })),
          bestMockPercent,
          recentAccuracy,
          totalSessions,
          totalAnswered,
        },
        hasDiagnostic,
      ),
      actions,
      totalSessions,
      totalAnswered,
      recentAccuracy,
      hasDiagnostic,
    };
  }

  if (family === "SAT") {
    // Group mastery + mock by section.
    const sectionsMastery: Record<"math" | "reading_writing", MasteryRow[]> = { math: [], reading_writing: [] };
    for (const m of masteryScores) sectionsMastery[satSectionOf(m.unit)].push(m);

    const sectionMastery = {
      math: avgMastery(sectionsMastery.math),
      reading_writing: avgMastery(sectionsMastery.reading_writing),
    };

    // For SAT mock percent per section, we need mock sessions that identify the section.
    // Simplification: use overall mock % as a proxy for both sections until per-section mock data exists.
    const sectionMockPercent = { math: bestMockPercent, reading_writing: bestMockPercent };

    return {
      ...readinessForSat(
        { sectionMastery, sectionMockPercent, recentAccuracy, totalSessions, totalAnswered },
        hasDiagnostic,
      ),
      totalSessions,
      totalAnswered,
      recentAccuracy,
      hasDiagnostic,
    };
  }

  // ACT
  const sectionsMastery: Record<ActSectionKey, MasteryRow[]> = {
    english: [], math: [], reading: [], science: [],
  };
  for (const m of masteryScores) sectionsMastery[actSectionOf(m.unit)].push(m);

  const sectionMastery: Record<ActSectionKey, { avgMastery: number; totalAttempts: number }> = {
    english: avgMastery(sectionsMastery.english),
    math: avgMastery(sectionsMastery.math),
    reading: avgMastery(sectionsMastery.reading),
    science: avgMastery(sectionsMastery.science),
  };

  const sectionMockPercent: Record<ActSectionKey, number | null> = {
    english: bestMockPercent,
    math: bestMockPercent,
    reading: bestMockPercent,
    science: bestMockPercent,
  };

  return {
    ...readinessForAct(
      { sectionMastery, sectionMockPercent, recentAccuracy, totalSessions, totalAnswered },
      hasDiagnostic,
    ),
    totalSessions,
    totalAnswered,
    recentAccuracy,
    hasDiagnostic,
  };
}
