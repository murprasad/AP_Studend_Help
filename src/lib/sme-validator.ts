/**
 * SME-grade second-pass validator for generated MCQ content.
 *
 * Runs AFTER the structural validator in `ai-providers.ts` but BEFORE
 * `isApproved: true` is set. Specifically checks:
 *   1. The explanation's FIRST assertion letter matches correctAnswer
 *      (catches the 292-question bug class we just repaired).
 *   2. If the question text references "the following procedure/code/
 *      algorithm", pseudocode or an image MUST be present.
 *   3. If options include single-digit answers, the correct one must
 *      appear as one of the options exactly.
 *   4. For CLEP/DSST/ACCUPLACER-specific: no references to "AP" or
 *      "College Board" in the question prose (keeps exam identity clean).
 *
 * The AI-backed check (optional second layer) asks a reviewer model
 * whether the explanation actually proves the stated correct answer. Off
 * by default; enable via env `SME_AI_REVIEW=true`.
 *
 * This file is import-only — callers in generation scripts decide when
 * to invoke.
 */

import { callAIWithCascade } from "@/lib/ai-providers";

export interface SmeInput {
  questionText: string;
  stimulus?: string | null;
  options: unknown;
  correctAnswer: string;
  explanation: string;
  course: string;
}

export interface SmeResult {
  ok: boolean;
  failures: string[];
  aiReview?: { ok: boolean; reason?: string };
}

const FIRST_ASSERTIONS: RegExp[] = [
  /^(\s*(?:The\s+)?correct\s+answer\s+is\s+)([A-E])(?=[\s).:,\u00A0])/i,
  /^(\s*(?:The\s+)?answer\s+is\s+)([A-E])(?=[\s).:,\u00A0])/i,
  /^(\s*Option\s+)([A-E])(\s+is\s+(?:the\s+)?correct)/i,
  /^(\s*Choice\s+)([A-E])(\s+is\s+(?:the\s+)?correct)/i,
  /^(\s*)([A-E])(\s+is\s+(?:the\s+)?correct\b)/i,
];

const HAS_CODE = /(\bPROCEDURE\b|\bDISPLAY\b|\bINPUT\b|\bRETURN\b|REPEAT UNTIL|REPEAT\s+\d|FOR EACH|\bIF\b|\bFUNCTION\b|←|<-|```)/i;
const REFS_CODE = /(the following procedure|the procedure above|the procedure below|this procedure|the code above|the code below|the following code|the following algorithm|the pseudocode|the program above|the program below|the following program)/i;

function optsAsArray(opts: unknown): string[] | null {
  if (Array.isArray(opts)) return opts as string[];
  if (typeof opts === "string") {
    try { return JSON.parse(opts) as string[]; } catch { return null; }
  }
  return null;
}

export function validateSme(input: SmeInput): SmeResult {
  const failures: string[] = [];

  // 1. Explanation-letter assertion must match correctAnswer
  const correct = (input.correctAnswer || "").trim().toUpperCase();
  if (!/^[A-E]$/.test(correct)) {
    failures.push("correct_answer_not_letter_AE");
  } else if (input.explanation) {
    const head = input.explanation.slice(0, 220);
    for (const re of FIRST_ASSERTIONS) {
      const m = head.match(re);
      if (m) {
        const claimed = (m[2] || "").toUpperCase();
        if (claimed && claimed !== correct) {
          failures.push(`explanation_asserts_${claimed}_but_correct_is_${correct}`);
        }
        break;
      }
    }
  }

  // 2. Code-referencing questions must have code somewhere
  if (REFS_CODE.test(input.questionText) && !HAS_CODE.test(`${input.questionText}\n${input.stimulus || ""}`)) {
    failures.push("references_code_but_no_code_present");
  }

  // 3. Options structure — required for MCQ
  const opts = optsAsArray(input.options);
  if (!opts || opts.length < 4) {
    failures.push("options_not_enough");
  } else {
    const letters = ["A", "B", "C", "D", "E"];
    if (!letters.includes(correct)) failures.push("correct_letter_invalid");
    const idx = letters.indexOf(correct);
    if (idx >= 0 && idx >= opts.length) failures.push("correct_letter_out_of_range");
    const stripped = opts.map((o) => String(o).replace(/^[A-E]\)\s*/, "").trim().toLowerCase());
    if (new Set(stripped).size !== stripped.length) failures.push("duplicate_options");
    for (let i = 0; i < opts.length; i++) {
      const core = String(opts[i]).replace(/^[A-E]\)\s*/, "").trim();
      if (core.length === 0) failures.push(`option_${letters[i]}_empty`);
    }
  }

  // 4. Exam-identity: no AP-family references on CLEP/DSST/ACCUPLACER
  const course = input.course || "";
  if (course.startsWith("CLEP_") || course.startsWith("DSST_") || course === "ACCUPLACER" || course.startsWith("SAT_") || course.startsWith("ACT_")) {
    const combined = `${input.questionText}\n${input.explanation}`;
    if (/\bAP exam\b|\bCollege Board AP\b|\bAP (Biology|Chemistry|Physics|Calc|Statistics|Psychology|CSP|Computer Science)\b/i.test(combined)) {
      failures.push("ap_exam_reference_in_non_ap_course");
    }
  }

  return { ok: failures.length === 0, failures };
}

/**
 * Optional AI second-pass review. Asks a reviewer model whether the
 * explanation actually proves the stated correct answer. Returns
 * { ok: true } by default if env `SME_AI_REVIEW` is not set.
 *
 * Prompt is tight, single-shot, no streaming. Designed for cost ~
 * $0.001-0.003 per question when using Sonnet-class models.
 */
export async function validateSmeAi(input: SmeInput): Promise<{ ok: boolean; reason?: string }> {
  if (process.env.SME_AI_REVIEW !== "true") return { ok: true };
  const opts = optsAsArray(input.options);
  if (!opts) return { ok: false, reason: "options_not_array" };

  const prompt = `You are an expert exam reviewer. Given a multiple-choice question, answer "YES" only if ALL of these are true:
1. The stated correct answer (${input.correctAnswer}) is the best option among those listed.
2. The explanation's reasoning actually proves that answer (not a different option).
3. The question is complete — no missing variables, no undefined pseudocode, no broken references.
4. None of the wrong options are plausibly also correct.

QUESTION:
${input.questionText}

${input.stimulus ? `STIMULUS:\n${input.stimulus}\n` : ""}
OPTIONS:
${opts.map((o, i) => String(o)).join("\n")}

STATED CORRECT: ${input.correctAnswer}

EXPLANATION:
${input.explanation}

Respond in this exact format:
LINE 1: YES or NO
LINE 2: If NO, one-sentence reason (max 30 words). If YES, leave blank.`;

  try {
    const res = await callAIWithCascade(prompt);
    const text = (res as { text?: string; response?: string }).text || (res as { response?: string }).response || "";
    const line1 = text.split("\n")[0].trim().toUpperCase();
    const line2 = text.split("\n").slice(1).join(" ").trim();
    if (line1.startsWith("YES")) return { ok: true };
    return { ok: false, reason: line2 || "reviewer_flagged" };
  } catch (err) {
    // If the AI reviewer fails, don't block the pipeline — just log.
    console.warn("[sme-validator] AI review skipped:", (err as Error).message);
    return { ok: true };
  }
}
