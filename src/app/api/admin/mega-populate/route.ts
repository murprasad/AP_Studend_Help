/**
 * POST /api/admin/mega-populate
 *
 * Generates questions for ONE unit at a time (CF-safe, no timeout risk).
 * The client orchestrates the unit-by-unit loop.
 *
 * Body: { course: ApCourse; unit: ApUnit; targetPerUnit: number }
 * Response: { generated: number; failed: number; difficulty: { EASY: number; MEDIUM: number; HARD: number } }
 */

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, ApUnit, Difficulty, QuestionType, SubTier } from "@prisma/client";
import { VALID_AP_COURSES, COURSE_REGISTRY } from "@/lib/courses";
import { generateQuestion } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const course: ApCourse = body.course && VALID_AP_COURSES.includes(body.course) ? body.course : "AP_WORLD_HISTORY";
  const unit: ApUnit = body.unit;
  const targetPerUnit: number = Math.min(Math.max(body.targetPerUnit ?? 30, 1), 150);

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

  // Save-as-you-generate: each Q is inserted to DB right after it's generated.
  // If the client aborts mid-run, everything generated so far is persisted.
  for (let i = 0; i < queue.length; i++) {
    const { difficulty, topic } = queue[i];
    try {
      const q = await generateOne(course, unit, unitName, difficulty, topic);
      if (!q) {
        failed++;
        if (i < queue.length - 1) await sleep(600);
        continue;
      }
      try {
        await prisma.question.create({
          data: {
            course,
            unit,
            topic: q.topic,
            subtopic: q.subtopic,
            difficulty,
            questionType: QuestionType.MCQ,
            questionText: q.questionText,
            stimulus: q.stimulus ?? null,
            options: q.options ?? null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            isAiGenerated: true,
            isApproved: true,
            modelUsed: null,
            generatedForTier: "PREMIUM" as SubTier,
            contentHash: q.contentHash ?? null,
            apSkill: q.apSkill ?? null,
            bloomLevel: q.bloomLevel ?? null,
          },
        });
        diffCount[difficulty]++;
        generated++;
      } catch (err) {
        const errCode = (err as { code?: string })?.code;
        if (errCode === "P2002") {
          console.warn("[mega-populate] Duplicate question skipped");
          failed++;
        } else {
          console.warn("[mega-populate] DB insert failed:", err instanceof Error ? err.message : err);
          failed++;
        }
      }
    } catch {
      failed++;
    }
    if (i < queue.length - 1) await sleep(600);
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
// Delegates to generateQuestion() in src/lib/ai.ts which includes:
//   - AP calibration examples (2-shot)
//   - Grounded content (Wikipedia/OpenStax/MIT OCW/DIG/Smithsonian) via getUnitContext
//   - Structural checks (option count, stimulus integrity, pseudocode syntax, explanation length)
//   - Cross-model validation (generator Haiku → validator Sonnet-4-6)
//   - Retry with rejection-reason feedback (3 attempts)

async function generateOne(
  course: ApCourse,
  unit: ApUnit,
  _unitName: string,
  difficulty: Difficulty,
  topic: string | undefined
): Promise<{ topic: string; subtopic: string; questionText: string; stimulus: string | null; options: string[]; correctAnswer: string; explanation: string; apSkill?: string; bloomLevel?: string; contentHash: string } | null> {
  void _unitName; // generateQuestion looks up unitName from COURSE_REGISTRY internally
  try {
    const q = await generateQuestion(
      unit, difficulty, QuestionType.MCQ, topic, course, "PREMIUM", undefined, false,
      { generatorOverride: process.env.BULK_USE_SONNET === "1" ? "sonnet" : undefined }
    );
    if (!q || !q.options || q.options.length === 0) return null;

    // Compute content hash for dedup
    const normalized = q.questionText.toLowerCase().replace(/\s+/g, " ").trim();
    const contentHash = createHash("sha256").update(normalized).digest("hex");

    return {
      topic: q.topic,
      subtopic: q.subtopic,
      questionText: q.questionText,
      stimulus: q.stimulus && q.stimulus !== "null" ? q.stimulus : null,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      apSkill: q.apSkill,
      bloomLevel: q.bloomLevel,
      contentHash,
    };
  } catch (err) {
    console.warn(`[mega-populate] generateQuestion failed for ${course}/${unit}/${difficulty}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
