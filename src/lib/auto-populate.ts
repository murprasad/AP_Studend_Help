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
// Deterministic gates + LLM judge — wired in 2026-05-07 to mirror PrepLion's
// PR #18/#20. Stops bad questions reaching isApproved=true. Same 4-class
// audit as scripts/sweep-leaks-and-audit.ts and scripts/llm-audit-formula-mcq.mjs.
import { validateMcqStructure } from "./options";
import { validateAnswerNumericMatch, validateExplanationMath } from "./math-validator";
import { validateDistractorIntegrity } from "./distractor-leak-validator";
import { judgeMcq } from "./llm-judge";
import { getWikipediaSummary } from "./edu-apis";

/** Minimum approved questions to maintain per unit. */
export const AUTO_POPULATE_TARGET = 50;

/** Max units processed per scheduled run. */
export const MAX_UNITS_PER_RUN = 10;

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
          // CLEP quality heuristic: scenario-based check (vestigial — CLEP
          // is now on PrepLion; kept harmless for any leftover StudentNest
          // CLEP rows).
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

          // Deterministic gates (2026-05-07): catch correctAnswer-mismatch,
          // distractor leaks, structural breakage, math-derivation errors.
          // Applied to ALL MCQs (AP/SAT/ACT and any leftover CLEP).
          if (shouldAutoApprove && questionType === QuestionType.MCQ) {
            const opts = Array.isArray(q.options) ? q.options : [];
            const ca = String(q.correctAnswer ?? "");
            const structErr = validateMcqStructure(opts, ca);
            const matchErr = validateAnswerNumericMatch(opts, ca, q.explanation ?? null);
            const mathErr = validateExplanationMath(q.explanation ?? null);
            const leakErr = validateDistractorIntegrity(opts, ca);
            const gateFailures: string[] = [];
            if (structErr) gateFailures.push(`structural: ${structErr}`);
            if (matchErr) gateFailures.push(`answer-match: ${matchErr}`);
            if (mathErr) gateFailures.push(`math: ${mathErr}`);
            if (leakErr) gateFailures.push(`distractor: ${leakErr}`);
            if (gateFailures.length > 0) {
              shouldAutoApprove = false;
              console.log(`[auto-populate] ${course}/${unit}: GATE_FAIL — ${gateFailures.join("; ")}`);
            }
          }

          // LLM judge (2026-05-07): final gate. Catches LETTER_MISMATCH /
          // CONTRADICTION / LABEL_MISMATCH that deterministic gates miss
          // on symbolic/formula MCQs. Fail-open: judge unavailable doesn't
          // block (deterministic gate verdict still applies).
          if (shouldAutoApprove && questionType === QuestionType.MCQ) {
            const opts = Array.isArray(q.options) ? q.options : [];
            const ca = String(q.correctAnswer ?? "");
            const judgeRes = await judgeMcq({
              questionText: q.questionText,
              options: opts,
              correctAnswer: ca,
              explanation: q.explanation,
            });
            if (!judgeRes.ok) {
              shouldAutoApprove = false;
              console.log(`[auto-populate] ${course}/${unit}: LLM_JUDGE_FAIL [${judgeRes.verdict}] — ${judgeRes.reason}`);
            } else if (judgeRes.fallback) {
              console.log(`[auto-populate] ${course}/${unit}: LLM judge unavailable (${judgeRes.reason}) — relying on deterministic gates`);
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
              bloomLevel: q.bloomLevel ?? null,
              apSkill: q.apSkill ?? null,
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

// ── Difficulty Audit — flag questions whose empirical difficulty diverges from label ─
// Research shows AI questions tend to be easier than intended (p=0.78 vs human p=0.69).
// This function identifies and flags miscalibrated questions using student response data.

export interface DifficultyAuditResult {
  audited: number;
  flagged: number;
  recalibrated: number;
  details: Array<{ questionId: string; difficulty: string; pValue: number; action: string }>;
}

/**
 * Audits questions with sufficient response data and flags those whose empirical
 * difficulty diverges significantly from their labeled difficulty.
 *
 * Thresholds (based on CLEP exam calibration research):
 *   EASY labeled but p < 0.40 → too hard, flag for review
 *   MEDIUM labeled but p < 0.25 or p > 0.85 → miscalibrated
 *   HARD labeled but p > 0.70 → too easy, flag for review
 *
 * @param minResponses - Minimum responses needed for stable p-value estimate (default 20)
 * @param autoRecalibrate - If true, auto-correct the difficulty label instead of just flagging
 */
export async function runDifficultyAudit(
  minResponses: number = 20,
  autoRecalibrate: boolean = false,
): Promise<DifficultyAuditResult> {
  // Find questions with enough responses to compute reliable p-values
  const questions = await prisma.question.findMany({
    where: {
      isApproved: true,
      timesAnswered: { gte: minResponses },
    },
    select: {
      id: true,
      difficulty: true,
      timesAnswered: true,
      timesCorrect: true,
      course: true,
      unit: true,
      topic: true,
    },
  });

  let flagged = 0;
  let recalibrated = 0;
  const details: DifficultyAuditResult["details"] = [];

  for (const q of questions) {
    const pValue = (q.timesCorrect ?? 0) / (q.timesAnswered ?? 1);
    let action = "";
    let newDifficulty: Difficulty | null = null;

    if (q.difficulty === Difficulty.EASY && pValue < 0.40) {
      // Labeled EASY but only 40% get it right → actually MEDIUM or HARD
      newDifficulty = pValue < 0.25 ? Difficulty.HARD : Difficulty.MEDIUM;
      action = `EASY (p=${pValue.toFixed(2)}) → ${newDifficulty}`;
    } else if (q.difficulty === Difficulty.MEDIUM && pValue > 0.85) {
      // Labeled MEDIUM but 85%+ get it right → actually EASY
      newDifficulty = Difficulty.EASY;
      action = `MEDIUM (p=${pValue.toFixed(2)}) → EASY`;
    } else if (q.difficulty === Difficulty.MEDIUM && pValue < 0.25) {
      // Labeled MEDIUM but only 25% get it right → actually HARD
      newDifficulty = Difficulty.HARD;
      action = `MEDIUM (p=${pValue.toFixed(2)}) → HARD`;
    } else if (q.difficulty === Difficulty.HARD && pValue > 0.70) {
      // Labeled HARD but 70%+ get it right → actually MEDIUM or EASY
      newDifficulty = pValue > 0.85 ? Difficulty.EASY : Difficulty.MEDIUM;
      action = `HARD (p=${pValue.toFixed(2)}) → ${newDifficulty}`;
    }

    if (newDifficulty) {
      flagged++;
      if (autoRecalibrate) {
        await prisma.question.update({
          where: { id: q.id },
          data: { difficulty: newDifficulty },
        });
        recalibrated++;
        action += " [auto-recalibrated]";
      } else {
        // Just flag — set isApproved to false for admin review
        await prisma.question.update({
          where: { id: q.id },
          data: { isApproved: false },
        });
        action += " [flagged for review]";
      }
      details.push({ questionId: q.id, difficulty: q.difficulty, pValue, action });
      console.log(`[difficulty-audit] ${q.course}/${q.unit} Q:${q.id.slice(0, 8)} — ${action}`);
    }
  }

  console.log(`[difficulty-audit] Audited ${questions.length} questions, flagged ${flagged}, recalibrated ${recalibrated}`);
  return { audited: questions.length, flagged, recalibrated, details };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function generateOneQuestion(
  course: ApCourse,
  unit: ApUnit,
  unitName: string,
  difficulty: Difficulty,
  topic: string | undefined,
  questionType: QuestionType = QuestionType.MCQ
): Promise<{ topic: string; subtopic: string; questionText: string; stimulus: string | null; stimulusImageUrl: string | null; options: string[]; correctAnswer: string; explanation: string; bloomLevel?: string; apSkill?: string } | null> {
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
      bloomLevel: parsed.bloomLevel ?? undefined,
      apSkill: parsed.apSkill ?? undefined,
    };
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
