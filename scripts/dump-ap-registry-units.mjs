// Dump every AP course's units (key + name) from COURSE_REGISTRY plus DB
// distinct unit values. Output is one big block usable by the side-by-side
// CB-syllabus comparison.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const sql = neon(process.env.DATABASE_URL);

// Parse unit names + keys directly from courses.ts source. Each course block
// has a `units: { KEY: { name: "Unit X: Foo", ... }, ... }` shape.
const src = fs.readFileSync("src/lib/courses.ts", "utf8");
const COURSE_REGISTRY = {};
const courseRe = /^\s{2,4}(AP_[A-Z_]+):\s*{[\s\S]*?\n  },/gm;
for (const m of src.matchAll(courseRe)) {
  const courseKey = m[1];
  const block = m[0];
  // Extract display name
  const nameM = block.match(/name:\s*"([^"]+)"/);
  // Extract units block
  const unitsM = block.match(/units:\s*{([\s\S]*?)\n\s{4,6}},/);
  const units = {};
  if (unitsM) {
    const ub = unitsM[1];
    const unitRe = /^\s{6,8}([A-Z][A-Z0-9_]+):\s*{[\s\S]*?\s{8,10}name:\s*"([^"]+)"/gm;
    for (const um of ub.matchAll(unitRe)) {
      units[um[1]] = { name: um[2] };
    }
  }
  COURSE_REGISTRY[courseKey] = { name: nameM?.[1] ?? "(no name)", units };
}
const APCourses = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
  "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
  "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

for (const c of APCourses) {
  const cfg = COURSE_REGISTRY[c];
  console.log(`\n## ${c}`);
  console.log(`Display name: ${cfg?.name ?? "(missing!)"}`);
  console.log(`Registry units (${Object.keys(cfg?.units ?? {}).length}):`);
  for (const [k, v] of Object.entries(cfg?.units ?? {})) {
    console.log(`  ${k}  →  ${v.name}`);
  }
  const dbUnits = await sql`
    SELECT unit::text AS unit, COUNT(*)::int AS approved
    FROM questions WHERE course = ${c}::"ApCourse" AND "isApproved" = true
    GROUP BY unit::text ORDER BY approved DESC
  `;
  console.log(`DB units with approved Qs (${dbUnits.length}):`);
  for (const u of dbUnits) {
    const inRegistry = !!cfg?.units?.[u.unit];
    console.log(`  ${u.unit.padEnd(45)} ${String(u.approved).padStart(4)}  ${inRegistry ? "" : "  ← orphan (not in registry)"}`);
  }
}
