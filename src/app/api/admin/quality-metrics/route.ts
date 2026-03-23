/**
 * GET /api/admin/quality-metrics?course=CLEP_INTRO_PSYCHOLOGY
 *
 * Returns aggregate quality metrics for a course's question bank.
 * Used by the admin quality dashboard and the public-facing quality page.
 *
 * Metrics cover 4 dimensions:
 *   1. Content validity — topic coverage vs College Board weights
 *   2. Construct validity — Bloom's taxonomy distribution, scenario-based rate
 *   3. Statistical quality — p-values, discrimination approximation
 *   4. Process quality — validation pass rate, report rate
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COURSE_REGISTRY, VALID_AP_COURSES } from "@/lib/courses";
import { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auth: admin only
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const courseParam = searchParams.get("course");

  if (!courseParam || !VALID_AP_COURSES.includes(courseParam as ApCourse)) {
    return NextResponse.json({ error: "Invalid or missing course parameter" }, { status: 400 });
  }

  const course = courseParam as ApCourse;
  const config = COURSE_REGISTRY[course];
  const isCLEP = courseParam.startsWith("CLEP_");

  // ── 1. Basic counts ──
  const [totalQuestions, approvedQuestions] = await Promise.all([
    prisma.question.count({ where: { course } }),
    prisma.question.count({ where: { course, isApproved: true } }),
  ]);

  // ── 2. Content validity — topic coverage vs CB weights ──
  const unitCounts = await prisma.question.groupBy({
    by: ["unit"],
    where: { course, isApproved: true },
    _count: { id: true },
  });

  const unitCountMap = new Map(unitCounts.map((u) => [u.unit, u._count.id]));
  const topicCoverage: Record<string, { target: number; actual: number; questions: number }> = {};
  let topicCoverageScore = 1.0;

  if (config.topicWeights && approvedQuestions > 0) {
    let totalDeviation = 0;
    for (const [unitKey, targetWeight] of Object.entries(config.topicWeights)) {
      const count = unitCountMap.get(unitKey as never) ?? 0;
      const actualWeight = count / approvedQuestions;
      const unitName = config.units[unitKey as keyof typeof config.units]?.name ?? unitKey;
      topicCoverage[unitName] = {
        target: targetWeight,
        actual: Math.round(actualWeight * 1000) / 1000,
        questions: count,
      };
      totalDeviation += Math.abs(targetWeight - actualWeight);
    }
    // Score: 1.0 = perfect, 0.0 = completely misaligned
    topicCoverageScore = Math.max(0, Math.round((1 - totalDeviation / 2) * 100) / 100);
  }

  // ── 3. Construct validity — Bloom's distribution ──
  const bloomCounts = await prisma.question.groupBy({
    by: ["bloomLevel"],
    where: { course, isApproved: true, bloomLevel: { not: null } },
    _count: { id: true },
  });

  const bloomTotal = bloomCounts.reduce((s, b) => s + b._count.id, 0);
  const bloomDistribution: Record<string, number> = { remember: 0, apply: 0, analyze: 0 };
  for (const b of bloomCounts) {
    const level = (b.bloomLevel ?? "").toLowerCase();
    if (level in bloomDistribution) {
      bloomDistribution[level] = bloomTotal > 0 ? Math.round((b._count.id / bloomTotal) * 100) / 100 : 0;
    }
  }

  // Scenario-based rate (CLEP only) — check questionText for scenario keywords
  let scenarioBasedRate = 0;
  if (isCLEP && approvedQuestions > 0) {
    // Use raw query for regex pattern matching
    try {
      const scenarioCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM questions
         WHERE course = $1 AND "isApproved" = true AND "questionType" = 'MCQ'
         AND ("questionText" ~* '\\m(observes?|discovers?|researcher|student|company|experiment|study|scenario|situation|case|finds?\\s+that|argues?\\s+that)\\M')`,
        course,
      );
      const totalMCQ = await prisma.question.count({ where: { course, isApproved: true, questionType: "MCQ" } });
      if (totalMCQ > 0) {
        scenarioBasedRate = Math.round((Number(scenarioCount[0]?.count ?? 0) / totalMCQ) * 100) / 100;
      }
    } catch {
      // Regex not supported — fall back to approximate
      scenarioBasedRate = -1; // indicates not computed
    }
  }

  // ── 4. Statistical quality — p-values ──
  const calibratedQuestions = await prisma.question.findMany({
    where: { course, isApproved: true, timesAnswered: { gte: 20 } },
    select: { id: true, timesAnswered: true, timesCorrect: true, difficulty: true },
  });

  let avgPValue = 0;
  const pValueDistribution = { tooEasy: 0, good: 0, tooHard: 0 };

  if (calibratedQuestions.length > 0) {
    let pSum = 0;
    for (const q of calibratedQuestions) {
      const p = (q.timesCorrect ?? 0) / (q.timesAnswered ?? 1);
      pSum += p;
      if (p > 0.85) pValueDistribution.tooEasy++;
      else if (p < 0.30) pValueDistribution.tooHard++;
      else pValueDistribution.good++;
    }
    avgPValue = Math.round((pSum / calibratedQuestions.length) * 100) / 100;
  }

  // ── 5. Process quality ──
  const reportedQuestions = await prisma.question.count({
    where: { course, reportedCount: { gt: 0 } },
  });
  const flaggedForReview = await prisma.question.count({
    where: { course, isApproved: false },
  });

  const reportRate = totalQuestions > 0
    ? Math.round((reportedQuestions / totalQuestions) * 1000) / 1000
    : 0;

  // ── 6. Overall quality grade ──
  let grade = "N/A";
  if (approvedQuestions >= 10) {
    let score = 0;
    // Content validity (0-25 points)
    score += Math.min(25, Math.round(topicCoverageScore * 25));
    // Construct validity (0-25 points)
    const bloomApplyRate = bloomDistribution.apply + bloomDistribution.analyze;
    score += bloomTotal > 0 ? Math.min(25, Math.round(bloomApplyRate * 30)) : 12;
    // Scenario-based rate (0-25 points)
    score += scenarioBasedRate > 0 ? Math.min(25, Math.round(scenarioBasedRate * 30)) : 15;
    // Statistical quality (0-25 points)
    if (calibratedQuestions.length >= 10) {
      const pGoodRate = pValueDistribution.good / calibratedQuestions.length;
      score += Math.min(25, Math.round(pGoodRate * 25));
    } else {
      score += 12; // insufficient data — neutral
    }

    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "A-";
    else if (score >= 70) grade = "B+";
    else if (score >= 60) grade = "B";
    else if (score >= 50) grade = "B-";
    else if (score >= 40) grade = "C";
    else grade = "D";
  }

  return NextResponse.json({
    course,
    courseName: config.name,
    totalQuestions,
    approvedQuestions,

    // Content validity
    topicCoverage,
    topicCoverageScore,

    // Construct validity
    bloomDistribution,
    bloomTarget: { remember: 0.20, apply: 0.50, analyze: 0.30 },
    bloomTracked: bloomTotal,
    scenarioBasedRate,

    // Statistical quality
    calibratedQuestions: calibratedQuestions.length,
    avgPValue,
    pValueDistribution,

    // Process quality
    reportRate,
    flaggedForReview,
    reportedQuestions,

    // Overall
    qualityGrade: grade,
  });
}
