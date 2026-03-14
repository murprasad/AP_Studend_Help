/**
 * Automatic question bank top-up logic.
 *
 * Called by the Netlify scheduled function (netlify/functions/auto-populate.ts)
 * every 6 hours to keep every unit above AUTO_POPULATE_TARGET approved questions.
 *
 * Constraints (CLAUDE.md):
 *   - No prisma.$transaction — Neon HTTP adapter does not support it.
 *   - Each question inserted with individual prisma.question.create.
 *   - 600ms delay between AI calls to respect Groq rate limits.
 */

import { ApCourse, ApUnit, Difficulty, QuestionType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { COURSE_REGISTRY, VALID_AP_COURSES } from "./courses";
import { buildQuestionPrompt } from "./ai";
import { callAIWithCascade } from "./ai-providers";

/** Minimum approved questions to maintain per unit. */
export const AUTO_POPULATE_TARGET = 50;

/** Max units processed per scheduled run (keeps runtime under 15 min Netlify limit). */
export const MAX_UNITS_PER_RUN = 10;

// ── Difficulty queue builder — 30% EASY / 50% MEDIUM / 20% HARD ──────────────
// Exported so admin routes can import it instead of duplicating.

export function buildDifficultyQueue(
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

// ── Main auto-populate function ───────────────────────────────────────────────

export interface AutoPopulateResult {
  processed: number;
  skipped: number;
  generated: number;
  failed: number;
  details: Array<{ course: string; unit: string; added: number }>;
}

export async function runAutoPopulate(): Promise<AutoPopulateResult> {
  // 1. Count current approved questions per (course, unit)
  const allCounts = await prisma.question.groupBy({
    by: ["course", "unit"],
    where: { isApproved: true },
    _count: { id: true },
  });
  const countMap = new Map(allCounts.map((c) => [`${c.course}::${c.unit}`, c._count.id]));

  // 2. Find all units below target, sorted most critical first
  type UnitJob = { course: ApCourse; unit: ApUnit; current: number; needed: number; keyThemes: string[] };
  const needsWork: UnitJob[] = [];

  for (const course of VALID_AP_COURSES) {
    const config = COURSE_REGISTRY[course];
    for (const [unit, unitMeta] of Object.entries(config.units) as [ApUnit, typeof config.units[ApUnit]][]) {
      const current = countMap.get(`${course}::${unit}`) ?? 0;
      if (current < AUTO_POPULATE_TARGET) {
        needsWork.push({
          course,
          unit,
          current,
          needed: AUTO_POPULATE_TARGET - current,
          keyThemes: unitMeta?.keyThemes ?? [],
        });
      }
    }
  }

  needsWork.sort((a, b) => a.current - b.current);
  const toProcess = needsWork.slice(0, MAX_UNITS_PER_RUN);

  // 3. Generate questions for each unit
  let generated = 0;
  let failed = 0;
  const details: Array<{ course: string; unit: string; added: number }> = [];

  for (const { course, unit, needed, keyThemes } of toProcess) {
    const config = COURSE_REGISTRY[course];
    const unitName = config.units[unit]?.name ?? unit;
    const queue = buildDifficultyQueue(needed, keyThemes);
    let added = 0;

    // For AP World History (30%) and AP Physics 1 (20%), mix in SAQ to build FRQ question bank
    const frqRatio = course === "AP_WORLD_HISTORY" ? 0.3 : course === "AP_PHYSICS_1" ? 0.2 : 0;

    for (let i = 0; i < queue.length; i++) {
      const { difficulty, topic } = queue[i];
      // Assign question type: every 3rd question is SAQ for World History, every 5th for Physics
      const questionType =
        frqRatio > 0 &&
        ((course === "AP_WORLD_HISTORY" && i % 3 === 2) ||
         (course === "AP_PHYSICS_1" && i % 5 === 4))
          ? QuestionType.SAQ
          : QuestionType.MCQ;
      try {
        const q = await generateOneQuestion(course, unit, unitName, difficulty, topic, questionType);
        if (q) {
          await prisma.question.create({
            data: {
              course,
              unit,
              topic: q.topic,
              subtopic: q.subtopic,
              difficulty,
              questionType,
              questionText: q.questionText,
              stimulus: q.stimulus ?? null,
              options: questionType === QuestionType.MCQ ? (q.options ?? Prisma.JsonNull) : Prisma.JsonNull,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              isAiGenerated: true,
              isApproved: true,
            },
          });
          added++;
          generated++;
        } else {
          failed++;
        }
      } catch (err) {
        console.warn(`[auto-populate] Failed q ${i + 1} for ${course}/${unit}:`, err instanceof Error ? err.message : err);
        failed++;
      }
      if (i < queue.length - 1) await sleep(600);
    }

    details.push({ course, unit, added });
    console.log(`[auto-populate] ${course}/${unit}: +${added} questions`);
  }

  return {
    processed: toProcess.length,
    skipped: needsWork.length - toProcess.length,
    generated,
    failed,
    details,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function generateOneQuestion(
  course: ApCourse,
  unit: ApUnit,
  unitName: string,
  difficulty: Difficulty,
  topic: string | undefined,
  questionType: QuestionType = QuestionType.MCQ
): Promise<{ topic: string; subtopic: string; questionText: string; stimulus: string | null; options: string[]; correctAnswer: string; explanation: string } | null> {
  const prompt = buildQuestionPrompt(course, unit, unitName, difficulty, questionType, topic);
  const raw = await callAIWithCascade(prompt);
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.questionText || !parsed.correctAnswer) return null;
  if (questionType === QuestionType.MCQ && !Array.isArray(parsed.options)) return null;

  return {
    topic: parsed.topic ?? topic ?? unitName,
    subtopic: parsed.subtopic ?? "",
    questionText: parsed.questionText,
    stimulus: parsed.stimulus && parsed.stimulus !== "null" ? parsed.stimulus : null,
    options: parsed.options,
    correctAnswer: questionType === QuestionType.MCQ
      ? parsed.correctAnswer.trim().charAt(0).toUpperCase()
      : parsed.correctAnswer.trim(),
    explanation: parsed.explanation ?? "",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
