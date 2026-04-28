// All-AP curriculum-drift audit. For each AP course:
//   1. Counts approved questions per unit
//   2. Cross-references against KNOWN_DEPRECATED_UNITS (CB redesign retirements)
//   3. Flags Psychology + Physics 1 specifically (2024-25 redesigns)
//   4. Surfaces high-volume off-framework keywords (e.g. circuits in Physics 1)
//
// Triggered by Luke Hagood's feedback ("Circuits/charges are not in the
// curriculum anymore") — answer is YES, and we want to know what else.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Known curriculum retirements per College Board redesigns through 2026-04.
// Each entry: { course, unitOrTheme, reason, since }
const KNOWN_DEPRECATIONS = [
  // AP Physics 1 — 2024-25 redesign moved E&M topics to AP Physics 2
  {
    course: "AP_PHYSICS_1",
    unitMatch: ["PHY1_8_ELECTRIC_CHARGE_AND_FORCE", "PHY1_9_DC_CIRCUITS"],
    reason: "2024-25 redesign: Charge/Circuits moved to AP Physics 2",
    severity: "BLOCKER",
  },
  {
    course: "AP_PHYSICS_1",
    unitMatch: ["PHY1_10_WAVES_AND_SOUND"],
    reason: "2024-25 redesign: Mechanical Waves & Sound moved to AP Physics 2",
    severity: "BLOCKER",
  },
  // AP Psychology — 2024-25 redesign consolidated 9 units → 5 units
  // Old units (Sensation/Perception split, States of Consciousness standalone, etc.)
  // were merged or partially removed. Need to compare DB unit list vs new 5-unit framework.
  {
    course: "AP_PSYCHOLOGY",
    keywordMatch: [/states of consciousness/i, /sensation and perception/i, /testing and individual differences/i],
    reason: "2024-25 redesign: 9-unit framework collapsed to 5 units",
    severity: "REVIEW",
  },
  // AP World History: Modern — content limited to 1200 CE+ since 2019
  {
    course: "AP_WORLD_HISTORY",
    keywordMatch: [/Mesopotamia/i, /ancient Egypt/i, /Roman Empire fall|fall of Rome/i, /Greek polis/i, /Hellenistic/i, /Persian Empire/i, /Han Dynasty(?!.* trade)/i, /Bronze Age/i],
    reason: "Course retitled 'AP World History: Modern' (2019). Content limited to 1200 CE → present.",
    severity: "REVIEW",
  },
  // AP US History — Period 1 starts at 1491 (post-Columbus contact). Pre-Columbian-only Qs are skewed.
  {
    course: "AP_US_HISTORY",
    keywordMatch: [/before 1491|pre-Columbian/i],
    reason: "APUSH framework starts at 1491.",
    severity: "REVIEW",
  },
];

// Pull current unit list per AP course from the DB (distinct unit values).
const APCourses = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
  "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
  "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

const report = {};

for (const course of APCourses) {
  const units = await sql`
    SELECT unit::text AS unit, COUNT(*)::int AS approved
    FROM questions
    WHERE course = ${course}::"ApCourse" AND "isApproved" = true
    GROUP BY unit::text ORDER BY approved DESC
  `;
  report[course] = { units, flags: [] };

  // Apply unitMatch checks
  for (const dep of KNOWN_DEPRECATIONS.filter(d => d.course === course && d.unitMatch)) {
    for (const u of dep.unitMatch) {
      const hit = units.find(x => x.unit === u);
      if (hit && hit.approved > 0) {
        report[course].flags.push({
          severity: dep.severity, unit: u, count: hit.approved, reason: dep.reason,
        });
      }
    }
  }

  // Apply keyword checks (count questions with off-syllabus keywords)
  for (const dep of KNOWN_DEPRECATIONS.filter(d => d.course === course && d.keywordMatch)) {
    for (const re of dep.keywordMatch) {
      const pattern = re.source;
      const flag = re.flags.includes("i") ? "i" : "";
      const r = await sql`
        SELECT COUNT(*)::int AS n
        FROM questions
        WHERE course = ${course}::"ApCourse"
          AND "isApproved" = true
          AND ("questionText" ~* ${pattern} OR stimulus ~* ${pattern})
      `;
      if (r[0].n > 0) {
        report[course].flags.push({
          severity: dep.severity,
          keyword: re.toString(),
          count: r[0].n,
          reason: dep.reason,
        });
      }
    }
  }
}

console.log("# AP Curriculum-Drift Audit — 2026-04-29\n");

let totalBlockers = 0, totalReviews = 0;
for (const course of APCourses) {
  const { units, flags } = report[course];
  const total = units.reduce((s, u) => s + u.approved, 0);
  const blockers = flags.filter(f => f.severity === "BLOCKER");
  const reviews = flags.filter(f => f.severity === "REVIEW");
  totalBlockers += blockers.reduce((s, f) => s + f.count, 0);
  totalReviews += reviews.reduce((s, f) => s + f.count, 0);

  const status = blockers.length ? "🚨" : reviews.length ? "⚠️" : "✓";
  console.log(`## ${status} ${course} (n=${total})`);

  if (flags.length === 0) {
    console.log(`  No drift detected.`);
  } else {
    for (const f of flags) {
      const tag = f.unit ? `unit=${f.unit}` : `keyword=${f.keyword}`;
      console.log(`  [${f.severity}] ${tag} → ${f.count} questions`);
      console.log(`    ${f.reason}`);
    }
  }
  console.log("");
}

console.log(`\n## TOTALS`);
console.log(`  BLOCKER (off-syllabus): ${totalBlockers}`);
console.log(`  REVIEW (potential drift): ${totalReviews}`);
