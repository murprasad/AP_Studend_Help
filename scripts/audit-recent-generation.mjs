/**
 * scripts/audit-recent-generation.mjs
 *
 * Verifies whether the question GENERATION pipeline is currently producing
 * correct questions. Different from audit-content-accuracy.mjs (which
 * audits the entire approved bank including legacy AI-generated junk):
 * this one isolates RECENTLY-GENERATED questions to see if today's
 * generator is broken or fine.
 *
 * Usage:
 *   node scripts/audit-recent-generation.mjs                # last 7 days
 *   node scripts/audit-recent-generation.mjs --days=1       # last 24 hours
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const days = parseInt(args.find((a) => a.startsWith("--days="))?.slice(7) ?? "7", 10);

const AI_LEAK_PATTERNS = [
  /\bis not needed,?\s*(just|so)/i,
  /\b(wait|hmm|actually|let me think|on second thought)[,.]/i,
  /\bI (think|believe|need to|should|will) /i,
  /\b(let'?s|let us) (try|see|consider) /i,
];

function findLetterMismatch(explanation, correctAnswer) {
  if (!explanation) return null;
  const correct = correctAnswer.toUpperCase();
  for (const re of [
    /\bcorrect\s+answer\s+is\s+([A-E])\b/i,
    /\banswer\s+is\s+([A-E])\b/i,
    /\bOption\s+([A-E])\s+is\s+correct\b/i,
  ]) {
    const m = explanation.match(re);
    if (m && m[1].toUpperCase() !== correct) return { claimed: m[1].toUpperCase(), stored: correct };
  }
  return null;
}

function findFinalNumberMismatch(options, correctAnswer, explanation) {
  if (!options?.length || !explanation) return null;
  const idx = correctAnswer.toUpperCase().charCodeAt(0) - 65;
  if (idx < 0 || idx >= options.length) return null;
  const optHasNumber = options.some((o) => /\d/.test(String(o ?? "")));
  if (!optHasNumber) return null;
  const nums = String(explanation).match(/[-+]?\d+(?:\.\d+)?/g);
  if (!nums?.length) return null;
  const finalNum = nums[nums.length - 1];
  for (let i = 0; i < options.length; i++) {
    const optNums = String(options[i] ?? "").match(/[-+]?\d+(?:\.\d+)?/g);
    if (optNums?.includes(finalNum) && i !== idx) return { explanationFinal: finalNum, actualMatchLetter: String.fromCharCode(65 + i) };
  }
  return null;
}

async function main() {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log(`\n📋 Auditing approved MCQs created since ${since.toISOString()} (last ${days} day${days === 1 ? "" : "s"})…\n`);

  const recent = await prisma.question.findMany({
    where: {
      isApproved: true,
      questionType: "MCQ",
      createdAt: { gte: since },
    },
    select: {
      id: true, course: true, options: true, correctAnswer: true,
      explanation: true, createdAt: true, modelUsed: true, generatedForTier: true,
    },
  });

  console.log(`Pulled ${recent.length} recently-approved MCQs\n`);
  if (recent.length === 0) {
    console.log("No recent generation. Try --days=30");
    await prisma.$disconnect();
    return;
  }

  let flagged = 0;
  const flaggedByCourse = {};
  const totalByCourse = {};
  const flaggedSamples = [];

  for (const q of recent) {
    totalByCourse[q.course] = (totalByCourse[q.course] || 0) + 1;
    const issues = [];

    const letterMismatch = findLetterMismatch(q.explanation, q.correctAnswer);
    if (letterMismatch) issues.push({ kind: "letter_ref_leak", detail: letterMismatch });

    for (const re of AI_LEAK_PATTERNS) {
      if (re.test(q.explanation ?? "")) { issues.push({ kind: "ai_internal_monologue" }); break; }
    }

    const numMismatch = findFinalNumberMismatch(q.options, q.correctAnswer, q.explanation);
    if (numMismatch) issues.push({ kind: "final_number_mismatch", detail: numMismatch });

    if (issues.length > 0) {
      flagged++;
      flaggedByCourse[q.course] = (flaggedByCourse[q.course] || 0) + 1;
      if (flaggedSamples.length < 5) flaggedSamples.push({ id: q.id, course: q.course, issues, model: q.modelUsed });
    }
  }

  console.log("──────────────────────────────────────────────");
  console.log(`📊 Recent generation flag rate: ${flagged} / ${recent.length} = ${(flagged / recent.length * 100).toFixed(1)}%\n`);

  console.log("By course (sorted by flag %):");
  const courseEntries = Object.entries(totalByCourse).map(([c, total]) => {
    const flag = flaggedByCourse[c] || 0;
    return { course: c, total, flag, pct: (flag / total) * 100 };
  }).sort((a, b) => b.pct - a.pct);
  for (const e of courseEntries) {
    console.log(`  ${e.course.padEnd(40)} ${String(e.flag).padStart(3)} / ${String(e.total).padStart(3)}  (${e.pct.toFixed(1)}%)`);
  }

  console.log("\nFirst 5 flagged samples:");
  for (const s of flaggedSamples) {
    console.log(`  ${s.course} · model=${s.model ?? "?"} · ${s.issues.map((i) => i.kind).join(", ")}`);
  }

  // Compare to baseline: legacy bank rate is ~13.2% per audit-content-accuracy.
  console.log(`\n📐 Comparison: legacy approved-bank flag rate is ~13.2% (1056 / 8007).`);
  if (flagged / recent.length > 0.10) {
    console.log("⚠ Recent generation flag rate is similar to legacy → generation pipeline still produces broken questions.");
  } else {
    console.log("✅ Recent generation flag rate is much lower than legacy → generator improved over time; legacy bank is the issue.");
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
