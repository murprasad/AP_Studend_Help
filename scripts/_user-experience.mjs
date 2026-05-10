import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const email = process.argv[2];
const user = await sql`SELECT id, email, "createdAt", "lastActiveDate", track, "freeTrialCourse" FROM users WHERE email = ${email}`;
if (!user.length) { console.log("not found"); process.exit(0); }
const u = user[0];
console.log("USER:", u.email, "track:", u.track, "freeTrialCourse:", u.freeTrialCourse);
console.log("created:", u.createdAt, "lastActive:", u.lastActiveDate);
console.log("");

// Get column list first
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'practice_sessions'`;
console.log("session cols:", cols.map(c=>c.column_name).slice(0, 20).join(", "));
const sessions = await sql`
  SELECT * FROM practice_sessions
  WHERE "userId" = ${u.id}
  ORDER BY "startedAt" DESC
  LIMIT 10
`;
console.log(`PRACTICE SESSIONS (${sessions.length}):`);
for (const s of sessions) {
  const dur = s.completedAt ? Math.round((new Date(s.completedAt) - new Date(s.startedAt))/1000) + "s" : "—";
  console.log(`  ${s.startedAt} ${String(s.course).padEnd(40)} score=${s.score ?? "—"} dur=${dur} completed=${!!s.completedAt}`);
}

const responses = await sql`
  SELECT "questionId", "isCorrect", "answeredAt"
  FROM student_responses
  WHERE "userId" = ${u.id}
  ORDER BY "answeredAt" DESC
  LIMIT 30
`;
console.log(`\nLAST 30 STUDENT RESPONSES (${responses.length} shown):`);
for (const r of responses) {
  console.log(`  ${r.answeredAt} qid=${r.questionId.slice(0,8)} correct=${r.isCorrect}`);
}

const journey = await sql`
  SELECT "currentStep", "userExited", "createdAt", "updatedAt", "step1Score", "step2Score", "step3Score", "step4Score"
  FROM journey_states WHERE "userId" = ${u.id}
`;
console.log(`\nJOURNEY:`);
for (const j of journey) {
  console.log(`  step=${j.currentStep} exited=${j.userExited} step1=${j.step1Score} step2=${j.step2Score} step3=${j.step3Score} step4=${j.step4Score}`);
  console.log(`  created=${j.createdAt} updated=${j.updatedAt}`);
}
