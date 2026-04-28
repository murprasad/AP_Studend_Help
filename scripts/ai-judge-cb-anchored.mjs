// CB-anchored AI judge: uses a real CB sample question as gold-standard
// reference and asks Groq to compare our questions against it for the
// subtle quality dimensions the standalone judge missed:
//   - Cognitive demand (spot-the-word vs synthesize)
//   - Distractor plausibility (obvious dummies vs all-4-plausible)
//   - Stimulus-as-evidence (stim provides EVIDENCE for answer vs stating it)
//
// Threshold: score ≤6 → unapprove (strict; CB-vs-ours sampling showed our
// supposedly-9/10 questions had gaps).
//
// Idempotent — uses modelUsed marker "cb-anchored-2026-04-28".
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "cb-anchored-2026-04-28";
const PACE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const courseArg = args.find(a => a.startsWith("--course="))?.split("=")[1];
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : 50;
const WORKERS = 4;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// CB reference samples — one per course family. These came from the
// actual official CB SAT/AP PDFs.
const CB_REFERENCES = {
  SAT_READING_WRITING: `[CB SAT R&W — Command of Evidence]
Stimulus: '"Ghosts of the Old Year" is an early 1900s poem by James Weldon Johnson. In the poem, the speaker describes experiencing an ongoing cycle of anticipation followed by regretful reflection: ______'
Question: 'Which quotation from "Ghosts of the Old Year" most effectively illustrates the claim?'
Options: A) "The snow has ceased its fluttering flight..." B) "And so the years go swiftly by, / Each, coming, brings ambitions high, / And each, departing, leaves a sigh / Linked to the past." C) "What does this brazen tongue declare..." D) "It tells of many a squandered day..."
Correct: B
WHAT MAKES THIS CB-QUALITY:
- All 4 options are REAL verses from the SAME poem (not fluff distractors)
- Stim sets up a 2-part claim ("anticipation" AND "regretful reflection")
- Correct answer uniquely satisfies BOTH parts
- Wrong options each match ONE part but not BOTH
- Student must SYNTHESIZE — no verbatim spotting`,

  SAT_MATH: `[CB SAT Math — Algebra]
Stimulus: 'The graph of the function f, where y = f(x), models the linear relationship between two variables. The slope represents the cost, in dollars, per game.'
Question: 'Which interpretation describes the slope of the graph?'
Options: A) cost per game played B) total cost of system C) cost per dollar D) game count
Correct: A
WHAT MAKES THIS CB-QUALITY:
- Stim describes the SETUP ("function models linear relationship")
- Q asks for INTERPRETATION (requires understanding what slope means in context)
- 4 plausible interpretations, only A correctly maps slope = $/game
- Correct answer derived by understanding "slope" + the contextual "per" relationship
- No word-spotting`,

  AP_WORLD_HISTORY: `[CB AP World — DBQ-style MCQ]
Stimulus: 'Ibn Battuta, 1352: "The king of Mali possesses immense authority and vast dominions. He has a great number of armed men... The greater part of the people of Mali are like the Berbers... They maintain great markets and conduct extensive trade in gold, salt, and merchandise from the Sudan."'
Question: 'Based on this account, what factor enabled Mali''s prosperity?'
Options: A) Military superiority over Berber tribes B) Control of trans-Saharan trade routes (gold and salt) C) Adoption of Christianity from North African contacts D) Maritime trade in the Mediterranean
Correct: B
WHAT MAKES THIS CB-QUALITY:
- Stim is REAL primary source quote with attribution
- 4 options are HISTORICALLY plausible (not absurd)
- Distractors include factual errors (C: Mali was Islamic not Christian; D: Mali was inland not maritime)
- Correct answer uses INFERENCE from "great markets" + "trade in gold and salt"
- Student must connect source detail to broader concept`,
};

async function judgeAgainstCB(q, cbRef) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const correctLetter = String(q.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);

  const userPrompt = `Compare this MCQ to a real College Board SAMPLE question for the same course family. Score how close OUR question matches CB's quality bar.

== REAL CB REFERENCE ==
${cbRef}

== OUR QUESTION ==
Course: ${q.course}
Stimulus: ${q.stimulus ?? "(none)"}
Question: ${q.questionText}
Options:
${opts.map((o, i) => "  " + String.fromCharCode(65 + i) + ") " + o).join("\n")}
Correct: ${correctLetter}

Score 1-10 on CB-fidelity. Specifically check:
  - Does the stim PROVIDE EVIDENCE the student must synthesize, or DOES IT STATE THE ANSWER?
  - Are all 4 options PLAUSIBLE (CB style) or are 3 obvious-dummy distractors?
  - Does the question demand SYNTHESIS / INFERENCE, or just word-spotting?
  - Is the source authentic-feeling (real attribution, real quote)?

Rubric:
  9-10: Matches CB quality on all 4 dimensions.
  7-8 : Solid but minor gap (e.g. one weak distractor).
  5-6 : Borderline — CB-savvy student would notice difference.
  1-4 : Markedly weaker than CB. Stim states answer, dummy distractors, or word-spotting.

Return JSON: {"score": <1-10>, "vs_cb": "<one sentence diff vs CB>", "weakest_dim": "stim_states_answer|dummy_distractors|word_spotting|fake_source|none"}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You compare student-bank MCQs to real College Board sample questions. Be strict on CB-fidelity. Score 9-10 ONLY if the question matches CB on all 4 dimensions." },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2, max_tokens: 200, response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

const courses = courseArg ? [courseArg] : Object.keys(CB_REFERENCES);
const stats = {
  total: 0, processed: 0, errors: 0,
  scores: { strong: 0, solid: 0, border: 0, blocker: 0 },
  weakestDims: {}, blockerSamples: [],
};

for (const c of courses) {
  if (!CB_REFERENCES[c]) continue;
  const rows = await sql`
    SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
    FROM questions
    WHERE course = ${c}::"ApCourse"
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
      AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    ORDER BY RANDOM() LIMIT ${LIMIT}
  `;
  console.log(`\n== ${c} (n=${rows.length}) ==`);
  stats.total += rows.length;

  let i = 0;
  async function worker() {
    while (i < rows.length) {
      const r = rows[i++];
      try {
        const j = await judgeAgainstCB(r, CB_REFERENCES[c]);
        const score = Number(j.score ?? 0);
        const dim = j.weakest_dim ?? "none";
        stats.weakestDims[dim] = (stats.weakestDims[dim] ?? 0) + 1;
        if (score >= 9) stats.scores.strong++;
        else if (score >= 7) stats.scores.solid++;
        else if (score >= 6) stats.scores.border++;
        else {
          stats.scores.blocker++;
          if (stats.blockerSamples.length < 5) {
            stats.blockerSamples.push({ id: r.id.slice(0, 8), course: c, score, dim, vs: j.vs_cb });
          }
          if (!dry) {
            await sql`UPDATE questions SET "isApproved"=false, "modelUsed"=COALESCE("modelUsed",'') || ${'|' + MARKER + ':blocker:s' + score}, "updatedAt"=NOW() WHERE id = ${r.id}`;
          }
        }
        if (!dry && score >= 6) {
          await sql`UPDATE questions SET "modelUsed"=COALESCE("modelUsed",'') || ${'|' + MARKER + ':s' + score}, "updatedAt"=NOW() WHERE id = ${r.id}`;
        }
        stats.processed++;
        await sleep(PACE_MS / WORKERS);
      } catch (e) {
        stats.errors++;
      }
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, () => worker()));
}

console.log(`\n## CB-anchored audit summary`);
console.log(`Processed: ${stats.processed} (errors ${stats.errors})`);
const pct = (n) => stats.processed > 0 ? ((n / stats.processed) * 100).toFixed(1) : 0;
console.log(`Strong (≥9): ${stats.scores.strong} (${pct(stats.scores.strong)}%)`);
console.log(`Solid (7-8): ${stats.scores.solid} (${pct(stats.scores.solid)}%)`);
console.log(`Border (=6): ${stats.scores.border} (${pct(stats.scores.border)}%)`);
console.log(`Blocker (≤5): ${stats.scores.blocker} (${pct(stats.scores.blocker)}%)`);
console.log(`\nWeakest dim distribution:`);
for (const [d, n] of Object.entries(stats.weakestDims).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${d}: ${n} (${pct(n)}%)`);
}
console.log(`\nBlocker samples:`);
for (const b of stats.blockerSamples) {
  console.log(`\n  ${b.id} ${b.course} score=${b.score} dim=${b.dim}`);
  console.log(`  vs CB: ${b.vs}`);
}
