/**
 * Backfill: strip leading "A) ", "B) ", "(A) ", "A. ", "A: " etc from
 * every option in questions.options.
 *
 * Audit (2026-05-19): 12,911 approved questions affected across 32 courses.
 * Zero mismatch cases (correctAnswer letter always aligns with option position).
 * Safe transform: regex strip leading letter-prefix; correctAnswer unchanged.
 *
 * Pattern matched: ^\s*\(?[A-E]\)?[.):]\s*  (same as cleanOptionText in src/lib/options.ts)
 *
 * Run:
 *   node scripts/_backfill-doubled-prefix.mjs --dry
 *   node scripts/_backfill-doubled-prefix.mjs
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

const PREFIX = /^\s*\(?[A-E]\)?[.):]\s*/;
function strip(s) {
  return typeof s === "string" ? s.replace(PREFIX, "") : s;
}

// Pull ALL questions (approved + unapproved — fix everywhere for consistency)
const all = await sql`SELECT id, options FROM questions`;
console.log(`Loaded ${all.length} total questions.`);

const candidates = [];
for (const q of all) {
  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length === 0) continue;
  if (!opts.every(o => typeof o === "string" && PREFIX.test(o))) continue;
  const stripped = opts.map(strip);
  if (stripped.every((s, i) => s === opts[i])) continue;
  candidates.push({ id: q.id, before: opts, after: stripped });
}
console.log(`Candidates to update: ${candidates.length}`);
if (candidates.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

console.log("\nSample 3 transforms:");
for (const c of candidates.slice(0, 3)) {
  console.log(`  ${c.id}:`);
  console.log(`    before: ${JSON.stringify(c.before)}`);
  console.log(`    after:  ${JSON.stringify(c.after)}`);
}

if (DRY) {
  console.log("\n[dry] No DB writes performed.");
  process.exit(0);
}

let ok = 0, fail = 0;
const start = Date.now();
for (const c of candidates) {
  try {
    await sql`UPDATE questions SET options = ${JSON.stringify(c.after)}::jsonb WHERE id = ${c.id}`;
    ok++;
    if (ok % 250 === 0) {
      const secs = Math.round((Date.now() - start) / 1000);
      console.log(`  [${ok}/${candidates.length}] ok=${ok} fail=${fail} t=${secs}s`);
    }
  } catch (e) {
    fail++;
    console.error(`  fail ${c.id}: ${e.message}`);
  }
}
console.log(`\nDone. ok=${ok} fail=${fail}`);
