/**
 * POST /api/admin/populate-questions
 *
 * Fills every unit (for a given course) up to `minPerUnit` approved questions.
 * Skips units that already have enough. Uses the AI cascade (Groq → Pollinations fallback).
 *
 * Body: { course?: ApCourse, minPerUnit?: number, dryRun?: boolean }
 * Response: { filled: number, skipped: number, failed: number, details: UnitResult[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, ApUnit, Difficulty, QuestionType } from "@prisma/client";
import { VALID_AP_COURSES, COURSE_REGISTRY } from "@/lib/courses";
import { COURSE_UNITS } from "@/lib/utils";
import { buildQuestionPrompt } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min – Vercel Pro / Netlify Functions timeout

// ── Auth guard ────────────────────────────────────────────────────────────────
async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// ── GET — report current question coverage ────────────────────────────────────
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const courseParam = searchParams.get("course") as ApCourse | null;
  const courses = courseParam && VALID_AP_COURSES.includes(courseParam)
    ? [courseParam]
    : VALID_AP_COURSES;

  const coverage: Record<string, { unit: string; name: string; count: number; status: string; difficulty: { EASY: number; MEDIUM: number; HARD: number } }[]> = {};

  for (const course of courses) {
    const unitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];
    const [counts, difficultyCounts] = await Promise.all([
      prisma.question.groupBy({
        by: ["unit"],
        where: { course, isApproved: true, unit: { in: unitKeys } },
        _count: { id: true },
      }),
      prisma.question.groupBy({
        by: ["unit", "difficulty"],
        where: { course, isApproved: true, unit: { in: unitKeys } },
        _count: { id: true },
      }),
    ]);
    const countMap = new Map(counts.map((c) => [c.unit, c._count.id]));

    coverage[course] = unitKeys.map((unit) => {
      const count = countMap.get(unit) ?? 0;
      const diffBreakdown = { EASY: 0, MEDIUM: 0, HARD: 0 };
      for (const d of difficultyCounts) {
        if (d.unit === unit && d.difficulty in diffBreakdown) {
          diffBreakdown[d.difficulty as keyof typeof diffBreakdown] = d._count.id;
        }
      }
      const hasGoodDistribution = count >= 20 && diffBreakdown.HARD >= 3 && diffBreakdown.EASY >= 3 && diffBreakdown.MEDIUM >= 5;
      const status = count >= 20
        ? (hasGoodDistribution ? "good" : "unbalanced")
        : count >= 10 ? "low" : "critical";
      return {
        unit,
        name: COURSE_REGISTRY[course].units[unit]?.name ?? unit,
        count,
        status,
        difficulty: diffBreakdown,
      };
    });
  }

  const totals = Object.entries(coverage).map(([course, units]) => ({
    course,
    total: units.reduce((s, u) => s + u.count, 0),
    critical: units.filter((u) => u.status === "critical").length,
    low: units.filter((u) => u.status === "low").length,
    unbalanced: units.filter((u) => u.status === "unbalanced").length,
    good: units.filter((u) => u.status === "good").length,
  }));

  return NextResponse.json({ coverage, totals });
}

// ── POST — generate questions to fill gaps ────────────────────────────────────
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const course: ApCourse = body.course && VALID_AP_COURSES.includes(body.course)
    ? body.course
    : "AP_WORLD_HISTORY";
  const minPerUnit: number = Math.min(body.minPerUnit ?? 20, 50);
  const dryRun: boolean = body.dryRun ?? false;

  const unitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];

  // Count existing questions per unit
  const existingCounts = await prisma.question.groupBy({
    by: ["unit"],
    where: { course, isApproved: true, unit: { in: unitKeys } },
    _count: { id: true },
  });
  const countMap = new Map(existingCounts.map((c) => [c.unit, c._count.id]));

  type UnitResult = { unit: string; name: string; needed: number; generated: number; status: "ok" | "skipped" | "failed"; error?: string };
  const details: UnitResult[] = [];
  let filled = 0;
  let skipped = 0;
  let failed = 0;

  const courseConfig = COURSE_REGISTRY[course];

  for (const unit of unitKeys) {
    const existing = countMap.get(unit) ?? 0;
    const needed = Math.max(0, minPerUnit - existing);
    const unitName = courseConfig.units[unit]?.name ?? unit;

    if (needed === 0) {
      skipped++;
      details.push({ unit, name: unitName, needed: 0, generated: 0, status: "skipped" });
      continue;
    }

    if (dryRun) {
      details.push({ unit, name: unitName, needed, generated: 0, status: "ok" });
      continue;
    }

    let generated = 0;
    const keyThemes = courseConfig.units[unit]?.keyThemes ?? [];
    const queue = buildDifficultyQueue(needed, keyThemes);

    try {
      for (let i = 0; i < queue.length; i++) {
        const { difficulty, topic } = queue[i];
        try {
          const q = await generateOneQuestion(course, unit, difficulty, topic, courseConfig);
          if (q) {
            await prisma.question.create({
              data: {
                course,
                unit,
                topic: q.topic,
                subtopic: q.subtopic ?? "",
                difficulty,
                questionType: QuestionType.MCQ,
                questionText: q.questionText,
                stimulus: q.stimulus ?? null,
                options: q.options ?? null,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                isAiGenerated: true,
                isApproved: true,
              },
            });
            generated++;
          }
        } catch (err) {
          console.warn(`[populate] Failed q ${i + 1} for ${unit}:`, err instanceof Error ? err.message : err);
        }
        // Small delay to respect rate limits
        await sleep(600);
      }
      filled += generated;
      details.push({ unit, name: unitName, needed, generated, status: generated > 0 ? "ok" : "failed" });
    } catch (err) {
      failed++;
      details.push({
        unit, name: unitName, needed, generated,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ course, minPerUnit, dryRun, filled, skipped, failed, details });
}

// ── Difficulty queue builder — 30% EASY / 50% MEDIUM / 20% HARD ──────────────

function buildDifficultyQueue(
  totalCount: number,
  keyThemes: string[]
): Array<{ difficulty: Difficulty; topic: string | undefined }> {
  const easyTarget = Math.round(totalCount * 0.3);
  const hardTarget = Math.round(totalCount * 0.2);
  const mediumTarget = totalCount - easyTarget - hardTarget;

  // Interleave difficulties: E M H M E M M H M E ... for even spread
  const slots: Difficulty[] = [];
  const counts = { EASY: easyTarget, MEDIUM: mediumTarget, HARD: hardTarget };
  const order: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.MEDIUM];
  let placed = 0;
  while (placed < totalCount) {
    for (const d of order) {
      if (placed >= totalCount) break;
      if (counts[d] > 0) {
        slots.push(d);
        counts[d]--;
        placed++;
      }
    }
    // Safety: if a difficulty ran out, fill from MEDIUM
    if (placed < totalCount && counts.MEDIUM === 0 && counts.EASY === 0 && counts.HARD === 0) break;
  }

  return slots.map((difficulty, i) => ({
    difficulty,
    topic: keyThemes.length > 0 ? keyThemes[i % keyThemes.length] : undefined,
  }));
}

// ── Internal question generator ───────────────────────────────────────────────

interface SimpleQuestion {
  topic: string;
  subtopic: string;
  questionText: string;
  stimulus?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

async function generateOneQuestion(
  course: ApCourse,
  unit: ApUnit,
  difficulty: Difficulty,
  topic: string | undefined,
  courseConfig: (typeof COURSE_REGISTRY)[ApCourse]
): Promise<SimpleQuestion | null> {
  const unitMeta = courseConfig.units[unit];
  const unitName = unitMeta?.name ?? unit;

  const prompt = buildQuestionPrompt(course, unit, unitName, difficulty, QuestionType.MCQ, topic);

  const { callAIWithCascade } = await import("@/lib/ai-providers");
  const raw = await callAIWithCascade(prompt);
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // Find the first valid JSON object in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.questionText || !parsed.correctAnswer || !Array.isArray(parsed.options)) {
    throw new Error("Incomplete question from AI");
  }

  return {
    topic: parsed.topic ?? topic ?? unitName,
    subtopic: parsed.subtopic ?? "",
    questionText: parsed.questionText,
    stimulus: parsed.stimulus && parsed.stimulus !== "null" ? parsed.stimulus : undefined,
    options: parsed.options,
    correctAnswer: parsed.correctAnswer.trim().charAt(0).toUpperCase(),
    explanation: parsed.explanation ?? "",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
