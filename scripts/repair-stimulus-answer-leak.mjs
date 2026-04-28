// Repair MCQs where the stimulus paraphrases the correct answer.
//
// Strategy:
//   1. Detect leak (verbatim ≥5-token n-gram OR ≥60% answer-token overlap).
//   2. For BAD leaks (verbatim ≥7-token n-gram OR ≥80% overlap):
//      → unapprove immediately (CB-savvy student would spot in 3 sec).
//   3. For MILD leaks (verbatim 5-6 tokens OR 60-79% overlap):
//      → ask Groq to rewrite the stimulus into a text that supports
//        the question WITHOUT containing the answer phrase verbatim.
//
// Idempotent — uses modelUsed marker "stim-leak-fix-2026-04-28".
//
// Args: --dry, --course=AP_X, --limit=N, --unapprove-only, --regen-only
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "stim-leak-fix-2026-04-28";
const PACE_MS = 2000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const unapproveOnly = args.includes("--unapprove-only");
const regenOnly = args.includes("--regen-only");
const courseArg = args.find(a => a.startsWith("--course="))?.split("=")[1];
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function normalize(s) {
  return String(s ?? "").toLowerCase().replace(/^[a-e][\)\.]?\s*/i, "")
    .replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(s) { return normalize(s).split(" ").filter(t => t.length > 2); }
function longestNgramMatch(aTokens, bTokens) {
  const bset = new Set();
  for (let i = 0; i < bTokens.length; i++)
    for (let j = 1; j <= Math.min(15, bTokens.length - i); j++)
      bset.add(bTokens.slice(i, i + j).join(" "));
  let longest = 0;
  for (let i = 0; i < aTokens.length; i++)
    for (let j = 1; j <= Math.min(15, aTokens.length - i); j++) {
      const phrase = aTokens.slice(i, i + j).join(" ");
      if (bset.has(phrase) && j > longest) longest = j;
    }
  return longest;
}
function tokenOverlap(aTokens, bTokens) {
  if (aTokens.length === 0) return 0;
  const bset = new Set(bTokens);
  return aTokens.filter(t => bset.has(t)).length / aTokens.length;
}

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5, max_tokens: 400,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

const groupArg = args.find(a => a.startsWith("--group="))?.split("=")[1];
const groupPrefix = groupArg === "SAT" ? "SAT_" : groupArg === "ACT" ? "ACT_" : groupArg === "CLEP" ? "CLEP_" : "AP_";

const rows = courseArg
  ? await sql`
      SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
      FROM questions
      WHERE course = ${courseArg}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND stimulus IS NOT NULL
        AND LENGTH(stimulus) > 50
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    `
  : await sql`
      SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
      FROM questions
      WHERE course::text LIKE ${groupPrefix + '%'}
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND stimulus IS NOT NULL
        AND LENGTH(stimulus) > 50
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    `;

console.log(`Scanning ${rows.length} approved AP MCQs (course filter: ${courseArg ?? 'all AP'})…`);

let unapproved = 0, regenerated = 0, regenErrors = 0, scanned = 0, clean = 0, processed = 0;

for (const r of rows) {
  if (processed >= LIMIT) break;
  scanned++;
  let opts;
  try { opts = typeof r.options === "string" ? JSON.parse(r.options) : r.options; } catch { continue; }
  if (!Array.isArray(opts)) continue;

  const correctLetter = String(r.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);
  const idx = "ABCDE".indexOf(correctLetter);
  if (idx < 0 || idx >= opts.length) continue;
  const answerText = opts[idx];

  const aTokens = tokens(answerText);
  if (aTokens.length < 4) { clean++; continue; }

  const sTokens = tokens(r.stimulus);
  const longest = longestNgramMatch(aTokens, sTokens);
  const overlap = tokenOverlap(aTokens, sTokens);

  const isBadLeak = longest >= 7 || overlap >= 0.80;
  const isMildLeak = !isBadLeak && (longest >= 5 || overlap >= 0.60);
  if (!isBadLeak && !isMildLeak) { clean++; continue; }

  processed++;

  if (isBadLeak && !regenOnly) {
    if (dry) {
      console.log(`  [DRY UNAPPROVE] ${r.id.slice(0,8)} ${r.course} (overlap=${overlap.toFixed(2)}, ngram=${longest}): ${String(answerText).slice(0, 60)}…`);
      unapproved++;
      continue;
    }
    await sql`
      UPDATE questions
      SET "isApproved" = false,
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':unapproved'},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    unapproved++;
    if (unapproved <= 3 || unapproved % 50 === 0) {
      console.log(`  ✗ UNAPPROVED ${r.id.slice(0,8)} ${r.course} (overlap=${overlap.toFixed(2)}, ngram=${longest})`);
    }
    continue;
  }

  if (isMildLeak && !unapproveOnly) {
    if (dry) {
      console.log(`  [DRY REGEN] ${r.id.slice(0,8)} ${r.course} (overlap=${overlap.toFixed(2)}, ngram=${longest})`);
      regenerated++;
      continue;
    }
    if (!GROQ_API_KEY) {
      regenErrors++;
      continue;
    }
    try {
      const prompt = `You are rewriting an AP exam stimulus to remove an "answer giveaway." The current stimulus paraphrases the correct answer too closely.

Question stem: ${r.questionText}
Options: ${opts.map((o,i)=>String.fromCharCode(65+i)+") "+o).join(" | ")}
Correct answer: ${correctLetter}) ${answerText}
Current stimulus: ${r.stimulus.slice(0, 600)}

Write a NEW stimulus that:
1. Provides historical/scientific evidence the question can use to reason TOWARD the correct answer.
2. Does NOT contain the answer phrase verbatim or near-verbatim.
3. Reads as a real College Board AP MCQ stimulus — primary source excerpt, dataset, scholar quote, statistical chart description.
4. Is 80-200 words.
5. Stays factually accurate to the topic.
6. Preserves the source attribution if applicable (e.g. "Source: ...").

Return JSON only: {"stimulus": "..."}`;
      const result = await callGroq(
        `You are an AP exam content editor. You write CB-style stimuli that support questions WITHOUT giving away the answer.`,
        prompt,
      );
      if (!result.stimulus || result.stimulus.length < 80) {
        regenErrors++;
        continue;
      }
      // Re-check the new stimulus doesn't leak
      const newTokens = tokens(result.stimulus);
      const newLongest = longestNgramMatch(aTokens, newTokens);
      const newOverlap = tokenOverlap(aTokens, newTokens);
      if (newLongest >= 5 || newOverlap >= 0.60) {
        // Regen still leaks — unapprove instead.
        await sql`
          UPDATE questions
          SET "isApproved" = false,
              "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':regen-still-leaks'},
              "updatedAt" = NOW()
          WHERE id = ${r.id}
        `;
        unapproved++;
        continue;
      }
      await sql`
        UPDATE questions
        SET stimulus = ${result.stimulus},
            "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':regenerated'},
            "updatedAt" = NOW()
        WHERE id = ${r.id}
      `;
      regenerated++;
      if (regenerated <= 3 || regenerated % 50 === 0) {
        console.log(`  ✓ REGEN ${r.id.slice(0,8)} ${r.course}: ${result.stimulus.slice(0, 80)}…`);
      }
    } catch (e) {
      regenErrors++;
      if (regenErrors <= 5) console.error(`  ✗ ${r.id.slice(0,8)}: ${e.message?.slice(0, 100)}`);
    }
    await sleep(PACE_MS);
  }
}

console.log(`\n── Summary ──`);
console.log(`  Scanned:      ${scanned}`);
console.log(`  Clean (ok):   ${clean}`);
console.log(`  Unapproved:   ${unapproved}`);
console.log(`  Regenerated:  ${regenerated}`);
console.log(`  Regen errors: ${regenErrors}`);
