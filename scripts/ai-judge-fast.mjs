// Faster AI-judge: parallel workers, tighter threshold, focused prompt.
//
// Runs N=5 concurrent Groq calls (each Groq free request is independent;
// rate limit is 30 RPM = 1 request every 2s, so 5 parallel gives us
// ~10s budget per request which is plenty).
//
// Threshold tightened to ≤5 (was ≤4) — borderline gets unapproved too.
//
// Idempotent — uses same marker as ai-judge-questions.mjs.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "ai-judged-2026-04-28";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const groupArg = args.find((a) => a.startsWith("--group="))?.split("=")[1] ?? "AP";
const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const thresholdArg = args.find((a) => a.startsWith("--threshold="))?.split("=")[1];
const workersArg = args.find((a) => a.startsWith("--workers="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const THRESHOLD = thresholdArg ? parseInt(thresholdArg, 10) : 5;
const WORKERS = workersArg ? parseInt(workersArg, 10) : 5;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("GROQ_API_KEY missing"); process.exit(1); }

const groupPrefix =
  groupArg === "SAT" ? "SAT_" :
  groupArg === "ACT" ? "ACT_" :
  groupArg === "CLEP" ? "CLEP_" : "AP_";

async function judge(q) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const correctLetter = String(q.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);

  const userPrompt = `Audit this MCQ as a CB-savvy 10-11th grader. Score 1-10, list flags.

Course: ${q.course}
${q.stimulus ? "Stimulus:\n" + q.stimulus.slice(0, 1500) + "\n" : "(No stimulus)"}
Q: ${q.questionText}
Options:
${opts.map((o, i) => "  " + String.fromCharCode(65 + i) + ") " + o).join("\n")}
Correct: ${correctLetter}

Rubric:
  9-10: CB exam quality.
  7-8 : Solid practice, minor issue.
  5-6 : Borderline.
  1-4 : Release blocker.

Flag any: stimulus_gives_answer, factual_error, broken_render, hint_label, mismatched_stim, weak_distractors, meta_description, fragmentary_options, stimulus_question_disconnect.

JSON only: {"score": <1-10>, "flags": [], "reason": "<1 sentence>"}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a strict CB-savvy AP/SAT student auditor. Only score 9-10 for real CB-quality." },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

async function processOne(r, stats) {
  try {
    const result = await judge(r);
    const score = Number(result.score ?? 0);
    const flags = Array.isArray(result.flags) ? result.flags : [];

    for (const f of flags) stats.flagCounts[f] = (stats.flagCounts[f] ?? 0) + 1;

    if (score >= 7) stats.solid++;
    else if (score >= 6) stats.ok++;
    else {
      stats.blocker++;
      if (stats.blockerSamples.length < 5) {
        stats.blockerSamples.push({ id: r.id.slice(0, 8), course: r.course, score, flags, reason: result.reason });
      }
      // Tighter: unapprove anything ≤ THRESHOLD
      if (!dry && score <= THRESHOLD) {
        await sql`
          UPDATE questions
          SET "isApproved" = false,
              "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':blocker:s' + score},
              "updatedAt" = NOW()
          WHERE id = ${r.id}
        `;
      }
    }
    if (!dry && score > THRESHOLD) {
      await sql`
        UPDATE questions
        SET "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':s' + score},
            "updatedAt" = NOW()
        WHERE id = ${r.id}
      `;
    }
    stats.processed++;
    if (stats.processed % 50 === 0) {
      const elapsed = (Date.now() - stats.start) / 1000;
      const pct = (stats.processed / stats.total * 100).toFixed(1);
      const blockPct = (stats.blocker / stats.processed * 100).toFixed(1);
      console.log(`[${stats.processed}/${stats.total}] ${pct}% | solid=${stats.solid} ok=${stats.ok} blocker=${stats.blocker} (${blockPct}%) | ${(stats.processed / elapsed).toFixed(1)} q/s`);
    }
  } catch (e) {
    stats.errors++;
    if (stats.errors <= 5) console.error(`✗ ${r.id.slice(0, 8)}: ${e.message?.slice(0, 80)}`);
  }
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
  FROM questions
  WHERE course::text LIKE ${groupPrefix + '%'}
    AND "isApproved" = true
    AND "questionType" = 'MCQ'
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
  ORDER BY RANDOM()
`;

const target = Math.min(rows.length, LIMIT);
console.log(`AI-judge fast — group=${groupArg} threshold=${THRESHOLD} workers=${WORKERS} target=${target}`);

const stats = {
  total: target, processed: 0, solid: 0, ok: 0, blocker: 0, errors: 0,
  flagCounts: {}, blockerSamples: [], start: Date.now(),
};

// Worker pool: each worker pulls next index off a shared counter.
let nextIdx = 0;
async function worker() {
  while (true) {
    const i = nextIdx++;
    if (i >= target) break;
    await processOne(rows[i], stats);
  }
}

await Promise.all(Array.from({ length: WORKERS }, () => worker()));

const elapsed = (Date.now() - stats.start) / 1000;
console.log(`\n── Summary (${elapsed.toFixed(1)}s) ──`);
console.log(`  Processed:  ${stats.processed} (${(stats.processed/elapsed).toFixed(1)} q/s)`);
console.log(`  Solid (≥7): ${stats.solid} (${(stats.solid/stats.processed*100).toFixed(1)}%)`);
console.log(`  OK (=6):    ${stats.ok} (${(stats.ok/stats.processed*100).toFixed(1)}%)`);
console.log(`  Blocker:    ${stats.blocker} (${(stats.blocker/stats.processed*100).toFixed(1)}%)`);
console.log(`  Errors:     ${stats.errors}`);
console.log(`\nFlag distribution:`);
for (const [f, n] of Object.entries(stats.flagCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${f}: ${n}`);
}
console.log(`\nBlocker samples:`);
for (const b of stats.blockerSamples) {
  console.log(`  ${b.id} ${b.course} score=${b.score} flags=[${b.flags.join(",")}] reason="${b.reason}"`);
}
