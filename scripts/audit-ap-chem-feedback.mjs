#!/usr/bin/env node
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

(async () => {
  console.log("\n=== AP Chemistry feedback audit ===\n");

  // All sessions feedback for AP Chemistry
  const feedback = await sql`
    SELECT
      sf.id,
      sf.rating,
      sf."feedbackText",
      sf.context,
      sf."createdAt",
      ps.course,
      ps."totalQuestions",
      ps."correctAnswers",
      u.email
    FROM session_feedback sf
    JOIN practice_sessions ps ON ps.id = sf."sessionId"
    JOIN users u ON u.id = sf."userId"
    WHERE ps.course = 'AP_CHEMISTRY'
    ORDER BY sf."createdAt" DESC
  `;
  console.log(`Found ${feedback.length} AP Chem feedback row(s)\n`);
  for (const f of feedback) {
    const tag = f.rating === 1 ? "👍" : f.rating === -1 ? "👎" : "?";
    console.log(`${tag} ${f.email} (${f.correctAnswers ?? '?'}/${f.totalQuestions ?? '?'}) — ${new Date(f.createdAt).toISOString().slice(0,10)}`);
    if (f.feedbackText) console.log(`   Text: "${f.feedbackText}"`);
  }

  // Aggregate: thumbs-up/down counts
  const aggregate = await sql`
    SELECT
      sf.rating,
      COUNT(*)::int AS n
    FROM session_feedback sf
    JOIN practice_sessions ps ON ps.id = sf."sessionId"
    WHERE ps.course = 'AP_CHEMISTRY'
    GROUP BY sf.rating
  `;
  console.log(`\n=== Aggregate ===`);
  for (const r of aggregate) {
    console.log(`  ${r.rating === 1 ? "Thumbs up" : "Thumbs down"}: ${r.n}`);
  }

  // Question bank stats for AP Chemistry
  console.log(`\n=== AP Chem MCQ bank stats ===`);
  const [stats] = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE stimulus IS NOT NULL AND length(stimulus) > 30)::int AS with_stim,
      AVG(length(explanation))::int AS avg_expl_len,
      MAX(length(explanation))::int AS max_expl_len
    FROM questions
    WHERE course = 'AP_CHEMISTRY' AND "questionType" = 'MCQ'
  `;
  console.log(`  Total MCQs: ${stats.total}`);
  console.log(`  With stimulus (>30 chars): ${stats.with_stim} (${((stats.with_stim/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Avg explanation: ${stats.avg_expl_len} chars`);
  console.log(`  Max explanation: ${stats.max_expl_len} chars`);

  // Difficulty + answer distribution
  const diff = await sql`
    SELECT difficulty, "correctAnswer", COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_CHEMISTRY' AND "questionType" = 'MCQ'
    GROUP BY difficulty, "correctAnswer"
    ORDER BY difficulty, "correctAnswer"
  `;
  console.log(`\n=== Difficulty × answer distribution ===`);
  let cur = "";
  for (const r of diff) {
    if (r.difficulty !== cur) { console.log(`  ${r.difficulty}:`); cur = r.difficulty; }
    console.log(`    ${r.correctAnswer}: ${r.n}`);
  }

  // Sample 3 questions to spot-check
  console.log(`\n=== 3 random AP Chem MCQ samples ===\n`);
  const samples = await sql`
    SELECT id, "questionText", stimulus, options, "correctAnswer", explanation, unit, topic
    FROM questions
    WHERE course = 'AP_CHEMISTRY' AND "questionType" = 'MCQ'
    ORDER BY random()
    LIMIT 3
  `;
  for (const q of samples) {
    console.log(`--- ${q.id.slice(0,8)} (${q.unit} / ${q.topic}) ---`);
    console.log(`  Stimulus: ${q.stimulus ? q.stimulus.slice(0,80) + '...' : 'NONE'}`);
    console.log(`  Q: ${q.questionText.slice(0,150)}`);
    console.log(`  Options: ${typeof q.options === 'string' ? q.options.slice(0,150) : JSON.stringify(q.options).slice(0,150)}`);
    console.log(`  Correct: ${q.correctAnswer}`);
    console.log(`  Expl (${q.explanation.length} chars): ${q.explanation.slice(0,200)}\n`);
  }
})().catch(e => { console.error(e); process.exit(1); });
