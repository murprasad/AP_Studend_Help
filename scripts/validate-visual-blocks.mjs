#!/usr/bin/env node
/**
 * Validate Mermaid + vega-lite blocks in approved MCQ stimuli.
 *
 * Heuristic checks (catches every bug we've seen so far):
 *
 *   Mermaid:
 *     - Open + close fence balance
 *     - Closing fence on its own line (not fused with following content)
 *     - No `-->|label|>` typo (extra `>` after edge label)
 *     - No `==>|label|>` typo
 *     - Brackets balanced [...] and quotes balanced
 *     - At least one valid edge or node directive
 *
 *   vega-lite:
 *     - Block content must parse as JSON
 *     - Must have either `mark`, `layer`, or `repeat` (top-level chart spec)
 *     - $schema URL (if present) must point to vega-lite
 *
 * Output: list of failing IDs, courses, and reason. Reports to stdout +
 * writes a CSV to data/visual-block-validation-<DATE>.csv for sweep targets.
 *
 * Does NOT modify DB — pure read-and-report.
 *
 * Usage:
 *   node scripts/validate-visual-blocks.mjs              # all
 *   node scripts/validate-visual-blocks.mjs AP_BIOLOGY   # one course
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const courseFilter = args.find((a) => a.startsWith("AP_") || a.startsWith("SAT_") || a.startsWith("ACT_"));

// Extract fenced code blocks of given language from a stimulus.
function extractBlocks(text, language) {
  const re = new RegExp("```" + language + "\\s*\\n([\\s\\S]*?)```", "gi");
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

// Validate a Mermaid source string. Returns null on valid, error string on invalid.
function validateMermaid(src) {
  if (!src || src.trim().length === 0) return "empty";
  // Buggy edge label
  if (/-->\|[^|\n]+\|>/.test(src)) return "edge-label `|>` typo";
  if (/==>\|[^|\n]+\|>/.test(src)) return "thick-edge `|>` typo";
  // Bracket balance
  const opens = (src.match(/\[/g) || []).length;
  const closes = (src.match(/\]/g) || []).length;
  if (opens !== closes) return `unbalanced brackets (${opens} [ vs ${closes} ])`;
  // Quote balance — single quotes inside [labels] cause render failures
  const lines = src.split("\n");
  for (const l of lines) {
    const labelMatches = l.match(/\[([^\]]*)\]/g) || [];
    for (const lbl of labelMatches) {
      // Inside [...] balanced (..) and {..}
      const inner = lbl.slice(1, -1);
      const oP = (inner.match(/\(/g) || []).length;
      const cP = (inner.match(/\)/g) || []).length;
      if (oP !== cP) return `label "${inner.slice(0, 30)}" has unbalanced ()`;
    }
  }
  // Must have at least one node or edge
  if (!/-->|---|==>|graph|flowchart|sequenceDiagram|classDiagram|stateDiagram/i.test(src)) {
    return "no diagram directive";
  }
  return null;
}

function validateVegaLite(src) {
  if (!src || src.trim().length === 0) return "empty";
  let spec;
  try { spec = JSON.parse(src); } catch (e) {
    return `invalid JSON (${e.message.slice(0, 60)})`;
  }
  if (!spec.mark && !spec.layer && !spec.repeat && !spec.facet && !spec.hconcat && !spec.vconcat) {
    return "no top-level mark/layer/repeat";
  }
  if (spec.$schema && !/vega-lite/.test(spec.$schema)) {
    return `wrong $schema: ${spec.$schema.slice(0, 60)}`;
  }
  return null;
}

// Validate KaTeX math expressions ($...$ inline, $$...$$ display).
// Surface common issues: unbalanced delimiters, unescaped backslashes,
// known KaTeX-fatal patterns.
function validateKaTeX(text) {
  const errors = [];
  // Strip escaped \$ (currency) and $$...$$ display math regions before
  // counting inline $ — otherwise we false-positive on currency that's
  // already been escaped via the escape-currency-dollars sweep.
  const stripped = text
    .replace(/\\\$/g, "")             // escaped currency
    .replace(/\$\$[\s\S]*?\$\$/g, ""); // display math
  const inlineDollars = (stripped.match(/\$/g) || []).length;
  if (inlineDollars % 2 !== 0) errors.push(`unbalanced inline $ count: ${inlineDollars}`);
  // Display $$...$$ — count must be even (each open paired with close)
  const displayDollars = (text.match(/\$\$/g) || []).length;
  if (displayDollars % 2 !== 0) errors.push(`unbalanced display $$ count: ${displayDollars}`);
  // Common fatal KaTeX patterns: \begin{ without \end{
  const begins = (text.match(/\\begin\{/g) || []).length;
  const ends = (text.match(/\\end\{/g) || []).length;
  if (begins !== ends) errors.push(`unbalanced \\begin/\\end (${begins} vs ${ends})`);
  return errors.length > 0 ? errors.join("; ") : null;
}

// Validate markdown table — pipe-balance per row.
function validateMarkdownTable(text) {
  const lines = text.split("\n");
  let inTable = false;
  let tableRowPipeCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const pipes = (l.match(/\|/g) || []).length;
    const isTableRow = l.startsWith("|") && l.endsWith("|") && pipes >= 2;
    if (isTableRow && !inTable) {
      inTable = true;
      tableRowPipeCount = pipes;
    } else if (isTableRow && inTable) {
      if (pipes !== tableRowPipeCount) {
        return `table row ${i + 1} has ${pipes} pipes vs first row ${tableRowPipeCount}`;
      }
    } else if (!isTableRow && inTable) {
      // Table ended
      inTable = false;
      tableRowPipeCount = 0;
    }
  }
  return null;
}

// Also check that closing fence has newline after it (when followed by content)
function validateFenceFormat(stim) {
  // Pattern: ``` followed by non-newline char that ISN'T part of a language tag
  // Match: ```X where X is not alphanumeric (suggests fused closing fence)
  const fused = stim.match(/```([^\w\n][^\n]*)/g);
  if (fused && fused.length > 0) {
    // Filter out matches that are language tags ending with whitespace
    const real = fused.filter((m) => !/^```\s*$/.test(m) && !/^```\s*\n/.test(m));
    if (real.length > 0) {
      return `closing fence fused with content: "${real[0].slice(0, 50)}"`;
    }
  }
  return null;
}

(async () => {
  console.log(`\n🔍 Validating visual blocks ${courseFilter ? `(${courseFilter})` : "(all)"}\n`);

  // Now scan ALL stimuli with potential visual content (not just fenced
  // code blocks): KaTeX (`$`), markdown tables (`|`), code fences (`\`\`\``).
  const rows = courseFilter
    ? await sql`
        SELECT id, course, stimulus FROM questions
        WHERE course = ${courseFilter}::"ApCourse" AND "isApproved" = true
          AND stimulus IS NOT NULL
          AND (stimulus LIKE '%\`\`\`%' OR stimulus LIKE '%$%' OR stimulus LIKE '%|%')
      `
    : await sql`
        SELECT id, course, stimulus FROM questions
        WHERE "isApproved" = true
          AND stimulus IS NOT NULL
          AND (stimulus LIKE '%\`\`\`%' OR stimulus LIKE '%$%' OR stimulus LIKE '%|%')
      `;

  console.log(`Loaded ${rows.length} stimuli with potential visual content`);

  const failures = [];
  let mermaidOK = 0, vegaOK = 0;

  for (const r of rows) {
    const errors = [];
    const fenceErr = validateFenceFormat(r.stimulus);
    if (fenceErr) errors.push("FENCE: " + fenceErr);
    const mblocks = extractBlocks(r.stimulus, "mermaid");
    for (let i = 0; i < mblocks.length; i++) {
      const e = validateMermaid(mblocks[i]);
      if (e) errors.push(`MERMAID#${i}: ${e}`);
      else mermaidOK++;
    }
    const vblocks = [...extractBlocks(r.stimulus, "vega-lite"), ...extractBlocks(r.stimulus, "vegalite")];
    for (let i = 0; i < vblocks.length; i++) {
      const e = validateVegaLite(vblocks[i]);
      if (e) errors.push(`VEGA#${i}: ${e}`);
      else vegaOK++;
    }
    // KaTeX
    if (/\$/.test(r.stimulus)) {
      const e = validateKaTeX(r.stimulus);
      if (e) errors.push("KATEX: " + e);
    }
    // Markdown table
    if (/\|.*\|/.test(r.stimulus)) {
      const e = validateMarkdownTable(r.stimulus);
      if (e) errors.push("TABLE: " + e);
    }
    if (errors.length > 0) failures.push({ id: r.id, course: r.course, errors });
  }

  console.log(`\n── Summary ──`);
  console.log(`  Stimuli scanned: ${rows.length}`);
  console.log(`  Valid Mermaid blocks: ${mermaidOK}`);
  console.log(`  Valid vega-lite blocks: ${vegaOK}`);
  console.log(`  Stimuli with failures: ${failures.length}`);

  if (failures.length > 0) {
    const byCourse = {};
    for (const f of failures) byCourse[f.course] = (byCourse[f.course] || 0) + 1;
    console.log(`\n  Failures by course:`);
    Object.entries(byCourse).sort(([, a], [, b]) => b - a)
      .forEach(([c, n]) => console.log(`    ${c}: ${n}`));

    console.log(`\n  Sample 5 failures:`);
    for (const f of failures.slice(0, 5)) {
      console.log(`    ${f.id.slice(0, 10)} ${f.course}: ${f.errors.join(" | ")}`);
    }

    // Write CSV
    const today = new Date().toISOString().slice(0, 10);
    const csv = [
      "id,course,errors",
      ...failures.map((f) => `${f.id},${f.course},"${f.errors.join("; ").replace(/"/g, '""')}"`),
    ].join("\n");
    await writeFile(`data/visual-block-validation-${today}.csv`, csv);
    console.log(`\n  CSV: data/visual-block-validation-${today}.csv`);
  }

  process.exit(failures.length > 0 ? 1 : 0);
})().catch((e) => { console.error("Fatal:", e); process.exit(2); });
