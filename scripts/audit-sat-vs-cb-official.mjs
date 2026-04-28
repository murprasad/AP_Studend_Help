// SAT Phase 2 audit — compare our SAT_MATH and SAT_READING_WRITING DB against
// the OFFICIAL College Board Digital SAT spec at
// satsuite.collegeboard.org/media/pdf/digital-sat-test-spec-overview.pdf
// (saved locally at data/official/SAT/sat-spec.json).
//
// Per user direction: "we use our rubric which is incorrect" — the rubric of
// truth is the official CB spec. This audit reports gaps that block claiming
// CB fidelity.
import "dotenv/config";
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const spec = JSON.parse(fs.readFileSync("data/official/SAT/sat-spec.json", "utf8"));

console.log("# SAT CB-fidelity audit — 2026-04-27");
console.log("Source: " + spec._source);
console.log("Retrieved: " + spec._retrievedOn);

// ─────────────────────────────────────────────────────────────────────
// SAT_READING_WRITING audit
// ─────────────────────────────────────────────────────────────────────
const RW = spec.sections.READING_WRITING;
console.log(`\n## SAT_READING_WRITING — official: ${RW.totalQuestions} Qs / ${RW.totalMinutes} min`);

const rwTotal = await sql`
  SELECT COUNT(*)::int AS n FROM questions
  WHERE course = 'SAT_READING_WRITING'::"ApCourse" AND "isApproved" = true
`;
const rwMcq = await sql`
  SELECT COUNT(*)::int AS n FROM questions
  WHERE course = 'SAT_READING_WRITING'::"ApCourse" AND "isApproved" = true AND "questionType" = 'MCQ'
`;
const rwWithStim = await sql`
  SELECT COUNT(*)::int AS n FROM questions
  WHERE course = 'SAT_READING_WRITING'::"ApCourse"
    AND "isApproved" = true AND stimulus IS NOT NULL AND LENGTH(stimulus) > 50
`;
const stimPct = ((rwWithStim[0].n / rwMcq[0].n) * 100).toFixed(1);

console.log(`Bank: ${rwTotal[0].n} approved (${rwMcq[0].n} MCQ)`);
console.log(`With stimulus (>50 chars): ${rwWithStim[0].n} (${stimPct}%)`);
console.log(`**CRITICAL:** Every R&W question requires a passage. Coverage: ${stimPct}% — gap = ${(100 - parseFloat(stimPct)).toFixed(1)}%`);

// Check distribution by content domain (we use Unit field for this)
console.log(`\n### Content domain coverage (per CB: 4 domains)`);
const rwUnits = await sql`
  SELECT COALESCE(unit::text, 'NULL') AS unit, COUNT(*)::int AS n
  FROM questions
  WHERE course = 'SAT_READING_WRITING'::"ApCourse" AND "isApproved" = true
  GROUP BY unit ORDER BY n DESC
`;
console.log(`Units in DB:`);
for (const r of rwUnits) console.log(`  ${r.unit}: ${r.n}`);
console.log(`\nOfficial CB R&W content domains:`);
for (const d of RW.contentDomains) {
  console.log(`  ${d.name} (${d.percent}%, ${d.operationalQs} Qs/exam): ${d.skills.join(", ")}`);
}

// Question type
const rwTypes = await sql`
  SELECT "questionType"::text AS qt, COUNT(*)::int AS n FROM questions
  WHERE course = 'SAT_READING_WRITING'::"ApCourse" AND "isApproved" = true
  GROUP BY "questionType" ORDER BY n DESC
`;
console.log(`\n### Question types in our DB:`);
for (const t of rwTypes) console.log(`  ${t.qt}: ${t.n}`);
console.log(`Official: 100% MCQ (4-option) — matches our DB shape if all MCQ.`);

// ─────────────────────────────────────────────────────────────────────
// SAT_MATH audit
// ─────────────────────────────────────────────────────────────────────
const M = spec.sections.MATH;
console.log(`\n## SAT_MATH — official: ${M.totalQuestions} Qs / ${M.totalMinutes} min`);

const mTotal = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='SAT_MATH'::"ApCourse" AND "isApproved"=true`;
const mMcq = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='SAT_MATH'::"ApCourse" AND "isApproved"=true AND "questionType"='MCQ'`;
const mWithStim = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='SAT_MATH'::"ApCourse" AND "isApproved"=true AND stimulus IS NOT NULL AND LENGTH(stimulus)>20`;
const mStimPct = ((mWithStim[0].n / mMcq[0].n) * 100).toFixed(1);

console.log(`Bank: ${mTotal[0].n} approved (${mMcq[0].n} MCQ)`);
console.log(`With stimulus: ${mWithStim[0].n} (${mStimPct}%)`);
console.log(`Note: Math stimulus optional (in-context word problems vs pure equation).`);

console.log(`\n### Content domain coverage (per CB: 4 domains)`);
const mUnits = await sql`
  SELECT COALESCE(unit::text, 'NULL') AS unit, COUNT(*)::int AS n
  FROM questions
  WHERE course = 'SAT_MATH'::"ApCourse" AND "isApproved" = true
  GROUP BY unit ORDER BY n DESC
`;
console.log(`Units in DB:`);
for (const r of mUnits) console.log(`  ${r.unit}: ${r.n}`);
console.log(`\nOfficial CB Math content domains:`);
for (const d of M.contentDomains) {
  console.log(`  ${d.name} (${d.percent}%, ${d.operationalQs} Qs/exam): ${d.skills.join(", ")}`);
}

// Question type — CB requires 75% MCQ + 25% SPR
const mTypes = await sql`
  SELECT "questionType"::text AS qt, COUNT(*)::int AS n FROM questions
  WHERE course = 'SAT_MATH'::"ApCourse" AND "isApproved" = true
  GROUP BY "questionType" ORDER BY n DESC
`;
console.log(`\n### Question types in our DB:`);
for (const t of mTypes) console.log(`  ${t.qt}: ${t.n}`);
const mFrqPct = mTotal[0].n > 0 ? (((mTotal[0].n - mMcq[0].n) / mTotal[0].n) * 100).toFixed(1) : "0";
console.log(`SPR (Student-Produced Response) coverage: ${mFrqPct}% — official requires 25%.`);
console.log(`**GAP:** if SPR < 20%, we don't faithfully simulate the real test.`);

// ─────────────────────────────────────────────────────────────────────
// Summary blockers
// ─────────────────────────────────────────────────────────────────────
console.log(`\n## Summary — blockers before SAT can claim CB fidelity:`);
const blockers = [];
if (parseFloat(stimPct) < 95) {
  blockers.push(`SAT_R&W stimulus coverage: ${stimPct}% (need ~100% — every R&W Q needs a passage)`);
}
if (parseFloat(mFrqPct) < 20) {
  blockers.push(`SAT_MATH SPR coverage: ${mFrqPct}% (need ~25% — student-produced response is 11/44 Qs on real exam)`);
}
if (rwUnits.find(u => u.unit === "NULL")) blockers.push(`SAT_R&W: ${rwUnits.find(u=>u.unit==='NULL').n} Qs have NULL unit (uncategorized)`);
if (mUnits.find(u => u.unit === "NULL")) blockers.push(`SAT_MATH: ${mUnits.find(u=>u.unit==='NULL').n} Qs have NULL unit (uncategorized)`);

if (blockers.length === 0) {
  console.log(`✅ NO BLOCKERS — bank meets CB fidelity bar.`);
} else {
  console.log(`❌ ${blockers.length} blockers:`);
  for (const b of blockers) console.log(`   - ${b}`);
}
