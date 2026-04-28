// Sanity-check that the keyword-based drift audit isn't hiding hits.
// Use ILIKE (simpler) instead of PG ~* regex to verify counts directly.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const checks = [
  // AP World History: Modern starts at 1200 CE. Pre-1200 content = drift.
  { course: "AP_WORLD_HISTORY", terms: ["mesopotamia", "ancient egypt", "fall of rome", "greek polis", "hellenistic", "han dynasty"] },
  // AP Psychology 2024-25 redesign — old unit names that may still be in question text
  { course: "AP_PSYCHOLOGY", terms: ["states of consciousness", "sensation and perception", "testing and individual differences", "abnormal psychology"] },
  // AP Physics 1 sanity — should be 0 after our cleanup
  { course: "AP_PHYSICS_1", terms: ["circuit", "voltage", "ohm", "coulomb", "resistor", "mechanical wave"] },
];

for (const c of checks) {
  console.log(`\n## ${c.course}`);
  for (const t of c.terms) {
    const r = await sql`
      SELECT COUNT(*)::int AS n
      FROM questions
      WHERE course = ${c.course}::"ApCourse"
        AND "isApproved" = true
        AND ("questionText" ILIKE ${'%' + t + '%'} OR stimulus ILIKE ${'%' + t + '%'})
    `;
    const flag = r[0].n >= 5 ? " ⚠️" : r[0].n > 0 ? " ·" : "";
    console.log(`  "${t}": ${r[0].n}${flag}`);
  }
}
