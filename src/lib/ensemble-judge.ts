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
  model: "gpt-4o" | "claude-sonnet-4-6" | "gemini-1.5-pro";
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
  const optsStr = q.options
    .map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`)
    .join("\n");
  return `Audit this MCQ. Return JSON only with keys "verdict" and "reason".

verdict must be exactly "PASS" or "FAIL".

FAIL if ANY of these are true:
- The stored correctAnswer letter does NOT hold the value the explanation derives.
- The explanation contradicts itself.
- The explanation describes a distractor by letter (e.g. "Option B...") but that letter's text doesn't match the description.
- An option contains the word "Correct", "Incorrect", "Wrong", or "Right" (answer leak).
- The stimulus reveals the correct numeric answer (e.g. stimulus shows "= 245" when correct option = 245).
- LaTeX uses bare "int", "sum", "frac", "rac", "infty" without backslashes.
- The explanation includes LLM monologue ("hmm", "let me reconsider", "is not needed, just").

Otherwise PASS.

Question: ${q.questionText}

Options:
${optsStr}

Stored correctAnswer: ${q.correctAnswer}

Explanation: ${q.explanation || "(no explanation)"}

Return JSON only: {"verdict":"PASS"|"FAIL","reason":"<short>"}`;
}

async function callOpenAI(prompt: string): Promise<ModelVote> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { model: "gpt-4o", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "gpt-4o", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "gpt-4o", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "gpt-4o", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
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
        max_tokens: 200,
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
  if (!key) return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 200 },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: "no json" };
    const parsed = JSON.parse(m[0]);
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "gemini-1.5-pro", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

/**
 * Runs the 3-model ensemble in parallel and returns a quorum verdict.
 */
export async function ensembleJudgeMcq(q: McqInput): Promise<EnsembleResult> {
  const prompt = buildPrompt(q);
  const votes = await Promise.all([callOpenAI(prompt), callAnthropic(prompt), callGemini(prompt)]);
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
