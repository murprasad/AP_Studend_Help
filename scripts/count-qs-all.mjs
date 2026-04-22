// Per-course question count across the whole StudentNest catalog.
// Uses Neon HTTP adapter to avoid the TCP/5432 connection issue.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Pull per-course approved + total, plus OfficialSample reference count.
// Note: Prisma @@map-s Question → "questions" and OfficialSample →
// "official_samples". The lowercase table names are the ones that exist
// in Neon. Do NOT use "Question" (capital Q) — that relation does not
// exist; Postgres is case-preserving for quoted identifiers.
const q = await sql`
  SELECT
    course,
    COUNT(*) FILTER (WHERE "isApproved" = true)::int  AS approved,
    COUNT(*)::int                                     AS total
  FROM "questions"
  GROUP BY course
  ORDER BY approved DESC, course ASC
`;
const samples = await sql`
  SELECT course, COUNT(*)::int AS n
  FROM "official_samples"
  GROUP BY course
`;
const sampleMap = Object.fromEntries(samples.map(r => [r.course, r.n]));

console.log("Course                                  Approved  Total   Samples");
console.log("----------------------------------------------------------------");
let totalApproved = 0, totalTotal = 0, totalSamples = 0;
for (const row of q) {
  const s = sampleMap[row.course] ?? 0;
  totalApproved += row.approved;
  totalTotal += row.total;
  totalSamples += s;
  console.log(
    row.course.padEnd(40),
    String(row.approved).padStart(8),
    String(row.total).padStart(7),
    String(s).padStart(9),
  );
}
console.log("----------------------------------------------------------------");
console.log(
  "TOTAL".padEnd(40),
  String(totalApproved).padStart(8),
  String(totalTotal).padStart(7),
  String(totalSamples).padStart(9),
);
