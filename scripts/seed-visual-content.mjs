#!/usr/bin/env node
/**
 * Seed Mermaid + vega-lite visual content into existing MCQ stimuli for
 * visual-heavy AP courses.
 *
 * The CB-grounded gap audit (2026-04-27) found that 14/14 AP courses have
 * 0 real images. CB exam content is heavy on visuals (Chemistry has 136
 * visual references in CB content; Bio has 8 multi-part-with-diagram).
 * Beta 8.7 shipped Mermaid + vega-lite client renderers; the gap is
 * content. Generator emits these blocks for new MCQs but not for the
 * 9,953 existing ones.
 *
 * Strategy: target courses where Mermaid (pathways/cycles) or vega-lite
 * (data plots) would naturally fit. For each target MCQ, ask Groq:
 *   - is the stimulus about a process/cycle (→ Mermaid graph) or a
 *     data scenario (→ vega-lite chart)?
 *   - generate the appropriate fenced block
 *   - prepend it to the existing stimulus
 *
 * Skips if AI says no visual would fit (idempotent + safe).
 *
 * Targets (visual-required, currently 0 visuals):
 *   - AP_BIOLOGY (pathways: Krebs, Calvin, ETC, signal cascades, gene exp)
 *   - AP_PSYCHOLOGY (conditioning diagrams, neural transmission)
 *   - AP_STATISTICS (data plots: dotplot, scatter, boxplot)
 *
 * Usage:
 *   node scripts/seed-visual-content.mjs --dry
 *   node scripts/seed-visual-content.mjs AP_BIOLOGY --limit 25
 *   node scripts/seed-visual-content.mjs            # all 3, default limit 30
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : 30;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const TARGETS = courseFilter ? [courseFilter] : ["AP_BIOLOGY", "AP_PSYCHOLOGY", "AP_STATISTICS"];

const PACE_MS = 1800;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Skip if stimulus already contains a Mermaid or vega-lite block.
const HAS_VISUAL_BLOCK = /```(?:mermaid|vega-lite|vegalite)\s/i;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

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
      temperature: 0.4,
      max_tokens: 800,
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

const COURSE_GUIDANCE = {
  AP_BIOLOGY: `For AP Biology, the visual block should be a Mermaid 'graph LR' or 'graph TD' showing a biological pathway, cycle, or cascade. Examples:
\`\`\`mermaid
graph LR
  A[Glucose] --> B[Pyruvate]
  B --> C[Acetyl-CoA]
  C --> D[Krebs Cycle]
  D --> E[Electron Transport Chain]
\`\`\`
Or a Punnett square as a Mermaid flowchart, signal cascade with kinase steps, etc.`,
  AP_PSYCHOLOGY: `For AP Psychology, the visual block should be a Mermaid diagram showing classical/operant conditioning, neural pathways, cognitive processes. Example:
\`\`\`mermaid
graph LR
  NS[Neutral Stimulus: bell] --> CS[Conditioned Stimulus]
  UCS[UCS: food] --> UCR[UCR: salivation]
  CS --> CR[CR: salivation]
\`\`\``,
  AP_STATISTICS: `For AP Statistics, the visual block should be a vega-lite spec for boxplot, scatter, bar, or histogram. Example:
\`\`\`vega-lite
{"mark":"bar","data":{"values":[{"x":"A","y":12},{"x":"B","y":18},{"x":"C","y":7}]},"encoding":{"x":{"field":"x","type":"nominal"},"y":{"field":"y","type":"quantitative"}},"width":280,"height":160}
\`\`\``,
};

(async () => {
  console.log(`\n🎨 Visual-content seeder ${dry ? "(DRY RUN)" : "(WRITE)"}\n`);

  let totalAdded = 0, totalSkipped = 0, totalErr = 0;

  for (const course of TARGETS) {
    const guidance = COURSE_GUIDANCE[course];
    if (!guidance) {
      console.log(`No guidance defined for ${course}, skipping.`);
      continue;
    }

    const rows = await sql`
      SELECT id, course, "questionText", stimulus, "correctAnswer"
      FROM questions
      WHERE course = ${course}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND stimulus IS NOT NULL
        AND LENGTH(stimulus) > 50
      ORDER BY RANDOM()
    `;
    const candidates = rows.filter((r) => !HAS_VISUAL_BLOCK.test(r.stimulus));
    const target = Math.min(candidates.length, LIMIT);
    console.log(`\n=== ${course} — ${candidates.length} stimuli without visual blocks. Will process ${target}. ===\n`);

    for (let i = 0; i < target; i++) {
      const r = candidates[i];
      const userPrompt = `Determine if this AP ${course.replace('AP_','')} MCQ would benefit from a visual diagram/chart inline in the stimulus.

${guidance}

Question: ${r.questionText}
Existing stimulus: ${r.stimulus.slice(0, 500)}
Correct answer: ${r.correctAnswer}

If a visual would fit naturally, generate the fenced block (mermaid for ${course === "AP_STATISTICS" ? "n/a" : "pathways/diagrams"}, vega-lite for charts). Keep it small (≤6 nodes for Mermaid, ≤8 data points for vega-lite). The block must be syntactically valid.

If no visual would fit (e.g. pure text/vocabulary question), return "skip": true.

Return JSON: { "block": "\\\`\\\`\\\`mermaid\\\\n... \\\\n\\\`\\\`\\\`", "type": "mermaid"|"vega-lite", "skip": false }
OR { "block": "", "type": "", "skip": true }`;

      try {
        if (dry) {
          totalSkipped++;
          if (i < 3) console.log(`  [DRY] ${r.id.slice(0,8)} — would attempt visual`);
          continue;
        }
        const result = await callGroq(
          "You are an AP exam content editor adding visual diagrams to MCQ stimuli. Generate ONLY syntactically-valid Mermaid or vega-lite blocks. If no visual fits, skip cleanly.",
          userPrompt,
        );
        if (result.skip || !result.block) {
          totalSkipped++;
          continue;
        }
        // Sanity check: block must contain expected fence
        if (!/```(mermaid|vega-lite|vegalite)/i.test(result.block)) {
          totalSkipped++;
          continue;
        }
        // Validate + auto-fix common Mermaid syntax typos:
        //   -->|label|> → -->|label|   (Mermaid expects no trailing > on
        //                               edge-label arrows)
        //   --|label|>  → -->|label|   (broken arrow head)
        // Repair before persisting.
        let safeBlock = result.block
          .replace(/-->\|([^|\n]+)\|>/g, "-->|$1|")
          .replace(/==>\|([^|\n]+)\|>/g, "==>|$1|")
          .replace(/---\|([^|\n]+)\|>/g, "-->|$1|");
        // Reject blocks with structural Mermaid errors that can't be fixed
        // by simple substitution (e.g. unmatched quotes inside [labels]).
        if (/```mermaid/i.test(safeBlock)) {
          const lines = safeBlock.split("\n");
          // Each non-fence line in a Mermaid block should declare a node
          // or edge — reject if any line still has the buggy `|>` after fix.
          if (lines.some((l) => /\|>/.test(l))) {
            totalSkipped++;
            continue;
          }
        }
        // Prepend the visual block to the stimulus. Ensure the closing
        // fence ends with a newline so any prepended stimulus content
        // doesn't fuse onto the same line (which breaks the markdown
        // closing-fence detection — bug found 2026-04-27).
        const safeBlockTrimmed = safeBlock.trimEnd();
        const newStim = `${safeBlockTrimmed}\n\n${r.stimulus.trimStart()}`;
        await sql`UPDATE questions SET stimulus = ${newStim} WHERE id = ${r.id}`;
        totalAdded++;
        if (totalAdded <= 3 || totalAdded % 20 === 0) {
          const blockType = result.type || (result.block.includes("mermaid") ? "mermaid" : "vega-lite");
          console.log(`  ✓ ${r.id.slice(0,8)} (+${blockType})`);
        }
      } catch (e) {
        totalErr++;
        if (totalErr < 5) console.error(`  ✗ ${r.id.slice(0,8)}: ${e.message?.slice(0,80)}`);
      }
      await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Visuals added: ${totalAdded}`);
  console.log(`  Skipped (no visual fit): ${totalSkipped}`);
  console.log(`  Errors: ${totalErr}`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
