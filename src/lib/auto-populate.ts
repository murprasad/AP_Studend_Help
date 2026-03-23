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
import { callAIWithCascade, validateQuestion } from "./ai-providers";
import { getWikipediaSummary } from "./edu-apis";

/** Minimum approved questions to maintain per unit. */
export const AUTO_POPULATE_TARGET = 50;

/** Max units processed per scheduled run. */
export const MAX_UNITS_PER_RUN = 3;

/**
 * Max questions generated per cron invocation.
 * Cloudflare Pages has a ~100s HTTP timeout — at ~8s/question this gives
 * a safe limit of 5 questions per call. GitHub Actions loops multiple times.
 */
export const MAX_QUESTIONS_PER_RUN = 5;

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

export async function runAutoPopulate(
  threshold: number = AUTO_POPULATE_TARGET,
  targetPerUnit: number = AUTO_POPULATE_TARGET,
  maxQuestionsTotal: number = MAX_QUESTIONS_PER_RUN,
): Promise<AutoPopulateResult> {
  // 1. Count current approved questions per (course, unit)
  const allCounts = await prisma.question.groupBy({
    by: ["course", "unit"],
    where: { isApproved: true },
    _count: { id: true },
  });
  const countMap = new Map(allCounts.map((c) => [`${c.course}::${c.unit}`, c._count.id]));

  // 2. Find all units below threshold, sorted most critical first
  type UnitJob = { course: ApCourse; unit: ApUnit; current: number; needed: number; keyThemes: string[] };
  const needsWork: UnitJob[] = [];

  for (const course of VALID_AP_COURSES) {
    const config = COURSE_REGISTRY[course];
    const unitCount = Object.keys(config.units).length;
    for (const [unit, unitMeta] of Object.entries(config.units) as [ApUnit, typeof config.units[ApUnit]][]) {
      const current = countMap.get(`${course}::${unit}`) ?? 0;
      // When topicWeights are available, scale the target per unit by CB exam weight.
      // A unit with weight 0.35 gets 35% of total course target (targetPerUnit * unitCount * weight).
      const weight = config.topicWeights?.[unit];
      const unitTarget = weight
        ? Math.max(Math.round(targetPerUnit * unitCount * weight), Math.round(targetPerUnit * 0.5))
        : targetPerUnit;
      if (current < Math.min(unitTarget, threshold)) {
        needsWork.push({
          course,
          unit,
          current,
          needed: unitTarget - current,
          keyThemes: unitMeta?.keyThemes ?? [],
        });
      }
    }
  }

  needsWork.sort((a, b) => a.current - b.current);
  const toProcess = needsWork.slice(0, MAX_UNITS_PER_RUN);

  // 3. Generate questions for each unit (capped at maxQuestionsTotal)
  let generated = 0;
  let failed = 0;
  const details: Array<{ course: string; unit: string; added: number }> = [];

  for (const { course, unit, needed, keyThemes } of toProcess) {
    if (generated + failed >= maxQuestionsTotal) break;
    const config = COURSE_REGISTRY[course];
    const unitName = config.units[unit]?.name ?? unit;
    const cappedNeeded = Math.min(needed, maxQuestionsTotal - generated - failed);
    const queue = buildDifficultyQueue(cappedNeeded, keyThemes);
    let added = 0;

    // Mix in FRQ/SAQ at different rates depending on course type
    // History courses: SAQ (every 3rd = ~30%)
    // STEM calculation courses: FRQ (every 5th = ~20%)
    // CSP: CODING (every 5th = ~20%)
    const histCourses = new Set(["AP_WORLD_HISTORY", "AP_US_HISTORY"]);
    const frqStemCourses = new Set(["AP_PHYSICS_1", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
                                    "AP_STATISTICS", "AP_CHEMISTRY", "AP_BIOLOGY", "AP_PSYCHOLOGY"]);
    const codingCourses = new Set(["AP_COMPUTER_SCIENCE_PRINCIPLES"]);

    for (let i = 0; i < queue.length; i++) {
      const { difficulty, topic } = queue[i];
      // Assign question type based on course category
      let questionType: QuestionType = QuestionType.MCQ;
      if (histCourses.has(course) && i % 3 === 2) {
        questionType = QuestionType.SAQ;
      } else if (frqStemCourses.has(course) && i % 5 === 4) {
        questionType = QuestionType.FRQ;
      } else if (codingCourses.has(course) && i % 5 === 4) {
        questionType = QuestionType.CODING;
      }
      try {
        const q = await generateOneQuestion(course, unit, unitName, difficulty, topic, questionType);
        if (q) {
          // CLEP quality heuristic: scenario-based check for MCQs
          const isCLEPCourse = (course as string).startsWith("CLEP_");
          let shouldAutoApprove = true;
          if (isCLEPCourse && questionType === QuestionType.MCQ) {
            const qText = q.questionText || "";
            const expl = q.explanation || "";
            const isScenarioBased = /\b(observes?|discovers?|researcher|student|company|experiment|study|data\s+shows?|according\s+to|finds?\s+that|argues?\s+that|reports?\s+that|notices?\s+that|scenario|situation|case)\b/i.test(qText);
            const explanationQuality = /\b(incorrect|wrong|because|however|unlike|rather\s+than|instead|not\s+the\s+same|different\s+from|confused\s+with)\b/i.test(expl);
            shouldAutoApprove = isScenarioBased && explanationQuality;
            if (!shouldAutoApprove) {
              console.log(`[auto-populate] ${course}/${unit}: flagged for review (not scenario-based or weak explanation)`);
            }
          }

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
              stimulusImageUrl: q.stimulusImageUrl ?? null,
              options: questionType === QuestionType.MCQ ? (q.options ?? Prisma.JsonNull) : Prisma.JsonNull,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              isAiGenerated: true,
              isApproved: shouldAutoApprove,
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
): Promise<{ topic: string; subtopic: string; questionText: string; stimulus: string | null; stimulusImageUrl: string | null; options: string[]; correctAnswer: string; explanation: string } | null> {
  const prompt = buildQuestionPrompt(course, unit, unitName, difficulty, questionType, topic);
  const needsValidation = questionType === QuestionType.MCQ;
  const config = COURSE_REGISTRY[course];
  const difficultyRubricEntry = config.difficultyRubric?.[difficulty];

  const MAX_ATTEMPTS = needsValidation ? 3 : 1;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await callAIWithCascade(prompt);
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) continue;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.questionText || !parsed.correctAnswer) continue;
    if (questionType === QuestionType.MCQ && !Array.isArray(parsed.options)) continue;

    // Validate MCQ quality — skip validation for open-ended types
    if (needsValidation) {
      const validation = await validateQuestion(JSON.stringify(parsed), difficulty, difficultyRubricEntry, course as string);
      if (!validation.approved) {
        console.warn(`[auto-populate] Attempt ${attempt} rejected: ${validation.reason}`);
        if (attempt === MAX_ATTEMPTS) return null;
        continue;
      }
    }

    // Fetch Wikipedia image for World History questions that provide a topic hint
    let stimulusImageUrl: string | null = null;
    if (course === "AP_WORLD_HISTORY" && parsed.wikiImageTopic && parsed.wikiImageTopic !== "null") {
      try {
        const wikiResult = await Promise.race([
          getWikipediaSummary(parsed.wikiImageTopic),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
        stimulusImageUrl = (wikiResult as Awaited<ReturnType<typeof getWikipediaSummary>>)?.imageUrl ?? null;
      } catch {
        stimulusImageUrl = null;
      }
    }

    return {
      topic: parsed.topic ?? topic ?? unitName,
      subtopic: parsed.subtopic ?? "",
      questionText: parsed.questionText,
      stimulus: parsed.stimulus && parsed.stimulus !== "null" ? parsed.stimulus : null,
      stimulusImageUrl,
      options: parsed.options,
      correctAnswer: questionType === QuestionType.MCQ
        ? parsed.correctAnswer.trim().charAt(0).toUpperCase()
        : parsed.correctAnswer.trim(),
      explanation: parsed.explanation ?? "",
    };
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
