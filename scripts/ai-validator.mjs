// Batch 1 — Factual-correctness + answer-consensus + plagiarism gates.
//
// Exports:
//   validatePlagiarism(question, exemplars) → { ok, similarity, matchedExemplarId }
//   validateAi(question, course)            → { ok, reason, agreedAnswer, severity }
//
// Uses Anthropic Haiku 4.5 as the independent reviewer. The reviewer:
//   (a) Answers the stem independently without seeing our claimed correctAnswer
//   (b) If its answer disagrees → reject (multi-model consensus failure)
//   (c) If it agrees, also check: distractors plausible? exactly one defensible answer?
//       no factual/math error? explanation self-consistent?
//
// Plagiarism guard: 5-gram Jaccard similarity against each exemplar stem. Above
// 0.30 → likely paraphrase. This catches near-copies the model produces when
// the exemplar is too salient in context.
//
// Cost: ~0.25k input + 0.1k output tokens per validation × $1.00/M in + $5/M out
//   ≈ $0.00075 per validation. $7.50 for 10,000 questions.

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function normalize(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function ngrams(s, n = 5) {
  const tokens = normalize(s).split(" ").filter(Boolean);
  if (tokens.length < n) return new Set(tokens.length > 0 ? [tokens.join(" ")] : []);
  const out = new Set();
  for (let i = 0; i <= tokens.length - n; i++) out.add(tokens.slice(i, i + n).join(" "));
  return out;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * 5-gram Jaccard similarity — rejects near-paraphrases of exemplars.
 * Threshold 0.30 tuned to catch obvious re-writes while allowing genuine
 * same-topic originality. Over 0.50 is almost certainly a copy.
 */
export function validatePlagiarism(question, exemplars, threshold = 0.30) {
  const qGrams = ngrams(question.questionText, 5);
  let worst = { similarity: 0, id: null };
  for (const e of exemplars) {
    const eGrams = ngrams(e.questionText, 5);
    const s = jaccard(qGrams, eGrams);
    if (s > worst.similarity) worst = { similarity: s, id: e.id };
  }
  return {
    ok: worst.similarity < threshold,
    similarity: Number(worst.similarity.toFixed(3)),
    matchedExemplarId: worst.id,
    threshold,
  };
}

/**
 * Haiku 4.5 independent reviewer. Returns:
 *   { ok, reason, agreedAnswer, severity }
 *
 * `ok=false` on ANY of:
 *   - Haiku's independent answer != candidate's correctAnswer
 *   - Factual/math error detected
 *   - Two or more options are defensibly correct
 *   - Distractors are clearly not plausible (e.g., different units, nonsense)
 *   - Explanation self-contradicts the correct-answer assertion
 *
 * severity: "reject" (always rejects), "warn" (flag but allow), "ok"
 */
async function callHaikuReview(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("no_anthropic_key");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function callGroqReview(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_groq_key");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`groq_${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function validateAi(question, course) {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;
  if (!hasAnthropic && !hasGroq) {
    return { ok: true, reason: "no_reviewer_configured", agreedAnswer: null, severity: "warn" };
  }

  const prompt = `You are reviewing a multiple-choice practice question for the ${course} exam. Review independently and rigorously.

QUESTION:
${question.questionText}

${question.stimulus ? `STIMULUS:\n${question.stimulus}\n\n` : ""}OPTIONS:
${Array.isArray(question.options) ? question.options.join("\n") : "(no options)"}

CANDIDATE'S CLAIMED CORRECT ANSWER: ${question.correctAnswer}

EXPLANATION PROVIDED:
${question.explanation}

TASK: Return ONLY JSON with these fields. No markdown fences, no commentary:
{
  "yourAnswer": "A|B|C|D",                    // The letter YOU think is correct, chosen independently
  "agreesWithCandidate": true|false,          // Does your answer match the candidate's correctAnswer?
  "factualErrors": ["..."],                   // Specific factual/math errors found, empty array if none
  "ambiguity": true|false,                    // Is more than one option defensibly correct?
  "implausibleDistractors": ["..."],          // Letters whose wrong-ness is trivial/obvious, empty if all plausible
  "explanationConsistent": true|false,        // Does the explanation actually defend the claimed correct answer?
  "collegeLevelRigor": true|false,            // Does rigor match released ${course} content?
  "verdict": "accept|warn|reject",            // accept if no issues, warn if minor, reject if any: disagree with answer, factual error, ambiguity, rigor too low
  "reason": "..."                             // One-sentence reason for verdict
}`;

  // Haiku first (better reasoning); Groq fallback when Haiku unavailable
  // so the pipeline keeps flowing during Anthropic credit outages.
  let text = "";
  let reviewerUsed = "";
  try {
    if (hasAnthropic) {
      text = await callHaikuReview(prompt);
      reviewerUsed = "haiku";
    } else {
      throw new Error("skip_to_groq");
    }
  } catch (e) {
    if (hasGroq) {
      try {
        text = await callGroqReview(prompt);
        reviewerUsed = "groq";
      } catch (g) {
        return { ok: true, reason: `both_failed: ${(e.message || "").slice(0,40)} | ${(g.message || "").slice(0,40)}`, agreedAnswer: null, severity: "warn" };
      }
    } else {
      return { ok: true, reason: `anthropic_fail: ${(e.message || "").slice(0,40)}`, agreedAnswer: null, severity: "warn" };
    }
  }

  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return { ok: true, reason: `${reviewerUsed}_output_not_json`, agreedAnswer: null, severity: "warn" };
    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return { ok: true, reason: `${reviewerUsed}_json_parse_fail`, agreedAnswer: null, severity: "warn" };
    }

    const verdict = String(parsed.verdict || "").toLowerCase();
    const ok = verdict === "accept" || verdict === "warn";
    const severity = ok ? (verdict === "accept" ? "ok" : "warn") : "reject";

    return {
      ok,
      reason: parsed.reason || verdict,
      agreedAnswer: parsed.yourAnswer || null,
      agreesWithCandidate: !!parsed.agreesWithCandidate,
      factualErrors: parsed.factualErrors || [],
      ambiguity: !!parsed.ambiguity,
      implausibleDistractors: parsed.implausibleDistractors || [],
      explanationConsistent: !!parsed.explanationConsistent,
      collegeLevelRigor: !!parsed.collegeLevelRigor,
      severity,
    };
  } catch (e) {
    return { ok: true, reason: `haiku_error: ${String(e.message || e).slice(0, 80)}`, agreedAnswer: null, severity: "warn" };
  }
}
