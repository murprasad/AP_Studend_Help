/**
 * POST /api/admin/mega-populate
 *
 * Generates questions for ONE unit at a time (CF-safe, no timeout risk).
 * The client orchestrates the unit-by-unit loop.
 *
 * Body: { course: ApCourse; unit: ApUnit; targetPerUnit: number }
 * Response: { generated: number; failed: number; difficulty: { EASY: number; MEDIUM: number; HARD: number } }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, ApUnit, Difficulty, QuestionType } from "@prisma/client";
import { VALID_AP_COURSES, COURSE_REGISTRY } from "@/lib/courses";
import { buildQuestionPrompt } from "@/lib/ai";
import { callAIWithCascade } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const course: ApCourse = body.course && VALID_AP_COURSES.includes(body.course) ? body.course : "AP_WORLD_HISTORY";
  const unit: ApUnit = body.unit;
  const targetPerUnit: number = Math.min(Math.max(body.targetPerUnit ?? 30, 1), 60);

  if (!unit) return NextResponse.json({ error: "unit is required" }, { status: 400 });

  const courseConfig = COURSE_REGISTRY[course];
  if (!courseConfig.units[unit]) return NextResponse.json({ error: "Invalid unit for course" }, { status: 400 });

  // Count existing approved questions for this unit
  const existing = await prisma.question.count({ where: { course, unit, isApproved: true } });
  const needed = Math.max(0, targetPerUnit - existing);

  if (needed === 0) {
    return NextResponse.json({ generated: 0, failed: 0, skipped: true, difficulty: { EASY: 0, MEDIUM: 0, HARD: 0 } });
  }

  const keyThemes = courseConfig.units[unit]?.keyThemes ?? [];
  const queue = buildDifficultyQueue(needed, keyThemes);
  const unitName = courseConfig.units[unit]?.name ?? unit;

  let generated = 0;
  let failed = 0;
  const diffCount = { EASY: 0, MEDIUM: 0, HARD: 0 };

  // Collect questions first, then bulk-insert to minimise individual DB round-trips
  const toInsert: Array<{
    topic: string; subtopic: string; questionText: string; stimulus: string | null;
    options: string[]; correctAnswer: string; explanation: string; difficulty: Difficulty;
  }> = [];

  for (let i = 0; i < queue.length; i++) {
    const { difficulty, topic } = queue[i];
    try {
      const q = await generateOne(course, unit, unitName, difficulty, topic);
      if (q) {
        toInsert.push({ ...q, difficulty });
        diffCount[difficulty]++;
        generated++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
    if (i < queue.length - 1) await sleep(600);
  }

  // Insert questions one at a time (Neon HTTP does not support transactions or multi-row WASM inserts)
  if (toInsert.length > 0) {
    for (const q of toInsert) {
      try {
        await prisma.question.create({
          data: {
            course,
            unit,
            topic: q.topic,
            subtopic: q.subtopic,
            difficulty: q.difficulty,
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
      } catch (err) {
        console.warn("[mega-populate] DB insert failed:", err instanceof Error ? err.message : err);
        failed++;
        generated--;
        diffCount[q.difficulty]--;
      }
    }
  }

  return NextResponse.json({ generated, failed, difficulty: diffCount });
}

// ── Difficulty queue builder — 30% EASY / 50% MEDIUM / 20% HARD ──────────────

function buildDifficultyQueue(
  totalCount: number,
  keyThemes: string[]
): Array<{ difficulty: Difficulty; topic: string | undefined }> {
  const easyTarget = Math.round(totalCount * 0.3);
  const hardTarget = Math.round(totalCount * 0.2);
  const mediumTarget = totalCount - easyTarget - hardTarget;

  const slots: Difficulty[] = [];
  const counts = { EASY: easyTarget, MEDIUM: mediumTarget, HARD: hardTarget };
  const order: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.MEDIUM];
  let placed = 0;
  while (placed < totalCount) {
    let anyPlaced = false;
    for (const d of order) {
      if (placed >= totalCount) break;
      if (counts[d] > 0) {
        slots.push(d);
        counts[d]--;
        placed++;
        anyPlaced = true;
      }
    }
    if (!anyPlaced) break;
  }

  return slots.map((difficulty, i) => ({
    difficulty,
    topic: keyThemes.length > 0 ? keyThemes[i % keyThemes.length] : undefined,
  }));
}

// ── Single question generator ─────────────────────────────────────────────────

async function generateOne(
  course: ApCourse,
  unit: ApUnit,
  unitName: string,
  difficulty: Difficulty,
  topic: string | undefined
): Promise<{ topic: string; subtopic: string; questionText: string; stimulus: string | null; options: string[]; correctAnswer: string; explanation: string } | null> {
  const prompt = buildQuestionPrompt(course, unit, unitName, difficulty, QuestionType.MCQ, topic);
  const raw = await callAIWithCascade(prompt);
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.questionText || !parsed.correctAnswer || !Array.isArray(parsed.options)) return null;

  return {
    topic: parsed.topic ?? topic ?? unitName,
    subtopic: parsed.subtopic ?? "",
    questionText: parsed.questionText,
    stimulus: parsed.stimulus && parsed.stimulus !== "null" ? parsed.stimulus : null,
    options: parsed.options,
    correctAnswer: parsed.correctAnswer.trim().charAt(0).toUpperCase(),
    explanation: parsed.explanation ?? "",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
