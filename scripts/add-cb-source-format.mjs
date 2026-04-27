#!/usr/bin/env node
/**
 * Add CB-strict source citations to History/Gov MCQs that lack them.
 *
 * The CB-grounded gap audit (2026-04-27) found:
 *   - AP_WORLD_HISTORY: CB has 21 source citations across local PDFs;
 *     ours have 0 in the 30-MCQ sample.
 *   - AP_US_HISTORY: CB has 37 citations; ours have 0.
 *
 * CB strict format: `Source: <Author full name>, <descriptor>, <type>, <year>`
 * Real CB examples:
 *   - "Source: Jack Weatherford, United States anthropologist, academic book, 1988"
 *   - "Source: Mary Wollstonecraft, English philosopher and women's rights advocate, political pamphlet, 1792"
 *   - "Source: Mahatma Gandhi, Indian nationalist leader, public speech, 1942"
 *
 * For each MCQ in AP_WH / AP_USH / AP_EURO / AP_USGOV that has a non-empty
 * stimulus but no CB-format source citation, ask Groq to add one. The
 * prompt provides the existing stimulus + question + correctAnswer and
 * asks the AI to (a) identify a plausible real historical author whose
 * documented quote could match the stimulus's content and time period,
 * (b) emit the citation in CB-strict format, (c) prepend it to the stimulus.
 *
 * Skips already-cited stimuli (idempotent).
 *
 * Usage:
 *   node scripts/add-cb-source-format.mjs --dry             # report
 *   node scripts/add-cb-source-format.mjs                   # apply all
 *   node scripts/add-cb-source-format.mjs AP_WORLD_HISTORY  # one course
 *   node scripts/add-cb-source-format.mjs --limit 30        # cap per course
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const TARGETS = courseFilter
  ? [courseFilter]
  : ["AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT"];

const PACE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CB_SOURCE = /Source:\s*[A-Z][^,]+,\s*[^,]+,\s*[^,]+,\s*\d{3,4}/;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) {
  console.error("Missing GROQ_API_KEY"); process.exit(1);
}

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

(async () => {
  console.log(`\n📜 CB source-format upgrade ${dry ? "(DRY RUN)" : "(WRITE)"}\n`);

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const course of TARGETS) {
    const rows = await sql`
      SELECT id, course, "questionText", stimulus, "correctAnswer"
      FROM questions
      WHERE course = ${course}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND stimulus IS NOT NULL
        AND LENGTH(stimulus) > 50
    `;

    const candidates = rows.filter((r) => !CB_SOURCE.test(r.stimulus));
    const targetCount = Math.min(candidates.length, LIMIT);
    console.log(`\n=== ${course} — ${candidates.length} stimuli without CB-format source. Will process ${targetCount}. ===\n`);

    for (let i = 0; i < targetCount; i++) {
      const r = candidates[i];
      const userPrompt = `For this AP ${course.replace('AP_','').replace(/_/g, ' ')} question, identify a plausible REAL historical figure who could have authored the stimulus's content and produce a College-Board-style source citation in this exact format:

Source: <Author full name>, <descriptor of who they are with nationality + role>, <type of source — e.g. "academic book" / "political pamphlet" / "speech" / "letter" / "journal article" / "newspaper editorial">, <year>

Real CB examples:
- Source: Jack Weatherford, United States anthropologist, academic book, 1988
- Source: Mary Wollstonecraft, English philosopher and women's rights advocate, political pamphlet, 1792
- Source: Mahatma Gandhi, Indian nationalist leader, public speech, 1942

The author MUST be a real verifiable historical figure whose documented work plausibly matches the stimulus. Match the time period implied by the stimulus content. Do NOT fabricate.

If you cannot find a plausible real source for this stimulus, return "skip": true.

Question stem: ${r.questionText}
Existing stimulus: ${r.stimulus.slice(0, 600)}
Correct answer: ${r.correctAnswer}

Return JSON: { "source": "Source: <name>, <desc>, <type>, <year>", "skip": false }
OR { "source": "", "skip": true } if no plausible source exists.`;

      try {
        if (dry) {
          totalSkipped++;
          if (i < 3) console.log(`  [DRY] ${r.id.slice(0,8)} — would attempt CB-source generation`);
          continue;
        }
        const result = await callGroq(
          "You are a College Board exam content expert. Generate plausible CB-strict source attributions only when verifiable real historical figures match. Never fabricate.",
          userPrompt,
        );
        if (result.skip || !result.source || !CB_SOURCE.test(result.source)) {
          totalSkipped++;
          continue;
        }
        // Prepend the new source citation to the existing stimulus.
        const newStim = `${result.source}\n\n${r.stimulus}`;
        await sql`UPDATE questions SET stimulus = ${newStim} WHERE id = ${r.id}`;
        totalAdded++;
        if (totalAdded <= 3) {
          console.log(`  ✓ ${r.id.slice(0,8)}: ${result.source}`);
        } else if (totalAdded % 25 === 0) {
          console.log(`  [${totalAdded}] processed`);
        }
      } catch (e) {
        totalErrors++;
        console.error(`  ✗ ${r.id.slice(0,8)}: ${e.message?.slice(0,80)}`);
      }
      await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  CB sources added: ${totalAdded}`);
  console.log(`  Skipped (no plausible source): ${totalSkipped}`);
  console.log(`  Errors: ${totalErrors}`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
