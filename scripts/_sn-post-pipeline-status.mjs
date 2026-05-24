import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const counts = await sql`
  SELECT course::text AS course,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE "isApproved" = true)::int AS approved,
    COUNT(*) FILTER (WHERE "isApproved" = false)::int AS unapproved
  FROM questions
  GROUP BY course
  ORDER BY approved DESC`;

let totalApproved = 0, totalUnapproved = 0;
console.log("\nSN — post-pipeline (gen prompts + 6 gates + second-pass sweep applied to SAT/ACT/engaged APs)\n");
console.log("Course".padEnd(40), "Approved".padStart(9), "Unappr.".padStart(9), "Total".padStart(8));
console.log("─".repeat(70));
for (const r of counts) {
  totalApproved += r.approved;
  totalUnapproved += r.unapproved;
  console.log(
    r.course.padEnd(40),
    String(r.approved).padStart(9),
    String(r.unapproved).padStart(9),
    String(r.total).padStart(8),
  );
}
console.log("─".repeat(70));
console.log("TOTAL".padEnd(40), String(totalApproved).padStart(9), String(totalUnapproved).padStart(9));

const sub500 = counts.filter(r => r.approved < 500);
console.log(`\nCourses below 500 approved: ${sub500.length}`);
for (const r of sub500) console.log(`  ${r.course.padEnd(40)} ${r.approved}`);

const since = new Date(Date.now() - 24*3600*1000);
const recent = await sql`
  SELECT COUNT(*) FILTER (WHERE "createdAt" >= ${since})::int AS new24h,
    COUNT(*) FILTER (WHERE "updatedAt" >= ${since} AND "isApproved" = false)::int AS unapproved24h
  FROM questions`;
console.log(`\nLast 24h: +${recent[0].new24h} new Qs, ${recent[0].unapproved24h} unapproved by gates`);
