// AI-judge audit: for each AP MCQ, ask Groq to evaluate as if it were a
// CB-savvy 10-11th grader. Returns a 1-10 quality score + flag list.
//
// Scores:
//   9-10: CB exam quality
//   7-8 : Solid practice, minor issues
//   5-6 : Borderline — student might tolerate
//   1-4 : Release blocker (giveaway, factual error, broken render, etc.)
//
// Flags Groq looks for:
//   - stimulus_gives_answer: stim contains the answer phrase
//   - factual_error: anachronism, wrong attribution, wrong content
//   - broken_render: LaTeX/markdown artifacts visible to student
//   - hint_label: option text contains "Correct:"/"Incorrect:" or descriptors
//   - mismatched_stim: stimulus doesn't actually relate to the question
//   - weak_distractors: 3 obvious throwaways + 1 right answer
//   - meta_description: stim describes a passage rather than being the passage
//
// Idempotent — uses modelUsed marker "ai-judged-2026-04-28".
// Live mode: low-scoring (≤4) questions get unapproved automatically.
//
// Pacing: 1.2s between calls. ~6000 AP MCQ × 1.5s = ~2.5 hours.
// Args: --dry, --course=X, --group=AP, --limit=N, --threshold=4

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "ai-judged-2026-04-28";
const PACE_MS = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const courseArg = args.find((a) => a.startsWith("--course="))?.split("=")[1];
const groupArg = args.find((a) => a.startsWith("--group="))?.split("=")[1] ?? "AP";
const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const thresholdArg = args.find((a) => a.startsWith("--threshold="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const THRESHOLD = thresholdArg ? parseInt(thresholdArg, 10) : 4;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("GROQ_API_KEY missing"); process.exit(1); }

const groupPrefix =
  groupArg === "SAT" ? "SAT_" :
  groupArg === "ACT" ? "ACT_" :
  groupArg === "CLEP" ? "CLEP_" : "AP_";

async function judgeWithGroq(q) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const correctLetter = String(q.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);

  const userPrompt = `You are auditing a College Board AP/SAT/ACT-style MCQ as if you were a 10-11th grade student who has done College Board sample questions. Evaluate this question rigorously.

Course: ${q.course}
${q.stimulus ? "Stimulus:\n" + q.stimulus + "\n" : "(No stimulus)"}
Question: ${q.questionText}
Options:
${opts.map((o, i) => "  " + String.fromCharCode(65 + i) + ") " + o).join("\n")}
Correct answer: ${correctLetter}

Score this question 1-10 on CB-quality. Use this rubric:
  9-10: Real CB exam quality. Stimulus supports inference; distractors plausible; explanation cites concepts.
  7-8 : Solid practice. Minor issue (slightly fragmentary options, weak explanation).
  5-6 : Borderline. Student would tolerate but feel bothered.
  1-4 : Release blocker. CB-savvy student would close the tab.

Reasons to fail (flag if present, return as a list):
  - "stimulus_gives_answer": stim text contains the answer phrase verbatim or near-verbatim, so student doesn't need to reason.
  - "factual_error": anachronism, wrong attribution, factually wrong claim.
  - "broken_render": broken LaTeX (	ext, $$, raw markdown), broken Mermaid, missing image.
  - "hint_label": option text contains "Correct:", "Incorrect:", or one-word descriptors that telegraph correctness.
  - "mismatched_stim": stim doesn't actually relate to or support the question.
  - "weak_distractors": 3 obvious throwaways + 1 right answer.
  - "meta_description": stim describes WHAT a passage says rather than BEING the passage (e.g. "Excerpt from a 1845 speech and an 1847 pamphlet" with no actual passages).
  - "fragmentary_options": options are 1-3 word fragments instead of CB-style sentences.
  - "stimulus_question_disconnect": stim is on topic A, question asks about topic B.

Return JSON only: {"score": <1-10>, "flags": ["flag1", "flag2"], "reason": "one sentence"}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a CB-savvy AP/SAT/ACT student auditor. Be strict — only score 9-10 for questions that match real CB exam quality." },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 250,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

const rows = courseArg
  ? await sql`
      SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
      FROM questions
      WHERE course = ${courseArg}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
      ORDER BY RANDOM()
    `
  : await sql`
      SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
      FROM questions
      WHERE course::text LIKE ${groupPrefix + '%'}
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
      ORDER BY RANDOM()
    `;

const target = Math.min(rows.length, LIMIT);
console.log(`AI-judge pass — group=${groupArg} threshold=${THRESHOLD} target=${target} of ${rows.length}`);

let processed = 0, blocker = 0, solid = 0, borderline = 0, errors = 0;
const flagCounts = {};
const blockerSamples = [];

for (let i = 0; i < target; i++) {
  const r = rows[i];
  if (dry) {
    if (i < 3) console.log(`  [DRY] would judge ${r.id.slice(0, 8)} ${r.course}`);
    processed++;
    continue;
  }
  try {
    const result = await judgeWithGroq(r);
    const score = Number(result.score ?? 0);
    const flags = Array.isArray(result.flags) ? result.flags : [];
    processed++;

    for (const f of flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;

    if (score >= 7) solid++;
    else if (score >= 5) borderline++;
    else {
      blocker++;
      if (blockerSamples.length < 5) {
        blockerSamples.push({ id: r.id.slice(0, 8), course: r.course, score, flags, reason: result.reason });
      }
      // Unapprove blockers
      await sql`
        UPDATE questions
        SET "isApproved" = false,
            "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':blocker:s' + score},
            "updatedAt" = NOW()
        WHERE id = ${r.id}
      `;
    }
    // Mark as judged regardless of outcome
    if (score >= 5) {
      await sql`
        UPDATE questions
        SET "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':s' + score},
            "updatedAt" = NOW()
        WHERE id = ${r.id}
      `;
    }
    if (processed <= 5 || processed % 50 === 0) {
      console.log(`  [${processed}/${target}] ${r.id.slice(0, 8)} ${r.course} score=${score} flags=${flags.join(",") || "none"}`);
    }
  } catch (e) {
    errors++;
    if (errors <= 5) console.error(`  ✗ ${r.id.slice(0, 8)}: ${e.message?.slice(0, 100)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Processed:  ${processed}`);
console.log(`  Solid (≥7): ${solid} (${(solid/processed*100).toFixed(1)}%)`);
console.log(`  Borderline: ${borderline} (${(borderline/processed*100).toFixed(1)}%)`);
console.log(`  Blocker:    ${blocker} (${(blocker/processed*100).toFixed(1)}%)`);
console.log(`  Errors:     ${errors}`);
console.log(`\nFlag distribution:`);
for (const [f, n] of Object.entries(flagCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${f}: ${n}`);
}
console.log(`\nBlocker samples:`);
for (const b of blockerSamples) {
  console.log(`  ${b.id} ${b.course} score=${b.score} flags=[${b.flags.join(",")}] reason="${b.reason}"`);
}
