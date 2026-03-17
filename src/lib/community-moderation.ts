/**
 * 3-layer AI community moderation pipeline
 *
 * Layer 1: Rule-based keyword filter (instant, zero cost)
 * Layer 2: AI topic relevance — is this about AP/SAT/ACT/education?
 * Layer 3: AI toxicity detection — hate speech, harassment, spam
 *
 * Returns { allowed: boolean, reason?: string }
 * Short-circuits on first failure to minimize AI calls.
 */

interface ModerationResult {
  allowed: boolean
  reason?: string
}

// Layer 1 — Static keyword blocklist (fast path)
const BLOCKED_PATTERNS = [
  /\b(http|https):\/\/(?!collegeboard|khanacademy|act\.org|apcentral)\S+/i, // external links (except approved)
  /\b(buy|sell|cheap|discount|promo|coupon|deal|offer)\s+(exam|test|answer|score|cheat)\b/i,
  /\bcheat\s*(sheet|code|answer|key)\b/i,
  /\bdump(s)?\s*(download|file|pdf|free)\b/i,
  /\bpassword\s*(crack|hack|reset|bypass)\b/i,
  /\b(n[i1]gg|f[a@4]gg|k[i1]ll\s*your|k[i1]ll\s*me|suck\s*my|f[u*]ck\s*you)\b/i,
]

const SPAM_REPETITION_THRESHOLD = 5 // same word repeated 5+ times = spam

function runRuleFilter(text: string): ModerationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "rule:blocked_pattern" }
    }
  }
  // Repetition spam check
  const words = text.toLowerCase().split(/\s+/)
  const counts = new Map<string, number>()
  for (const w of words) {
    if (w.length > 3) counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  for (const word of Array.from(counts.keys())) {
    if ((counts.get(word) ?? 0) >= SPAM_REPETITION_THRESHOLD) {
      return { allowed: false, reason: `rule:spam_repetition:${word}` }
    }
  }
  return { allowed: true }
}

// Layer 2+3 — Combined AI call (one request, two checks)
async function runAIModeration(
  title: string,
  body: string,
  course: string
): Promise<ModerationResult> {
  const prompt = `You are a content moderation AI for StudentNest, an AP/SAT/ACT exam prep platform for high school students.

Evaluate this post and respond with ONLY valid JSON:

Title: ${title.slice(0, 200)}
Body: ${body.slice(0, 800)}
Course context: ${course}

Checks to perform:
1. RELEVANCE: Is this related to AP exams, SAT, ACT, studying, school, or education? Off-topic posts (memes, unrelated venting, random chat) should fail.
2. TOXICITY: Does it contain hate speech, bullying, harassment, graphic content, or personal information?

Respond with exactly this JSON format:
{"relevant":true,"toxic":false,"reason":null}

- "relevant": true if on-topic for an exam prep platform, false if completely off-topic
- "toxic": true only for clear violations (hate speech, harassment, explicit content)
- "reason": null if allowed, or a SHORT 1-sentence reason string if flagged`

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { allowed: true } // fail open if no key

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { allowed: true } // fail open on API error

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const raw = data.choices?.[0]?.message?.content?.trim()
    if (!raw) return { allowed: true }

    const parsed = JSON.parse(raw) as {
      relevant: boolean
      toxic: boolean
      reason: string | null
    }

    if (parsed.toxic) {
      return { allowed: false, reason: parsed.reason ?? "ai:toxicity" }
    }
    if (!parsed.relevant) {
      return { allowed: false, reason: parsed.reason ?? "ai:off_topic" }
    }
    return { allowed: true }
  } catch {
    return { allowed: true } // fail open on any error
  }
}

/**
 * Fast moderation — Layer 1 (rule filter) only.
 * Zero latency, no AI calls. Use this in the request path.
 */
export function moderateContentFast(title: string, body: string): ModerationResult {
  return runRuleFilter(`${title} ${body}`)
}

/**
 * Run the full 3-layer moderation pipeline.
 * title can be empty string for replies (body-only).
 */
export async function moderateContent(
  title: string,
  body: string,
  course: string
): Promise<ModerationResult> {
  // Layer 1: instant rule filter
  const ruleResult = runRuleFilter(`${title} ${body}`)
  if (!ruleResult.allowed) return ruleResult

  // Layer 2+3: AI relevance + toxicity (single call)
  return runAIModeration(title, body, course)
}
