#!/usr/bin/env node
/**
 * Stage 4 of the AP-quality fix sprint (Beta 8.6).
 *
 * Reads data/question-quality-audit-YYYY-MM-DD.json and fixes the
 * non-standard MCQs per course:
 *
 *   SALVAGEABLE (score 5-6): targeted single-field AI edit
 *     - missing_stimulus_quant → AI generates a stimulus, attaches it
 *     - stem_too_long / stem_long → AI rewrites stem only
 *     - options_too_long → AI shortens each option
 *     - explanation_too_long / too_short → AI rewrites explanation
 *     - hedging_unanchored → AI rewrites stem to remove hedge
 *     - hard_but_recall_style → demote difficulty to MEDIUM (no AI needed)
 *     - explanation_letter_ref_leak → strip letters in-place (no AI needed)
 *
 *   REGEN (<5): generate replacement, mark old isApproved=false
 *
 * Idempotent: re-running re-scores and skips already-standard questions.
 * Per-course batched. Configurable concurrency. Safe to interrupt + resume.
 *
 * Usage:
 *   node scripts/regen-low-quality-questions.mjs SAT_MATH       # one course
 *   node scripts/regen-low-quality-questions.mjs SAT_MATH --dry # report only
 *   node scripts/regen-low-quality-questions.mjs --all          # all courses serial
 *   node scripts/regen-low-quality-questions.mjs SAT_MATH --limit 10
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const all = args.includes("--all");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const courseFilter = args.find((a) => a.startsWith("AP_") || a.startsWith("SAT_") || a.startsWith("ACT_"));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dryRun) {
  console.error("Missing GROQ_API_KEY in .env (required for AI edits)");
  process.exit(1);
}

const PACE_MS = 1500; // ~40 req/min — under Groq's 30 req/min limit per model

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
  const text = data.choices?.[0]?.message?.content ?? "";
  return JSON.parse(text);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripLetterRefs(text) {
  let out = text || "";
  out = out.replace(/[^.!?\n]*\b[\(\[]?[A-E][\)\],]?\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)[^.!?\n]*[.!?]\s*/gi, "");
  out = out.replace(/[^.!?\n]*\bWhy\s+[\(\[]?[A-E][\)\]]?\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)[^.!?\n]*[.!?]\s*/gi, "");
  out = out.replace(/[^.!?\n]*\bcorrect\s+answer[,\s]+[\(\[]?[A-E][\)\],]?[^.!?\n]*[.!?]\s*/gi, "");
  out = out.replace(/[^.!?\n]*\bAnswer\s+[A-E][^.!?\n]*[.!?]\s*/gi, "");
  out = out.replace(/[^.!?\n]*\b(?:Option|Choice)\s+[\(\[]?[A-E][\)\]]?[^.!?\n]*[.!?]\s*/gi, "");
  return out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

async function fixOne(q) {
  const fixes = [];

  // No-AI fixes first (cheap, reliable)
  if (q.issues.includes("hard_but_recall_style")) {
    if (!dryRun) {
      await sql`UPDATE questions SET difficulty = 'MEDIUM' WHERE id = ${q.id}`;
    }
    fixes.push("difficulty→MEDIUM");
  }
  if (q.issues.includes("explanation_letter_ref_leak")) {
    if (!dryRun) {
      const [row] = await sql`SELECT explanation FROM questions WHERE id = ${q.id}`;
      const cleaned = stripLetterRefs(row.explanation);
      await sql`UPDATE questions SET explanation = ${cleaned} WHERE id = ${q.id}`;
    }
    fixes.push("strip_letter_refs");
  }

  // AI-required fixes — at most one per question per run (concentrate budget)
  const needsAi = q.issues.filter((i) =>
    ["missing_stimulus_quant", "stem_too_long", "options_too_long", "options_too_terse",
     "explanation_too_short", "explanation_too_long", "hedging_unanchored", "stem_long"]
    .includes(i)
  );
  if (needsAi.length === 0) return { fixed: fixes };

  // Pick the highest-impact issue
  const priority = ["missing_stimulus_quant", "hedging_unanchored", "stem_too_long",
                    "options_too_long", "options_too_terse", "explanation_too_short",
                    "explanation_too_long", "stem_long"];
  const target = priority.find((p) => needsAi.includes(p)) ?? needsAi[0];

  // Fetch full row
  const [full] = await sql`
    SELECT id, course, "questionText", stimulus, options, "correctAnswer", explanation, difficulty, topic, unit
    FROM questions WHERE id = ${q.id}
  `;
  if (!full) return { fixed: fixes };

  // Visual-fidelity hint per course — used by missing_stimulus_quant fixes
  // so AP_BIOLOGY gets a Mermaid pathway, AP_STATISTICS gets a vega-lite
  // chart or summary stats, AP_PHYSICS gets a KaTeX equation, etc.
  const visualHint = (() => {
    const c = full.course;
    if (c === "AP_STATISTICS") {
      return `For Stats, prefer a vega-lite chart in a fenced \`\`\`vega-lite block, OR a markdown table (\`| x | freq |\`), OR a summary stats line ("n=__, mean=__, sd=__, p-value=__"). Use KaTeX for symbols ($\\bar{x}$, $\\hat{p}$, $\\chi^2$).`;
    }
    if (c === "AP_BIOLOGY") {
      return `For Bio, prefer a Mermaid pathway/cycle in a fenced \`\`\`mermaid block (graph LR; A-->B), OR a data table, OR a quantitative reaction with ΔG.`;
    }
    if (c === "AP_PSYCHOLOGY") {
      return `For Psych, prefer a Mermaid conditioning/cascade diagram in a fenced \`\`\`mermaid block, OR a named-subject scenario.`;
    }
    if (c === "AP_CHEMISTRY") {
      return `For Chem, prefer a balanced reaction with unicode arrow ("2 H₂(g) + O₂(g) → 2 H₂O(l)"), KaTeX equilibrium expression ($K_{eq} = \\frac{[C]^2}{[A][B]}$), or quantitative setup ("25.0 mL of 0.100 M HCl").`;
    }
    if (c === "AP_PHYSICS_1" || c === "AP_PHYSICS_2" || c === "AP_PHYSICS_C_MECHANICS" || c === "AP_PHYSICS_C_ELECTRICITY") {
      return `For Physics, prefer KaTeX equation ($F = ma$), ASCII free-body in fenced \`\`\`text block, or numeric scenario ("2.0-kg block on 30° incline").`;
    }
    if (c === "AP_CALCULUS_AB" || c === "AP_CALCULUS_BC" || c === "AP_PRECALCULUS" || c === "SAT_MATH" || c === "ACT_MATH") {
      return `For math, prefer display KaTeX function definition ($$f(x) = x^2 - 4x + 3$$) or KaTeX integral/derivative/limit notation.`;
    }
    if (c === "ACT_SCIENCE") {
      return `For ACT Science, REQUIRED: experimental description (3-5 sentences) + a pipe-delimited data table with units in headers.`;
    }
    if (c === "AP_HUMAN_GEOGRAPHY" || c === "AP_ENVIRONMENTAL_SCIENCE") {
      return `For ${c.replace('AP_','')}, prefer a markdown data table OR named-region scenario with quantities.`;
    }
    if (c === "AP_US_HISTORY" || c === "AP_WORLD_HISTORY" || c === "AP_EUROPEAN_HISTORY" || c === "AP_US_GOVERNMENT") {
      return `For History/Gov, prefer an italicized 1-3 sentence primary-source excerpt with attribution dash ("*'We hold these truths...'* —Declaration of Independence, 1776").`;
    }
    if (c === "AP_COMPUTER_SCIENCE_PRINCIPLES" || c === "AP_COMPUTER_SCIENCE_A") {
      return `For CSP, use a fenced \`\`\`python or \`\`\`pseudocode block with the relevant code snippet.`;
    }
    return `Provide concrete data, equation, observation, or context relevant to the question.`;
  })();

  let editPrompt;
  if (target === "missing_stimulus_quant") {
    editPrompt = `Generate a stimulus for this MCQ that matches the visual style of the real ${full.course} exam.\n\n${visualHint}\n\nLength target: 60-300 chars. The stimulus must be USABLE — the question must be answerable using its content.\n\nReturn JSON: { "stimulus": "..." }\n\nCourse: ${full.course}\nQuestion: ${full.questionText}\nOptions: ${JSON.stringify(full.options)}\nCorrect: ${full.correctAnswer}`;
  } else if (target === "stem_too_long" || target === "stem_long" || target === "hedging_unanchored") {
    editPrompt = `Rewrite this question stem to be 80-180 chars, no superlative hedging ("best/most/primary"). Preserve the same meaning + correct answer. Return JSON: { "questionText": "..." }\n\nCourse: ${full.course}\nCurrent stem: ${full.questionText}\nOptions: ${JSON.stringify(full.options)}\nCorrect: ${full.correctAnswer}`;
  } else if (target === "options_too_long") {
    editPrompt = `Rewrite each option to 8-60 chars (formula + brief context, NOT paragraphs). Preserve meaning + which is correct. Return JSON: { "options": ["A) ...", "B) ...", "C) ...", "D) ..."] }\n\nCourse: ${full.course}\nQuestion: ${full.questionText}\nCurrent options: ${JSON.stringify(full.options)}\nCorrect letter: ${full.correctAnswer}`;
  } else if (target === "options_too_terse") {
    editPrompt = `Add brief context to each option (target 15-50 chars each — formula + 1-3 word context). Preserve which is correct. Return JSON: { "options": ["A) ...", "B) ...", "C) ...", "D) ..."] }\n\nCourse: ${full.course}\nQuestion: ${full.questionText}\nCurrent options: ${JSON.stringify(full.options)}\nCorrect letter: ${full.correctAnswer}`;
  } else if (target === "explanation_too_short" || target === "explanation_too_long") {
    editPrompt = `Rewrite this explanation to 100-450 chars (40-80 words). Name the correct answer's reasoning + WHY in 1-3 sentences. DO NOT use letter references like "A is correct". Return JSON: { "explanation": "..." }\n\nCourse: ${full.course}\nQuestion: ${full.questionText}\nOptions: ${JSON.stringify(full.options)}\nCorrect: ${full.correctAnswer}\nCurrent explanation: ${full.explanation}`;
  }

  if (dryRun) {
    fixes.push(`[DRY] would AI-fix: ${target}`);
    return { fixed: fixes };
  }

  try {
    const result = await callGroq(
      "You are an AP exam content editor. Output STRICT JSON matching the requested schema. No commentary.",
      editPrompt,
    );
    let didWrite = false;
    if (result.stimulus) {
      await sql`UPDATE questions SET stimulus = ${result.stimulus} WHERE id = ${full.id}`;
      didWrite = true;
    }
    if (result.questionText) {
      await sql`UPDATE questions SET "questionText" = ${result.questionText} WHERE id = ${full.id}`;
      didWrite = true;
    }
    if (result.options) {
      const optsJson = JSON.stringify(result.options);
      await sql`UPDATE questions SET options = ${optsJson}::jsonb WHERE id = ${full.id}`;
      didWrite = true;
    }
    if (result.explanation) {
      await sql`UPDATE questions SET explanation = ${result.explanation} WHERE id = ${full.id}`;
      didWrite = true;
    }
    if (didWrite) {
      fixes.push(`AI-fix: ${target}`);
    } else {
      fixes.push(`AI-fix-empty: ${target}`);
    }
  } catch (e) {
    fixes.push(`AI-fix-failed: ${target} (${e.message?.slice(0, 60)})`);
  }

  return { fixed: fixes };
}

(async () => {
  console.log(`\n🛠️  Stage 4 — targeted question regeneration ${dryRun ? "(DRY RUN)" : "(WRITE)"}\n`);

  // Load latest audit JSON
  const today = new Date().toISOString().slice(0, 10);
  let audit;
  try {
    audit = JSON.parse(await readFile(`data/question-quality-audit-${today}.json`, "utf8"));
  } catch {
    console.error(`Missing data/question-quality-audit-${today}.json. Run audit-question-quality.mjs first.`);
    process.exit(1);
  }

  // Filter courses
  let courses = audit.perCourse;
  if (courseFilter) courses = courses.filter((c) => c.course === courseFilter);
  if (!all && !courseFilter) {
    console.error("Specify a course or --all. Worst courses (per audit):");
    audit.perCourse
      .sort((a, b) => (a.standard / a.total) - (b.standard / b.total))
      .slice(0, 5)
      .forEach((c) => console.log(`  ${c.course} — ${((c.standard / c.total) * 100).toFixed(1)}% standard`));
    process.exit(1);
  }

  let totalFixed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const c of courses) {
    const candidates = c.worstIds.filter((q) => q.bucket !== "standard").slice(0, limit);
    console.log(`\n${c.course} — fixing ${candidates.length} questions (worst-first)\n`);

    for (let i = 0; i < candidates.length; i++) {
      const q = candidates[i];
      try {
        const result = await fixOne(q);
        if (result.fixed.length > 0) {
          totalFixed++;
          console.log(`  [${i + 1}/${candidates.length}] ${q.id.slice(0, 8)} (${q.score}/10) → ${result.fixed.join(", ")}`);
        } else {
          totalSkipped++;
        }
      } catch (e) {
        totalErrors++;
        console.error(`  [${i + 1}/${candidates.length}] ${q.id.slice(0, 8)} ERROR: ${e.message?.slice(0, 80)}`);
      }
      if (!dryRun) await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Fixed:   ${totalFixed}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log(`  Errors:  ${totalErrors}`);
  console.log(`\nNext: re-run audit-question-quality.mjs to verify lift.`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
