/**
 * scripts/audit-content-accuracy.mjs
 *
 * Tests question accuracy — NOT just flow. Catches the buoyant-force-style
 * bug class where:
 *   - explanation text says "The correct answer is A"
 *   - stored correctAnswer is "D"
 *   - the math in the explanation arrives at a number that maps to "D"
 *   - student selects per the math, gets marked wrong
 *
 * The E2E suite never catches this because it only verifies clicks +
 * navigation, not whether the rendered correctAnswer matches the
 * explanation's internal logic.
 *
 * Checks per question:
 *   1. explanation_letter_ref_leak: explanation says "Option X is correct"
 *      or "answer is X" where X != correctAnswer
 *   2. ai_internal_monologue: explanation contains AI thinking artifacts
 *      like "is not needed, just" / "Wait" / "actually" mid-text
 *   3. final_number_mismatch (numeric only): the LAST number mentioned in
 *      the explanation doesn't appear in the option indexed by correctAnswer
 *
 * Usage:
 *   node scripts/audit-content-accuracy.mjs                      # all approved AP MCQs
 *   node scripts/audit-content-accuracy.mjs --course=AP_PHYSICS_1
 *   node scripts/audit-content-accuracy.mjs --unapprove          # flip isApproved=false on flagged
 *   node scripts/audit-content-accuracy.mjs --json               # output JSON for CI pipeline
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const courseFilter = args.find((a) => a.startsWith("--course="))?.slice(9);
const doUnapprove = args.includes("--unapprove");
const jsonOut = args.includes("--json");

function log(...args) { if (!jsonOut) console.log(...args); }

// AI internal-monologue artifacts that leak into explanations.
const AI_LEAK_PATTERNS = [
  /\bis not needed,?\s*(just|so)/i,
  /\b(wait|hmm|actually|let me think|on second thought)[,.]/i,
  /\bI (think|believe|need to|should|will) /i,
  /\b(let'?s|let us) (try|see|consider) /i,
  /\b(but|however),?\s+(actually|wait)/i,
];

function findExplanationLetterRefMismatch(explanation, correctAnswer) {
  if (!explanation) return null;
  const exp = explanation;
  const correct = correctAnswer.toUpperCase();
  // Match phrases like "correct answer is A", "Option A is correct", "Answer: A"
  const patterns = [
    /\bcorrect\s+answer\s+is\s+([A-E])\b/i,
    /\banswer\s+is\s+([A-E])\b/i,
    /\bOption\s+([A-E])\s+is\s+correct\b/i,
    /\bThe\s+answer\s*[:=]\s*\(?([A-E])\)?\b/i,
  ];
  for (const re of patterns) {
    const m = exp.match(re);
    if (m && m[1].toUpperCase() !== correct) {
      return { claimed: m[1].toUpperCase(), stored: correct, evidence: m[0] };
    }
  }
  return null;
}

function findAILeak(explanation) {
  if (!explanation) return null;
  for (const re of AI_LEAK_PATTERNS) {
    const m = explanation.match(re);
    if (m) return { evidence: m[0], pattern: re.source };
  }
  return null;
}

/**
 * Pull the LAST numeric value mentioned in the explanation. Returns null
 * if the question doesn't look numeric (no numbers in any option).
 * Used to detect cases where math arrives at a number that doesn't match
 * the indexed correct option.
 */
function findFinalNumberMismatch(options, correctAnswer, explanation) {
  if (!options?.length || !explanation) return null;
  const correct = correctAnswer.toUpperCase();
  const idx = correct.charCodeAt(0) - "A".charCodeAt(0);
  if (idx < 0 || idx >= options.length) return null;
  const correctOptionText = String(options[idx] ?? "");

  // Only run this check when options are clearly numeric (e.g. "245 N", "0.05 m³").
  const optHasNumber = options.some((o) => /\d/.test(String(o ?? "")));
  if (!optHasNumber) return null;

  // Extract the LAST number from the explanation.
  const nums = String(explanation).match(/[-+]?\d+(?:\.\d+)?/g);
  if (!nums?.length) return null;
  const finalNum = nums[nums.length - 1];

  // Extract the FIRST number from the correct option.
  const correctOptionNums = correctOptionText.match(/[-+]?\d+(?:\.\d+)?/g);
  if (!correctOptionNums?.length) return null;
  const correctNum = correctOptionNums[0];

  if (finalNum === correctNum) return null;

  // Try every option — does the explanation's final number match a DIFFERENT
  // option? Then we have a real mismatch.
  for (let i = 0; i < options.length; i++) {
    const optNums = String(options[i] ?? "").match(/[-+]?\d+(?:\.\d+)?/g);
    if (optNums?.includes(finalNum) && i !== idx) {
      const matchLetter = String.fromCharCode("A".charCodeAt(0) + i);
      return {
        explanationFinal: finalNum,
        storedCorrect: `${correct} (${correctNum})`,
        actualMatch: `${matchLetter} (${finalNum})`,
      };
    }
  }
  return null;
}

async function main() {
  const where = {
    isApproved: true,
    questionType: "MCQ",
    ...(courseFilter ? { course: courseFilter } : {}),
  };

  log(`\n📋 Auditing approved MCQs${courseFilter ? ` for ${courseFilter}` : " across all courses"}…`);
  const questions = await prisma.question.findMany({
    where,
    select: { id: true, course: true, options: true, correctAnswer: true, explanation: true, questionText: true },
  });
  log(`  Pulled ${questions.length} questions\n`);

  const flagged = [];
  for (const q of questions) {
    const issues = [];

    const letterMismatch = findExplanationLetterRefMismatch(q.explanation, q.correctAnswer);
    if (letterMismatch) issues.push({ kind: "explanation_letter_ref_leak", detail: letterMismatch });

    const aiLeak = findAILeak(q.explanation);
    if (aiLeak) issues.push({ kind: "ai_internal_monologue", detail: aiLeak });

    const numMismatch = findFinalNumberMismatch(q.options, q.correctAnswer, q.explanation);
    if (numMismatch) issues.push({ kind: "final_number_mismatch", detail: numMismatch });

    if (issues.length > 0) flagged.push({ id: q.id, course: q.course, issues, questionText: q.questionText.slice(0, 100) });
  }

  // Group by course
  const byCourse = {};
  for (const f of flagged) {
    byCourse[f.course] = (byCourse[f.course] || 0) + 1;
  }

  if (jsonOut) {
    console.log(JSON.stringify({ total: questions.length, flagged: flagged.length, byCourse, samples: flagged.slice(0, 20) }, null, 2));
  } else {
    log("──────────────────────────────────────────────");
    log(`📊 Summary: ${flagged.length} of ${questions.length} approved MCQs flagged (${(flagged.length / questions.length * 100).toFixed(1)}%)`);
    log("\nBy course:");
    const sorted = Object.entries(byCourse).sort((a, b) => b[1] - a[1]);
    for (const [course, n] of sorted) {
      const total = questions.filter((q) => q.course === course).length;
      log(`  ${course.padEnd(40)} ${n} / ${total}  (${(n / total * 100).toFixed(1)}%)`);
    }

    log("\n🔍 First 5 flagged samples:");
    for (const f of flagged.slice(0, 5)) {
      log(`\n  id: ${f.id}`);
      log(`  course: ${f.course}`);
      log(`  question: ${f.questionText}…`);
      for (const issue of f.issues) {
        log(`  • ${issue.kind}: ${JSON.stringify(issue.detail).slice(0, 200)}`);
      }
    }
  }

  if (doUnapprove && flagged.length > 0) {
    log(`\n⚡ Auto-unapproving ${flagged.length} flagged questions…`);
    let unapproved = 0;
    for (const f of flagged) {
      try {
        await prisma.question.update({
          where: { id: f.id },
          data: { isApproved: false },
        });
        unapproved++;
      } catch (e) {
        log(`  ⚠ failed to unapprove ${f.id}: ${e.message?.slice(0, 80)}`);
      }
    }
    log(`  ✅ Unapproved ${unapproved} / ${flagged.length}`);
  }

  await prisma.$disconnect();
  // Exit 1 if anything flagged — useful as a CI gate.
  if (flagged.length > 0 && !doUnapprove) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
