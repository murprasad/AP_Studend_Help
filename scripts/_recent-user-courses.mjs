import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const days = parseInt(process.argv[2] ?? "14", 10);
const since = new Date(Date.now() - days * 86400000);

console.log(`Users registered in last ${days} days (since ${since.toISOString().slice(0,10)}):\n`);

// Count by freeTrialCourse
const byTrialCourse = await sql`
  SELECT "freeTrialCourse"::text AS course, COUNT(*)::int AS users
  FROM users
  WHERE "createdAt" >= ${since}
    AND "freeTrialCourse" IS NOT NULL
  GROUP BY "freeTrialCourse"
  ORDER BY users DESC`;

console.log("By trial course (registered):");
for (const r of byTrialCourse) console.log(`  ${(r.course || "NONE").padEnd(40)} ${r.users}`);

// Count by actual practice sessions (real engagement)
const byPractice = await sql`
  SELECT ps.course::text AS course, COUNT(DISTINCT ps."userId")::int AS users, COUNT(*)::int AS sessions
  FROM practice_sessions ps
  JOIN users u ON u.id = ps."userId"
  WHERE u."createdAt" >= ${since}
  GROUP BY ps.course
  ORDER BY users DESC
  LIMIT 30`;

console.log("\nBy actual practice sessions (engagement):");
for (const r of byPractice) {
  console.log(`  ${r.course.padEnd(40)} ${String(r.users).padStart(4)} users  ${String(r.sessions).padStart(5)} sessions`);
}

// Top emails to spot-check
const recent = await sql`
  SELECT email, "freeTrialCourse"::text AS course, "createdAt"
  FROM users
  WHERE "createdAt" >= ${since}
  ORDER BY "createdAt" DESC LIMIT 20`;
console.log(`\nMost recent ${recent.length} signups:`);
for (const u of recent) console.log(`  ${(u.email || "anon").padEnd(45)} ${(u.course || "—").padEnd(40)} ${u.createdAt.toISOString().slice(0, 10)}`);
