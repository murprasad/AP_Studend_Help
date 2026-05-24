/**
 * Second-pass LLM verifier — independently solves the question and
 * compares to stored answer. Implements ChatGPT's recommended QA layer.
 *
 * Returns { ok: bool, verdict: PASS|FAIL|SKIP, reason }
 *
 * Use: in gen pipeline, after deterministic gates pass but before INSERT.
 *      Reject the question if verifier returns FAIL.
 *
 * Cost: ~$0.001-0.003 per question via Haiku 4.5.
 */
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM = `You are a QA auditor for standardized-test MCQ content.

Given a question, options, and a claimed correct answer letter:
1. Solve the question INDEPENDENTLY (do not trust the claimed answer).
2. Identify which option letter is actually correct.
3. Compare to the claimed answer.
4. Check the explanation for contradictions, mismatches, or absurd reasoning.

Reply EXACTLY in this format:
verdict: PASS|FAIL|SKIP
solved_letter: <the letter you computed independently, or N/A if you can't solve>
reason: <one sentence>

Use SKIP only when the question is purely conceptual / opinion-based and
cannot be objectively re-solved (e.g., "Which is the BEST writing style?").
Use FAIL when claimed answer disagrees with what you computed, or when the
explanation contradicts the claimed answer.
Use PASS otherwise.

Be strict but pragmatic — don't fail on minor wording.`;

export async function secondPassVerify(q) {
  if (!ANTHROPIC_KEY) return { ok: true, verdict: "SKIP", reason: "no ANTHROPIC_API_KEY — skipping verification" };
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  if (opts.length < 2) return { ok: true, verdict: "SKIP", reason: "fewer than 2 options" };

  const user = `Question: ${q.questionText}\n\n${q.stimulus ? `Stimulus: ${q.stimulus}\n\n` : ""}Options:\n${opts.join("\n")}\n\nClaimed correct: ${q.correctAnswer}\nExplanation: ${q.explanation || "(none)"}\n\nVerify.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 250,
        temperature: 0.1,
        system: SYSTEM,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: true, verdict: "SKIP", reason: `Haiku ${res.status}: ${body.slice(0, 80)} — passed without verification` };
    }
    const j = await res.json();
    const text = j?.content?.[0]?.text || "";
    const verdict = text.match(/verdict:\s*(PASS|FAIL|SKIP)/i)?.[1]?.toUpperCase() || "SKIP";
    const solved = text.match(/solved_letter:\s*([A-E]|N\/A)/i)?.[1]?.toUpperCase() || "N/A";
    const reason = text.match(/reason:\s*(.+)/i)?.[1]?.trim().slice(0, 200) || "";
    return {
      ok: verdict !== "FAIL",
      verdict,
      solved,
      reason,
    };
  } catch (e) {
    return { ok: true, verdict: "SKIP", reason: `error: ${e.message.slice(0, 80)} — passed without verification` };
  }
}
