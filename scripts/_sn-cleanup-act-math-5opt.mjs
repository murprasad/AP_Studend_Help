/**
 * SN ACT_MATH cleanup: trim the 20 legacy 5-option questions back to 4-option.
 *
 * ACT redesigned 2025-2026 — Math section is now 4-option universally
 * (was 5-option in legacy ACT). Bank has 20 stragglers from before the
 * redesign. Per audit: 20/334 Qs are 5-option (6.0%).
 *
 * Safety: correctAnswer is A-D for 19 of 20 (verified separately). If
 * correctAnswer == "E", we UNAPPROVE instead of trimming so we don't
 * lose correctness.
 *
 * Also: 1 Q in SAT_MATH contains "calculus" (off-scope per SAT spec) —
 * unapprove that too.
 *
 * Run:
 *   node scripts/_sn-cleanup-act-math-5opt.mjs --dry
 *   node scripts/_sn-cleanup-act-math-5opt.mjs
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  if (a === "--dry") return ["dry", true];
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? true];
}));
const DRY = !!args.dry;

const sql = neon((process.env.DATABASE_URL || "").replace(/^["']|["']$/g, ""));

// Find 5-option ACT_MATH Qs
const actMath = await sql`SELECT id, options, "correctAnswer" FROM questions WHERE course = 'ACT_MATH' AND "isApproved" = true`;
const fiveOpt = actMath.filter(q => Array.isArray(q.options) && q.options.length === 5);
console.log(`ACT_MATH 5-opt Qs: ${fiveOpt.length}`);

let trim = 0, unapprove = 0;
for (const q of fiveOpt) {
  const ca = String(q.correctAnswer || "").trim().toUpperCase();
  if (ca === "E") {
    console.log(`  unapprove ${q.id} (correctAnswer=E, can't trim)`);
    if (!DRY) await sql`UPDATE questions SET "isApproved" = false WHERE id = ${q.id}`;
    unapprove++;
  } else {
    console.log(`  trim ${q.id} (correctAnswer=${ca})`);
    if (!DRY) await sql`UPDATE questions SET options = ${JSON.stringify(q.options.slice(0, 4))}::jsonb WHERE id = ${q.id}`;
    trim++;
  }
}

// SAT_MATH off-scope: contains "calculus", "derivative", "integral", "limit" keyword
const satMath = await sql`SELECT id, "questionText", options, explanation FROM questions WHERE course = 'SAT_MATH' AND "isApproved" = true`;
const offScopeKeywords = ["calculus", "derivative", "integral", "differential equation", "limit definition"];
let satOff = 0;
for (const q of satMath) {
  const blob = `${q.questionText || ""} ${(q.options || []).join(" ")} ${q.explanation || ""}`.toLowerCase();
  const hit = offScopeKeywords.find(k => blob.includes(k));
  if (!hit) continue;
  console.log(`  SAT_MATH off-scope ${q.id} (keyword: ${hit})`);
  console.log(`    "${(q.questionText || "").slice(0, 100)}…"`);
  if (!DRY) await sql`UPDATE questions SET "isApproved" = false WHERE id = ${q.id}`;
  satOff++;
}

console.log(`\nSummary: ACT_MATH trimmed=${trim}, unapproved=${unapprove}; SAT_MATH off-scope unapproved=${satOff}`);
if (DRY) console.log("[dry] No writes performed.");
