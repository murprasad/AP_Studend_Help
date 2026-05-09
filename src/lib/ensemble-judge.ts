/**
 * src/lib/ensemble-judge.ts — 3-model MCQ quality ensemble.
 *
 * Pairs with `judgeMcq` (single-model GPT-4o). This is the next layer:
 * THREE independent models vote on whether the MCQ is correct. We ship
 * only when ≥2 of 3 vote PASS. Same blind spots no longer outvote real
 * bugs because two different model families (OpenAI / Anthropic / Google)
 * are unlikely to all share the same hallucination.
 *
 * Per CLAUDE.md rules:
 *   - No SDK imports — every provider call uses plain `fetch()` with
 *     `AbortSignal.timeout()` for CF Workers compatibility.
 *   - Each provider is independent; failure to call one (missing key,
 *     network error, rate-limit) marks that vote as ABSTAIN, not FAIL.
 *
 * Quorum policy:
 *   - ≥2 PASS votes → ok=true
 *   - ≥2 FAIL votes → ok=false (reason names the failing models)
 *   - <2 votes either way (e.g. 1 PASS / 1 FAIL / 1 ABSTAIN, or
 *     all 3 abstain) → ok=true with fallback=true (fail-OPEN; deterministic
 *     gates + single-model judge remain the floor)
 *
 * Cost per call (rough):
 *   GPT-4o      ~$0.005
 *   Sonnet 4.6  ~$0.012
 *   Gemini Pro  ~$0.003
 *   Total       ~$0.020/question
 */

interface McqInput {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null | undefined;
}

type Vote = "PASS" | "FAIL" | "ABSTAIN";

interface ModelVote {
  model: "groq-llama-3.3-70b" | "claude-sonnet-4-6" | "gemini-2.5-flash";
  vote: Vote;
  reason?: string;
}

export interface EnsembleResult {
  ok: boolean;
  votes: ModelVote[];
  reason?: string;
  /** True when no quorum could be reached — infrastructure issue, not a quality flag. */
  fallback?: boolean;
}

const TIMEOUT_MS = 25_000;

function buildPrompt(q: McqInput): string {
  // Strip any legacy "X) " prefix from stored options — UI strips at render.
  const stripPrefix = (s: string) => s.replace(/^[A-E]\s*\)\s*/, "");
  const optsStr = q.options
    .map((o, i) => `${String.fromCharCode(65 + i)}) ${stripPrefix(o)}`)
    .join("\n");
  return `You are auditing a StudentNest practice question against real College Board (AP/SAT/ACT) exam standards. Return JSON only with keys "verdict" and "reason".

verdict must be exactly "PASS" or "FAIL".

FAIL if ANY of these CORRECTNESS bugs are present:
- The stored correctAnswer letter does NOT hold the value the explanation derives.
- The explanation contradicts itself.
- The explanation describes a distractor by letter (e.g. "Option B incorrectly multiplies...") but that letter's actual text doesn't match the description.
- An OPTION's TEXT contains the word "Correct"/"Incorrect"/"Wrong"/"Right" (e.g. "B) 245 - Correct"). NOT FAIL: the explanation saying "the correct answer is B" — that is normal teaching content.
- The stimulus reveals the correct numeric answer.
- LaTeX uses bare "int", "sum", "frac", "rac", "infty" without backslashes.
- The explanation includes LLM monologue ("hmm", "let me reconsider", "is not needed, just").

FAIL also if the question doesn't match real CB exam STYLE/RIGOR (HARD requirement):
- Stem reads more like a textbook paragraph than an exam item.
- Distractors are not all CB-grade plausible (an option is obviously wrong, or doesn't represent a real student misconception).
- Stimulus omits the CB-style scaffold (no source quote+attribution for history, no table/chart for AP Stats / ACT Science, no described diagram for AP Physics, no passage for SAT R/W).
- Source attribution is fabricated, vague, or missing year.
- Difficulty doesn't match the apparent rigor (HARD-tagged but is just longer recall).
- Stem uses ambiguous superlatives ("primary", "main", "best") without textual justification.

Otherwise PASS.

Question: ${q.questionText}

Options:
${optsStr}

Stored correctAnswer: ${q.correctAnswer}

Explanation: ${q.explanation || "(no explanation)"}

Return JSON only: {"verdict":"PASS"|"FAIL","reason":"<short>"}`;
}

async function callGroq(prompt: string): Promise<ModelVote> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { model: "groq-llama-3.3-70b" as ModelVote["model"], vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "groq-llama-3.3-70b" as ModelVote["model"], vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "groq-llama-3.3-70b" as ModelVote["model"], vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "groq-llama-3.3-70b" as ModelVote["model"], vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

async function callAnthropic(prompt: string): Promise<ModelVote> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    // Claude doesn't always return strict JSON — extract first {...} block.
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: "no json" };
    const parsed = JSON.parse(m[0]);
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "claude-sonnet-4-6", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

async function callGemini(prompt: string): Promise<ModelVote> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: "no json" };
    const parsed = JSON.parse(m[0]);
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "gemini-2.5-flash", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

/**
 * Runs the 3-model ensemble in parallel and returns a quorum verdict.
 */
export async function ensembleJudgeMcq(q: McqInput): Promise<EnsembleResult> {
  const prompt = buildPrompt(q);
  const votes = await Promise.all([callGroq(prompt), callAnthropic(prompt), callGemini(prompt)]);
  const pass = votes.filter((v) => v.vote === "PASS").length;
  const fail = votes.filter((v) => v.vote === "FAIL").length;

  if (fail >= 2) {
    const failingModels = votes.filter((v) => v.vote === "FAIL");
    return {
      ok: false,
      votes,
      reason: failingModels.map((v) => `${v.model}: ${v.reason ?? "fail"}`).join(" | "),
    };
  }
  if (pass >= 2) {
    return { ok: true, votes };
  }
  // No quorum — fail-OPEN.
  return {
    ok: true,
    fallback: true,
    votes,
    reason: `no quorum (PASS=${pass} FAIL=${fail} ABSTAIN=${votes.length - pass - fail})`,
  };
}
