#!/usr/bin/env node
/**
 * Re-audit all 14 AP courses against CB rubric — measures lift after
 * Beta 8.8 work (real-images, backfill, scrub, defect-fix, reclassify,
 * DBQ-boost, stimulus-pass, math-judge).
 *
 * Compare against baseline `docs/AP_NON_WH_CB_AUDIT_2026-04-27.md` table.
 *
 * Outputs JSON + markdown table for trust-readiness review.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const AP_COURSES = [
  "AP_BIOLOGY", "AP_CHEMISTRY", "AP_PHYSICS_1",
  "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_PRECALCULUS",
  "AP_STATISTICS",
  "AP_PSYCHOLOGY", "AP_HUMAN_GEOGRAPHY", "AP_ENVIRONMENTAL_SCIENCE",
  "AP_US_GOVERNMENT", "AP_US_HISTORY", "AP_WORLD_HISTORY",
  "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

const BASELINE = {
  AP_BIOLOGY:                       { mcq: 484, emptyExpl: 19,  noStim: 78,  oneSent: 6,  noImg: 484 },
  AP_CHEMISTRY:                     { mcq: 500, emptyExpl: 8,   noStim: 29,  oneSent: 2,  noImg: 500 },
  AP_PHYSICS_1:                     { mcq: 502, emptyExpl: 0,   noStim: 28,  oneSent: 0,  noImg: 502 },
  AP_CALCULUS_AB:                   { mcq: 499, emptyExpl: 7,   noStim: 57,  oneSent: 48, noImg: 499 },
  AP_CALCULUS_BC:                   { mcq: 495, emptyExpl: 2,   noStim: 94,  oneSent: 29, noImg: 495 },
  AP_PRECALCULUS:                   { mcq: 467, emptyExpl: 6,   noStim: 107, oneSent: 0,  noImg: 467 },
  AP_STATISTICS:                    { mcq: 490, emptyExpl: 4,   noStim: 4,   oneSent: 1,  noImg: 490 },
  AP_PSYCHOLOGY:                    { mcq: 499, emptyExpl: 3,   noStim: 220, oneSent: 0,  noImg: 499 },
  AP_HUMAN_GEOGRAPHY:               { mcq: 500, emptyExpl: 354, noStim: 500, oneSent: 0,  noImg: 500 },
  AP_ENVIRONMENTAL_SCIENCE:         { mcq: 485, emptyExpl: 231, noStim: 483, oneSent: 1,  noImg: 485 },
  AP_US_GOVERNMENT:                 { mcq: 479, emptyExpl: 195, noStim: 479, oneSent: 5,  noImg: 479 },
  AP_US_HISTORY:                    { mcq: 499, emptyExpl: 154, noStim: 267, oneSent: 18, noImg: 499 },
  AP_WORLD_HISTORY:                 { mcq: 500, emptyExpl: 0,   noStim: 0,   oneSent: 0,  noImg: 500 },
  AP_COMPUTER_SCIENCE_PRINCIPLES:   { mcq: 500, emptyExpl: 40,  noStim: 48,  oneSent: 15, noImg: 500 },
};

const rows = [];

for (const course of AP_COURSES) {
  const [stats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE "questionType" = 'MCQ') AS mcq_count,
      COUNT(*) FILTER (WHERE "questionType" = 'MCQ' AND (explanation IS NULL OR LENGTH(explanation) < 20)) AS empty_expl,
      COUNT(*) FILTER (WHERE "questionType" = 'MCQ' AND (stimulus IS NULL OR LENGTH(stimulus) < 20)) AS no_stim,
      COUNT(*) FILTER (WHERE "questionType" = 'MCQ' AND explanation IS NOT NULL AND LENGTH(explanation) > 20 AND LENGTH(explanation) < 80) AS one_sent,
      COUNT(*) FILTER (WHERE "questionType" = 'MCQ' AND "stimulusImageUrl" IS NULL) AS no_img,
      AVG(LENGTH(explanation)) FILTER (WHERE "questionType" = 'MCQ' AND explanation IS NOT NULL) AS avg_expl,
      AVG(LENGTH(stimulus)) FILTER (WHERE "questionType" = 'MCQ' AND stimulus IS NOT NULL) AS avg_stim
    FROM questions
    WHERE course = ${course}::"ApCourse"
      AND "isApproved" = true
  `;
  const frqStats = await sql`
    SELECT "questionType"::text as qt, COUNT(*) as n
    FROM questions
    WHERE course = ${course}::"ApCourse"
      AND "isApproved" = true
      AND "questionType" IN ('FRQ', 'DBQ', 'LEQ', 'SAQ', 'CODING', 'NUMERICAL', 'DATA_ANALYSIS')
    GROUP BY "questionType"
    ORDER BY n DESC
  `;
  const frqSummary = frqStats.map(r => `${r.qt}:${r.n}`).join(",") || "—";

  const cur = {
    mcq: Number(stats.mcq_count),
    emptyExpl: Number(stats.empty_expl),
    noStim: Number(stats.no_stim),
    oneSent: Number(stats.one_sent),
    noImg: Number(stats.no_img),
    avgExpl: Math.round(Number(stats.avg_expl) || 0),
    avgStim: Math.round(Number(stats.avg_stim) || 0),
    frq: frqSummary,
  };
  const base = BASELINE[course];
  const lift = {
    emptyExplDelta: base.emptyExpl - cur.emptyExpl,
    noStimDelta: base.noStim - cur.noStim,
    oneSentDelta: base.oneSent - cur.oneSent,
    noImgDelta: base.noImg - cur.noImg,
  };

  rows.push({ course, baseline: base, current: cur, lift });
}

// Output markdown table
console.log(`# AP Re-Audit — ${new Date().toISOString().slice(0, 10)} (post Beta 8.8 sprint)\n`);
console.log(`Comparison against baseline \`docs/AP_NON_WH_CB_AUDIT_2026-04-27.md\`.\n`);
console.log("## Lift summary (Δ = baseline − current; positive = improved)\n");
console.log("| Course | MCQ | EmptyExpl Δ | NoStim Δ | OneSent Δ | NoImg Δ | Avg Expl | Avg Stim |");
console.log("|---|---:|---:|---:|---:|---:|---:|---:|");
for (const r of rows) {
  const formatDelta = (v, base) => {
    const sign = v > 0 ? "−" : v < 0 ? "+" : "";
    const out = base > 0 ? Math.abs(v) : 0;
    return `${sign}${out} (was ${base})`;
  };
  console.log(`| ${r.course.replace("AP_", "")} | ${r.current.mcq} | ${formatDelta(r.lift.emptyExplDelta, r.baseline.emptyExpl)} | ${formatDelta(r.lift.noStimDelta, r.baseline.noStim)} | ${formatDelta(r.lift.oneSentDelta, r.baseline.oneSent)} | ${formatDelta(r.lift.noImgDelta, r.baseline.noImg)} | ${r.current.avgExpl} | ${r.current.avgStim} |`);
}

console.log("\n## Current state (raw)\n");
console.log("| Course | MCQ | Empty Expl | No Stim | No Img | FRQ types |");
console.log("|---|---:|---:|---:|---:|---|");
for (const r of rows) {
  console.log(`| ${r.course.replace("AP_", "")} | ${r.current.mcq} | ${r.current.emptyExpl} | ${r.current.noStim} | ${r.current.noImg} | ${r.current.frq} |`);
}

// Trust gates
console.log("\n## Trust gates (per CB-fidelity standards)\n");
const gates = [];
for (const r of rows) {
  const c = r.current;
  const courseName = r.course.replace("AP_", "");
  const issues = [];
  if (c.emptyExpl > 5) issues.push(`${c.emptyExpl} empty explanations`);
  if (c.noStim > c.mcq * 0.5) issues.push(`${Math.round(c.noStim / c.mcq * 100)}% no-stimulus`);
  if (c.noImg > c.mcq * 0.95 && ["BIOLOGY","CHEMISTRY","PHYSICS_1","HUMAN_GEOGRAPHY","ENVIRONMENTAL_SCIENCE","PSYCHOLOGY"].includes(courseName)) {
    issues.push(`${Math.round(c.noImg / c.mcq * 100)}% missing visuals`);
  }
  if (c.oneSent > 10) issues.push(`${c.oneSent} one-sentence explanations`);
  const status = issues.length === 0 ? "✅ PASS" : `⚠️ ${issues.join("; ")}`;
  gates.push({ course: courseName, status, issues });
  console.log(`- **${courseName}**: ${status}`);
}

const passing = gates.filter(g => g.issues.length === 0).length;
console.log(`\n**${passing}/14 AP courses** pass all trust gates.`);

// JSON output
import("fs").then(fs => {
  fs.writeFileSync(
    `data/reaudit-2026-04-27.json`,
    JSON.stringify({ generated: new Date().toISOString(), rows, gates }, null, 2),
  );
  console.log("\nJSON: data/reaudit-2026-04-27.json");
});
