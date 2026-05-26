/**
 * Default MCQ template — course-aware (v2).
 *
 * v1 was a static string; the generator kept defaulting to 4 options even
 * when the course required 5 (pilot finding, 2026-05-26). v2 takes the
 * course id from the loop's TemplateContext and injects the expected
 * option count + letters + exam family into the system prompt. This way
 * the constraint hits the LLM on attempt #1 rather than being learned
 * over 2-3 retries.
 *
 * Stays generic across all 61 supported courses; per-course knowledge
 * lives in `course-info.ts`.
 */
import type { Template, TemplateContext } from "../types.js";
import {
  expectedOptionCount,
  optionLetters,
  courseFamily,
  courseSubject,
} from "../course-info.js";

function buildSystemPrompt({ course }: TemplateContext): string {
  const optCount = expectedOptionCount(course);
  const optLetters = optionLetters(course);
  const family = courseFamily(course);
  const subject = courseSubject(course);
  const lastLetter = optLetters.slice(-1); // "D" or "E"

  return `You write ${family} ${subject} multiple-choice questions for exam preparation.

This exam requires EXACTLY ${optCount} options per question, labeled ${optLetters}. Never produce a different number of options.

CRITICAL JSON FORMAT:
- "correctAnswer" field: MUST be EXACTLY one letter from ${optLetters}. NEVER the value itself.
    GOOD: "correctAnswer": "B"
    BAD:  "correctAnswer": "8"     ← put 8 inside option B, not here
    BAD:  "correctAnswer": "x > 3" ← put expression inside an option, not here
- "options" array MUST have ${optCount} entries.

CONTENT RULES:
1. Stem DIRECT, CONCRETE, real-world context where appropriate. 8-40 words.
2. Each option starts with its letter prefix: "A) value" "B) value" ... "${lastLetter}) value".
3. Explanation 80-200 characters MINIMUM. Refer to answer by VALUE not by letter
   (e.g., "8 is correct because log₂(8)=3" — NOT "Letter B is correct").
   Use at least one reasoning marker: because / since / by / using / applying / thus / therefore.
4. NO confession phrases ("closest match", "best guess", "approximately", "given the options").
5. NO hints embedded in options (no parenthetical 25+ chars, no commas with "because/which is").
6. Distractors must represent real student misconceptions — never obviously wrong.
7. If stem references a figure/diagram/passage/graph, ALSO include actual stimulus content.
8. Explanation must end with a complete word and sentence — no mid-word truncation.

QUALITY BAR:
- A teacher reviewing the explanation must agree it teaches the concept correctly.
- A student reading the stem must be able to derive the correct answer from the options.
- The stored correctAnswer letter must point at the option value the explanation justifies.

OUTPUT JSON SHAPE:
{
  "questionText": "<stem>",
  "stimulus": "<passage/figure/scenario, or omit for stand-alone stems>",
  "options": [${Array.from({ length: optCount }, (_, i) => `"${String.fromCharCode(65 + i)}) ..."`).join(", ")}],
  "correctAnswer": "${optLetters.split("").join('" | "')}",
  "explanation": "<80-200 chars explaining the correct answer>",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "topic": "<short topic tag>"
}

Return JSON only — no markdown fences, no prose around it.`;
}

export const DEFAULT_MCQ_TEMPLATE: Template = {
  id: "default-mcq-v2",
  version: "2.0.0",
  metadata: {
    source: "course-aware rewrite 2026-05-26 — fixes pilot finding of options-count drift",
  },
  systemPrompt: buildSystemPrompt,
};
