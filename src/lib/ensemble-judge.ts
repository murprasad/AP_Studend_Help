/**
 * src/lib/ensemble-judge.ts — Multi-judge MCQ quality ensemble with
 * automatic fallback across LLM providers.
 *
 * Quorum policy:
 *   - ≥2 PASS votes → ok=true
 *   - ≥2 FAIL votes → ok=false (reason names the failing models)
 *   - <2 votes either way → ok=true with fallback=true (fail-OPEN; deterministic
 *     gates remain the floor)
 *
 * Judge pool (priority order, top to bottom):
 *   1. Anthropic Sonnet 4.6           — paid, best reasoning
 *   2. Gemini 2.5-flash               — paid, fast
 *   3. Groq llama-3.3-70b             — free tier, always-on
 *   4. Cerebras Qwen-3-235B           — free tier, frontier-class (~500ms)
 *   5. Cloudflare Qwen2.5-Coder-32B   — free 10K neurons/day, in-house infra
 *   6. Pollinations openai            — free, no key, GPT-4o-mini class
 *   7. Pollinations openai-fast       — free, no key, GPT-OSS-20B class
 *
 * Strategy: call all 7 in parallel, take all non-ABSTAIN votes.
 * If <3 valid votes after parallel resolves, fall back to whatever we
 * got. Different model FAMILIES (Anthropic / Google / Meta / OpenAI) are
 * unlikely to share the same hallucination blind spot.
 *
 * Per CLAUDE.md: no SDK imports — every call is plain fetch() with
 * AbortSignal.timeout() for CF Workers compatibility.
 */

interface McqInput {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null | undefined;
  /**
   * 2026-05-13 — optional course id. When set, the ensemble looks up the
   * per-course overrides in expansion-pipeline-config.ts (e.g. TEAS_SCIENCE
   * demands ≥3 PASS + paid-judge co-sign). When unset (every current call
   * site for AP/SAT/ACT/CLEP), the default ≥2 PASS quorum applies. Forward-
   * wired ahead of the TEAS + PSAT vertical builds.
   */
  courseId?: string;
}

type Vote = "PASS" | "FAIL" | "ABSTAIN";

interface ModelVote {
  model: string;
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
  const stripPrefix = (s: string) => s.replace(/^[A-E]\s*\)\s*/, "");
  const optsStr = q.options
    .map((o, i) => `${String.fromCharCode(65 + i)}) ${stripPrefix(o)}`)
    .join("\n");
  return `You are auditing a StudentNest practice question against real College Board (AP/SAT/ACT) exam standards. **Read the question as a student would, then read the EXPLANATION word-by-word as a teacher reviewing student-facing content.** Return JSON only with keys "verdict" and "reason".

verdict must be exactly "PASS" or "FAIL".

CRITICAL — derive the answer yourself first:
- Read the question + options. Solve the question independently. Pick the option you believe is correct based on YOUR derivation.
- If your derived answer does NOT appear as any option → automatic FAIL ("none of the options matches the actual answer").
- If your derived answer matches an option but the stored correctAnswer letter is different → automatic FAIL ("stored answer letter is wrong").
- Don't be charitable to the generator. Don't accept "closest match" or "approximately."

CRITICAL — review the EXPLANATION line-by-line:
- The explanation is what students SEE after answering. It must teach the concept correctly.
- Verify every factual claim (dates, formulas, definitions, attributions) in the explanation independently. Any factual error → FAIL.
- Verify every arithmetic step in the explanation. Recompute. Any arithmetic error → FAIL.
- The explanation must explain WHY the correct answer is correct, not just WHICH letter is correct.
- The explanation must NOT contain placeholder text, TODO markers, or unfinished sentences.
- The explanation must NOT reveal the answer in the FIRST sentence in a way that defeats the purpose (some teaching of the reasoning is required).
- If the question is non-numeric, the explanation must reference course-canonical content (theory, framework, named author/era/case), not vague generalities.

FAIL if ANY of these CORRECTNESS bugs are present:
- The stored correctAnswer letter does NOT hold the value the explanation derives.
- The explanation contains confession phrases like "closest match", "miscalculation", "calculation error", "incorrect option values", "might be due to", "given options provided", "given the options" — these signal the generator gave up and faked an answer.
- The explanation contains factual errors (wrong year, wrong attribution, wrong formula, wrong term definition).
- Two or more options are mathematically/logically equivalent to each other (multi-correct bug). Example: "P(t) = t(2t+5) - 3" and "P(t) = (2t-1)(t+3)" both simplify to "2t² + 5t - 3".
- Currency mismatch: option text contains "$" or "dollars" but the stem doesn't mention a currency unit; or stem says "in dollars" but options omit "$".
- **Unescaped $ for currency in question text** — if the stem contains TWO OR MORE bare "$" characters (e.g., "$75 ... $60 ... $50"), they will render as inline LaTeX math (italic Computer Modern, whitespace collapsed) and confuse students. Currency must be written as "\\$75" (escaped) OR "75 dollars". Multiple bare $ in a row is automatic FAIL.
- **Phantom stimulus** — the stem references a figure / diagram / graph / chart / passage / image / energy profile / Lewis structure / "as shown" / "the following figure" / "the graph below" BUT no actual stimulus content exists in the stimulus field. The student sees the reference with nothing to look at. Automatic FAIL — either the stimulus must be added or the stem must be rewritten to not reference one.
- The explanation contradicts itself (derives X then asserts Y).
- The explanation describes a distractor by letter (e.g. "Option B incorrectly multiplies...") but that letter's actual text doesn't match the description.
- An OPTION's TEXT contains the word "Correct"/"Incorrect"/"Wrong"/"Right" (e.g. "B) 245 - Correct"). NOT FAIL: the explanation saying "the correct answer is B" — that is normal teaching content.
- The stimulus reveals the correct numeric answer.
- LaTeX uses bare "int", "sum", "frac", "rac", "infty" without backslashes.
- The explanation includes LLM monologue ("hmm", "let me reconsider", "is not needed, just").
- The question is meta-administration (e.g. "what must a school do to offer AP?") rather than course content.

Question: ${q.questionText}

Options:
${optsStr}

Stored correctAnswer: ${q.correctAnswer}

Explanation: ${q.explanation || "(no explanation)"}

Return JSON only: {"verdict":"PASS"|"FAIL","reason":"<short>"}`;
}

function parseVote(input: string | Record<string, unknown> | null | undefined): { vote: Vote; reason?: string } {
  let parsed: { verdict?: string; reason?: string } = {};
  if (input && typeof input === "object") {
    parsed = input as { verdict?: string; reason?: string };
  } else if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      const m = input.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch {}
    }
  }
  const v: Vote = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
  return { vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
}

async function callGroq(prompt: string): Promise<ModelVote> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { model: "groq-llama-3.3-70b", vote: "ABSTAIN", reason: "no key" };
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
    if (!res.ok) return { model: "groq-llama-3.3-70b", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    return { model: "groq-llama-3.3-70b", ...parseVote(data?.choices?.[0]?.message?.content ?? "") };
  } catch (e) {
    return { model: "groq-llama-3.3-70b", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

async function callAnthropic(prompt: string): Promise<ModelVote> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    return { model: "claude-sonnet-4-6", ...parseVote(data?.content?.[0]?.text ?? "") };
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
    return { model: "gemini-2.5-flash", ...parseVote(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "") };
  } catch (e) {
    return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

async function callCerebras(prompt: string): Promise<ModelVote> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) return { model: "cerebras-qwen-3-235b", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen-3-235b-a22b-instruct-2507",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "cerebras-qwen-3-235b", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    return { model: "cerebras-qwen-3-235b", ...parseVote(data?.choices?.[0]?.message?.content ?? "") };
  } catch (e) {
    return { model: "cerebras-qwen-3-235b", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

async function callCloudflare(prompt: string): Promise<ModelVote> {
  const token = process.env.CLOUDFLARE_AI_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) return { model: "cf-qwen2.5-coder-32b", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/qwen/qwen2.5-coder-32b-instruct`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt + "\n\nReturn JSON only, no prose." }],
          max_tokens: 400,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) return { model: "cf-qwen2.5-coder-32b", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    return { model: "cf-qwen2.5-coder-32b", ...parseVote(data?.result?.response ?? "") };
  } catch (e) {
    return { model: "cf-qwen2.5-coder-32b", vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

async function callPollinations(prompt: string, model: "openai" | "openai-fast"): Promise<ModelVote> {
  const label = `pollinations-${model}`;
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: label, vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    return { model: label, ...parseVote(data?.choices?.[0]?.message?.content ?? "") };
  } catch (e) {
    return { model: label, vote: "ABSTAIN", reason: e instanceof Error ? e.message.slice(0, 80) : "err" };
  }
}

/**
 * Calls all configured judges in parallel and takes the first 3 non-ABSTAIN
 * votes. When the paid providers (Anthropic, Gemini) are working, they vote
 * first and Pollinations doesn't affect quorum. When paid providers are down
 * (credit exhausted, rate-limited, key invalid), Pollinations + Groq carry
 * the ensemble. The deterministic gates + single-fallback in the call site
 * remain as backstops.
 */
// Paid-judge model identifiers (must match the `model` field set inside
// each call function). Used by the per-course config to enforce paid-judge
// co-sign on stricter verticals (TEAS_SCIENCE A&P, future GRE Quant).
const PAID_JUDGE_MODELS = new Set(["claude-sonnet-4-6", "gemini-2.5-flash"]);

export async function ensembleJudgeMcq(q: McqInput): Promise<EnsembleResult> {
  const prompt = buildPrompt(q);
  // Lazy-import the config so the default code path (no courseId) has zero
  // runtime overhead beyond the function call. Existing callers are unchanged.
  const { getExpansionConfig } = await import("./expansion-pipeline-config");
  const cfg = q.courseId ? getExpansionConfig(q.courseId) : { minPassQuorum: 2, requirePaidJudgeInQuorum: false, requireSourceCitation: false };

  // Call all 5 judges in parallel. ABSTAIN votes (errors, no key, no JSON)
  // are discarded; we count only PASS/FAIL.
  const allVotes = await Promise.all([
    callAnthropic(prompt),
    callGemini(prompt),
    callGroq(prompt),
    callCerebras(prompt),
    callCloudflare(prompt),
    callPollinations(prompt, "openai"),
    callPollinations(prompt, "openai-fast"),
  ]);

  // Keep all votes in the result for audit logging, but tally only the
  // non-ABSTAIN votes for quorum.
  const validVotes = allVotes.filter((v) => v.vote !== "ABSTAIN");
  const passingVotes = validVotes.filter((v) => v.vote === "PASS");
  const failingVotes = validVotes.filter((v) => v.vote === "FAIL");
  const pass = passingVotes.length;
  const fail = failingVotes.length;

  if (fail >= 2) {
    return {
      ok: false,
      votes: allVotes,
      reason: failingVotes.map((v) => `${v.model}: ${v.reason ?? "fail"}`).join(" | "),
    };
  }
  // Stricter quorum for TEAS_SCIENCE and future high-stakes courses:
  //   - minPassQuorum default 2 (current behaviour unchanged)
  //   - requirePaidJudgeInQuorum: at least one Anthropic/Gemini PASS vote
  // Defaults preserved for every existing AP/SAT/ACT/CLEP course.
  if (pass >= cfg.minPassQuorum) {
    if (cfg.requirePaidJudgeInQuorum) {
      const hasPaid = passingVotes.some((v) => PAID_JUDGE_MODELS.has(v.model));
      if (!hasPaid) {
        return {
          ok: false,
          votes: allVotes,
          reason: `paid-judge co-sign required for ${q.courseId ?? "this course"} but no paid judge in PASS quorum`,
        };
      }
    }
    return { ok: true, votes: allVotes };
  }
  // No quorum — fail-OPEN.
  return {
    ok: true,
    fallback: true,
    votes: allVotes,
    reason: `no quorum (PASS=${pass} FAIL=${fail} ABSTAIN=${allVotes.length - validVotes.length} of ${allVotes.length})`,
  };
}
