/**
 * Phase C — RAG-grounded question generator.
 *
 * Replaces the old ungrounded "CB-style" prompt with a retrieval-
 * augmented prompt that injects 3-5 REAL samples from OfficialSample
 * as style exemplars. The model is instructed to generate an ORIGINAL
 * question matching their style, rigor, topic alignment, and vocabulary.
 *
 * Every generated question is then validated via the SME validator
 * before being marked isApproved=true.
 *
 * This module is consumer-agnostic — it doesn't know about bulk-gen,
 * individual request, or any specific orchestrator. Those live in
 * scripts/regen-*.
 *
 * Key design points:
 *   - Retrieval prefers CB/ACT/real-publisher sources over Modern
 *     States or OpenStax (tier-weighted).
 *   - Exemplars include correctAnswer + explanation so the model
 *     learns the distractor pattern, not just the stem style.
 *   - `{ maxTokens, temperature }` overridable per call.
 */

import { PrismaClient } from "@prisma/client";
import { callAIWithCascade } from "@/lib/ai-providers";
import { validateSme } from "@/lib/sme-validator";

const prisma = new PrismaClient();

export type GroundingRequest = {
  course: string;
  unit?: string | null;
  questionType?: "MCQ" | "FRQ" | "SAQ" | "DBQ" | "LEQ" | "AAQ" | "EBQ" | "ESSAY";
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  subtopic?: string;
  numExemplars?: number;
  maxTokens?: number;
  temperature?: number;
};

export type GeneratedQuestion = {
  questionText: string;
  stimulus?: string | null;
  options?: string[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic?: string;
  subtopic?: string;
};

export type GroundedGenerationResult =
  | { ok: true; question: GeneratedQuestion; exemplarIds: string[]; modelUsed: string }
  | { ok: false; reason: string; exemplarIds: string[] };

/**
 * Source priority — lower numbers retrieved first.
 * Real publisher sources outrank community/textbook sources.
 */
function sourcePriority(sourceName: string | null): number {
  if (!sourceName) return 99;
  const s = sourceName.toLowerCase();
  // Tier 1 — official publisher
  if (/college board|collegeboard|act, inc|prometric|dantes/.test(s)) return 1;
  // Tier 2 — CB-partnered
  if (/modern states|khan academy/.test(s)) return 2;
  // Tier 3 — peer-reviewed / open-licensed
  if (/openstax|mit opencourseware|aops|art of problem solving/.test(s)) return 3;
  // Tier 3+ — fact sheets / other official
  if (/fact sheet/.test(s)) return 1;
  return 4;
}

/**
 * Retrieve exemplars for grounding. Prioritises (course, unit, type)
 * match, then relaxes to (course, type), then (course, *).
 */
export async function retrieveExemplars(req: GroundingRequest): Promise<Array<{
  id: string;
  questionText: string;
  stimulus?: string | null;
  options?: string[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  questionType: string;
  sourceName: string;
  sourceUrl: string;
  unit?: string | null;
}>> {
  const n = req.numExemplars ?? 5;
  const qtype = req.questionType ?? "MCQ";

  // Tier 1: exact (course, unit, type)
  let rows = await prisma.officialSample.findMany({
    where: {
      course: req.course,
      ...(req.unit ? { unit: req.unit } : {}),
      questionType: qtype,
    },
    take: n * 3, // overfetch so we can re-rank by source priority
  });

  // Tier 2: (course, type) if not enough
  if (rows.length < n) {
    const extra = await prisma.officialSample.findMany({
      where: { course: req.course, questionType: qtype },
      take: n * 3,
    });
    // Merge + dedupe on id
    const seen = new Set(rows.map((r) => r.id));
    for (const e of extra) if (!seen.has(e.id)) rows.push(e);
  }

  // Tier 3: (course, *) if still not enough
  if (rows.length < n) {
    const extra = await prisma.officialSample.findMany({
      where: { course: req.course },
      take: n * 3,
    });
    const seen = new Set(rows.map((r) => r.id));
    for (const e of extra) if (!seen.has(e.id)) rows.push(e);
  }

  // Re-rank by source priority (lower = higher priority)
  rows.sort((a, b) => sourcePriority(a.sourceName) - sourcePriority(b.sourceName));

  return rows.slice(0, n).map((r) => ({
    id: r.id,
    questionText: r.questionText,
    stimulus: r.stimulus,
    options: Array.isArray(r.options) ? (r.options as string[]) : null,
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
    questionType: r.questionType,
    sourceName: r.sourceName,
    sourceUrl: r.sourceUrl,
    unit: r.unit,
  }));
}

/**
 * Build the RAG-grounded generation prompt. Inserts the exemplars
 * verbatim with clear labelling so the model knows these are style
 * targets, not content to echo.
 */
function buildPrompt(req: GroundingRequest, exemplars: Awaited<ReturnType<typeof retrieveExemplars>>): string {
  const qtype = req.questionType ?? "MCQ";
  const header = `You are generating an ORIGINAL practice question for ${req.course}${req.unit ? `, unit ${req.unit}` : ""} that matches the style, rigor, topic alignment, and vocabulary of real released exam content.

QUESTION TYPE: ${qtype}
${req.difficulty ? `DIFFICULTY: ${req.difficulty}\n` : ""}${req.subtopic ? `SUBTOPIC: ${req.subtopic}\n` : ""}
Below are ${exemplars.length} REAL released sample questions from official sources. Use them as STYLE + RIGOR + FORMAT targets. Generate an ORIGINAL question — do NOT copy or closely paraphrase any exemplar. Match:
  - Stem length and phrasing convention
  - Answer option structure (${qtype === "MCQ" ? "4 options A-D with exact letter prefixes" : "per the question type's format"})
  - Distractor pattern (wrong answers should be plausibly attractive based on specific misconceptions)
  - Explanation style (confirm correct + 1 sentence per wrong option explaining the trap)
  - Vocabulary (use phrases CB/ACT/DANTES actually use, not synonyms)

EXEMPLARS:
`;

  const exemplarBlocks = exemplars
    .map((e, i) => {
      let block = `\n--- EXEMPLAR ${i + 1} (source: ${e.sourceName}) ---\n`;
      if (e.stimulus) block += `STIMULUS:\n${e.stimulus}\n\n`;
      block += `QUESTION: ${e.questionText}\n`;
      if (Array.isArray(e.options)) block += `OPTIONS:\n${e.options.join("\n")}\n`;
      if (e.correctAnswer) block += `CORRECT: ${e.correctAnswer}\n`;
      if (e.explanation) block += `EXPLANATION: ${e.explanation.slice(0, 400)}\n`;
      return block;
    })
    .join("\n");

  const tail = `

NOW GENERATE ONE ORIGINAL ${qtype} QUESTION IN JSON FORMAT (no markdown fences, no commentary):
{
  "questionText": "...",
  ${qtype === "MCQ" ? '"options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n  "correctAnswer": "A|B|C|D",\n  ' : ""}"explanation": "Confirming sentence for correct + trap analysis per wrong option.",
  "difficulty": "EASY|MEDIUM|HARD",
  "topic": "specific topic",
  "subtopic": "specific subtopic if applicable"
}

CRITICAL RULES:
1. The question must be completely ORIGINAL. It MUST cover a different problem/scenario than any exemplar.
2. If MCQ: exactly 4 options, letter prefixes "A) ", "B) ", "C) ", "D) ", correctAnswer is the single letter A/B/C/D.
3. The explanation must start with "{correctAnswer} is correct" (matching the letter) followed by reasoning.
4. No placeholder text. No "[FIGURE]" / "[image]" references — if you need a stimulus, include it verbatim.
5. Math/science content must be CORRECT — verify step-by-step.
6. Use the exact vocabulary and sentence patterns of the exemplar source.`;

  return header + exemplarBlocks + tail;
}

function tryParseJson(s: string): Record<string, unknown> | null {
  // Model sometimes wraps in ```json fences
  const cleaned = s.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting the first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

export async function generateGrounded(req: GroundingRequest): Promise<GroundedGenerationResult> {
  const exemplars = await retrieveExemplars(req);
  if (exemplars.length === 0) {
    return { ok: false, reason: "no_exemplars_available", exemplarIds: [] };
  }

  const prompt = buildPrompt(req, exemplars);
  // callAIWithCascade(prompt, systemPrompt?, history?, maxRetries?) → Promise<string>.
  // maxTokens/temperature are fixed inside each provider adapter — not tunable here.
  const text = await callAIWithCascade(prompt);
  const parsed = tryParseJson(text);
  if (!parsed) {
    return { ok: false, reason: "model_output_not_json", exemplarIds: exemplars.map((e) => e.id) };
  }

  const question: GeneratedQuestion = {
    questionText: String(parsed.questionText || ""),
    stimulus: typeof parsed.stimulus === "string" ? parsed.stimulus : null,
    options: Array.isArray(parsed.options) ? (parsed.options as string[]) : null,
    correctAnswer: typeof parsed.correctAnswer === "string" ? parsed.correctAnswer : null,
    explanation: typeof parsed.explanation === "string" ? parsed.explanation : null,
    difficulty: (parsed.difficulty as "EASY" | "MEDIUM" | "HARD") || "MEDIUM",
    topic: typeof parsed.topic === "string" ? parsed.topic : undefined,
    subtopic: typeof parsed.subtopic === "string" ? parsed.subtopic : undefined,
  };

  // SME validation gate
  const smeInput = {
    questionText: question.questionText,
    stimulus: question.stimulus,
    options: question.options,
    correctAnswer: question.correctAnswer || "",
    explanation: question.explanation || "",
    course: req.course,
  };
  const smeResult = validateSme(smeInput);
  if (!smeResult.ok) {
    return {
      ok: false,
      reason: "sme_validation_failed:" + smeResult.failures.join(","),
      exemplarIds: exemplars.map((e) => e.id),
    };
  }

  return {
    ok: true,
    question,
    exemplarIds: exemplars.map((e) => e.id),
    modelUsed: "cascade", // callAIWithCascade returns text only; provider identity not exposed
  };
}
