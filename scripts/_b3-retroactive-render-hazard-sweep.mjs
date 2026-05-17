/**
 * B3 retroactive render-hazard sweep (StudentNest variant).
 *
 * Scans approved AP/SAT/ACT/PSAT questions for render hazards:
 *   - 2+ unescaped currency $ → renders as LaTeX math
 *   - Phantom stimulus references with empty stimulus field
 *
 * Two-stage: --dry-run (default) | --apply (200-floor enforced).
 */

import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const APPLY = process.argv.includes("--apply");

const PHANTOM_STIMULUS_PATTERNS = [
  /\b(?:the|a|an)\s+(?:above|following|below|attached)\s+(?:figure|graph|chart|table|diagram|image|profile|passage|map|cartoon|plot)\b/i,
  /\b(?:as|is|are)\s+shown\s+(?:in\s+the\s+)?(?:figure|graph|chart|table|diagram|image|above|below)\b/i,
  /\b(?:figure|graph|chart|table|diagram|image|passage|map)\s+(?:above|below|shown|attached)\b/i,
  /\benergy\s+(?:profile|diagram)\s+(?:is\s+shown|for\s+this|below|above)\b/i,
  /\bLewis\s+structure\s+(?:shown|below|above|for)\b/i,
  /\b(?:reaction|free.body)\s+diagram\s+(?:shown|below|above)\b/i,
  /\brefer\s+to\s+the\s+(?:figure|graph|chart|table|diagram|image|passage)\b/i,
];

function validateRenderHazards(questionText, stimulus) {
  if (!questionText) return null;
  const allUnescaped = questionText.match(/(?<!\\)\$/g) ?? [];
  if (allUnescaped.length >= 2) {
    const currencyDollars = questionText.match(/(?<!\\)\$\d/g) ?? [];
    const hasMathMarkers = /(?<!\\)\$[A-Za-z\\{]/.test(questionText) ||
      /\\(?:frac|sqrt|sum|int|lim|cdot|times|div|leq|geq|neq|alpha|beta|gamma|theta|pi|infty)/.test(questionText);
    if (currencyDollars.length >= 2 && !hasMathMarkers) {
      return `currency-as-latex-${currencyDollars.length}`;
    }
  }
  for (const re of PHANTOM_STIMULUS_PATTERNS) {
    if (re.test(questionText)) {
      const stimTrimmed = (stimulus ?? "").trim();
      if (stimTrimmed.length < 20) {
        return `phantom-stimulus`;
      }
    }
  }
  return null;
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus
  FROM questions
  WHERE "isApproved" = true
`;
console.log(`Loaded ${rows.length} approved questions for B3 scan. Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

const hazards = [];
for (const r of rows) {
  const h = validateRenderHazards(r.questionText, r.stimulus);
  if (h) hazards.push({ id: r.id, course: r.course, gate: h, preview: r.questionText.slice(0, 80) });
}

const byGate = {};
const byCourse = {};
for (const h of hazards) {
  byGate[h.gate] = (byGate[h.gate] ?? 0) + 1;
  byCourse[h.course] = (byCourse[h.course] ?? 0) + 1;
}
console.log(`Render hazards found: ${hazards.length}\n`);
console.log("By gate:");
for (const [g, n] of Object.entries(byGate).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${g.padEnd(28)} ${n}`);
}
console.log("\nBy course (top 15):");
for (const [c, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${c.padEnd(36)} ${n}`);
}

console.log("\nFirst 10 examples:");
for (const h of hazards.slice(0, 10)) {
  console.log(`  ${h.id.slice(0, 12)} ${h.gate.padEnd(22)} ${h.course.padEnd(30)} "${h.preview}..."`);
}

if (!APPLY) {
  console.log("\nDRY-RUN. Re-run with --apply to unapprove (respects 200-floor).");
  process.exit(0);
}

const safeIds = [];
const blocked = [];
for (const [course, count] of Object.entries(byCourse)) {
  const cur = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course::text = ${course} AND "isApproved" = true`;
  const after = cur[0].n - count;
  if (after >= 200) {
    safeIds.push(...hazards.filter(h => h.course === course).map(h => h.id));
    console.log(`  ${course.padEnd(36)}: ${cur[0].n} → ${after} ✓`);
  } else {
    blocked.push({ course, count, after });
    console.log(`  ${course.padEnd(36)}: ${cur[0].n} → ${after} BLOCKED (200-floor)`);
  }
}

console.log(`\nUnapproving ${safeIds.length} render-hazard questions (200-floor enforced)...`);
const B = 500;
for (let i = 0; i < safeIds.length; i += B) {
  const batch = safeIds.slice(i, i + B);
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${batch})`;
  console.log(`  Batch ${Math.floor(i / B) + 1}: ${batch.length}`);
}
console.log(`\n✓ Unapproved ${safeIds.length} questions.`);
console.log(`✓ Kept ${blocked.length} courses' offenders (would drop below 200-floor).`);
