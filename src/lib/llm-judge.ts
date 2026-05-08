/**
 * src/lib/llm-judge.ts — LLM-based MCQ quality judge (PrepLion).
 *
 * Final gate in the question-generation pipeline. Runs AFTER the
 * deterministic gates (validateMcqStructure / validateAnswerNumericMatch /
 * validateExplanationMath / validateDistractorIntegrity) pass — only
 * questions that survive those reach this judge.
 *
 * Why: the deterministic gates miss 3 bug classes:
 *
 *   1. LETTER_MISMATCH — stored correctAnswer doesn't match the option
 *      the explanation actually derives. (Caught by answer-match for
 *      numeric MCQs but NOT for symbolic/formula MCQs where the "answer"
 *      is an equation.)
 *
 *   2. CONTRADICTION — explanation derives one option in one sentence,
 *      then says a different option is correct in another sentence.
 *
 *   3. LABEL_MISMATCH — explanation describes a distractor by referring
 *      to it ("Option B incorrectly multiplies"), but the description
 *      doesn't match what's actually in option B's text. The student
 *      reads "Option A is wrong" but A is the right answer they picked.
 *
 * Cost: ~$0.005/question via gpt-4o. Only fires after deterministic
 * gates filter out the obvious junk, so volume is bounded.
 *
 * Failure mode: judge errors (rate-limit, network, parse-fail) return
 * `{ ok: true, fallback: true }` — fail-OPEN to not block generation
 * indefinitely on infra issues. The deterministic gates remain the
 * hard floor; LLM judge raises the ceiling.
 */

interface McqInput {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null | undefined;
}

export interface JudgeResult {
  ok: boolean;
  verdict?: "PASS" | "FAIL_LETTER_MISMATCH" | "FAIL_CONTRADICTION" | "FAIL_LABEL_MISMATCH" | "UNCLEAR";
  reason?: string;
  /** True if the judge couldn't run — infrastructure issue, NOT a quality flag. */
  fallback?: boolean;
}

/**
 * Runs the LLM judge against an MCQ. Returns ok=true if the question
 * passes (or if the judge couldn't run and we're failing open).
 * Returns ok=false with verdict + reason if the judge confirmed a bug.
 */
export async function judgeMcq(q: McqInput): Promise<JudgeResult> {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    // Fail-open in environments without the key (local dev, etc.)
    return { ok: true, fallback: true, reason: "OPENAI_API_KEY not set" };
  }

  const optsStr = q.options
    .map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`)
    .join("\n");

  const prompt = `Audit this MCQ for THREE bug classes:

1. LETTER_MISMATCH — stored correctAnswer disagrees with the option the explanation actually derives.
2. CONTRADICTION — explanation self-contradicts (says one option is correct in one sentence, another option in another).
3. LABEL_MISMATCH — explanation describes a distractor (e.g. "Option B incorrectly multiplies"), but the description does NOT match what's actually in option B's text.

Question: ${q.questionText}

Options:
${optsStr}

Stored correctAnswer: ${q.correctAnswer}

Explanation: ${q.explanation || "(no explanation)"}

Return JSON only:
{
  "verdict": "PASS" | "FAIL_LETTER_MISMATCH" | "FAIL_CONTRADICTION" | "FAIL_LABEL_MISMATCH" | "UNCLEAR",
  "reason": "<short string>"
}

PASS only if ALL three bug classes are absent.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 300,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 429) {
      // Rate-limited — fail-open. Generator can move on; the question
      // gets stored with the deterministic gates' verdict.
      return { ok: true, fallback: true, reason: "rate-limited" };
    }
    if (!res.ok) {
      return { ok: true, fallback: true, reason: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: true, fallback: true, reason: "empty response" };
    }
    const parsed = JSON.parse(content);
    const verdict = parsed?.verdict;

    if (verdict === "PASS") {
      return { ok: true, verdict };
    }
    if (verdict === "UNCLEAR") {
      // UNCLEAR is not a confirmed bug — fail-open.
      return { ok: true, verdict, reason: parsed?.reason };
    }
    // Confirmed bug — fail-closed.
    return {
      ok: false,
      verdict,
      reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 300) : "unknown",
    };
  } catch (e) {
    return {
      ok: true,
      fallback: true,
      reason: e instanceof Error ? e.message.slice(0, 100) : "unknown error",
    };
  }
}
