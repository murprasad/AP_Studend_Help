/**
 * scripts/fix-content-accuracy.mjs
 *
 * Fixes the 1,056+ flagged MCQs from audit-content-accuracy.mjs by
 * cross-checking each one against Groq.
 *
 * Strategy (per-question):
 *   1. AI Solve: send question + options to Groq with strict prompt
 *      "Output ONE letter only — the correct answer."
 *   2. Compare AI's letter to stored correctAnswer:
 *      - MATCH       → false positive on the audit. Leave alone.
 *      - DIFFERENT   → check if AI's letter matches the explanation's
 *                      final number (the audit's "actualMatch"). If yes,
 *                      high confidence the stored answer is wrong; UPDATE.
 *      - NO MATCH    → ambiguous; UNAPPROVE for manual review.
 *
 * Concurrency: 5 parallel Groq workers. Groq free is 30 RPM; 5 parallel
 * gives ~10s budget per call.
 *
 * Usage:
 *   node scripts/fix-content-accuracy.mjs --dry              # preview, no writes
 *   node scripts/fix-content-accuracy.mjs                    # apply fixes
 *   node scripts/fix-content-accuracy.mjs --course=AP_CALCULUS_AB
 *   node scripts/fix-content-accuracy.mjs --limit=50         # smoke run on subset
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const courseFilter = args.find((a) => a.startsWith("--course="))?.slice(9);
const limitArg = args.find((a) => a.startsWith("--limit="))?.slice(8);
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const WORKERS = 5;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) { console.error("GROQ_API_KEY missing"); process.exit(1); }

// ── Audit heuristics (duplicated from audit-content-accuracy.mjs so this
//    script is self-contained — keep in sync if changed) ───────────────
const AI_LEAK_PATTERNS = [
  /\bis not needed,?\s*(just|so)/i,
  /\b(wait|hmm|actually|let me think|on second thought)[,.]/i,
  /\bI (think|believe|need to|should|will) /i,
  /\b(let'?s|let us) (try|see|consider) /i,
  /\b(but|however),?\s+(actually|wait)/i,
];

function findLetterMismatch(explanation, correctAnswer) {
  if (!explanation) return null;
  const correct = correctAnswer.toUpperCase();
  for (const re of [
    /\bcorrect\s+answer\s+is\s+([A-E])\b/i,
    /\banswer\s+is\s+([A-E])\b/i,
    /\bOption\s+([A-E])\s+is\s+correct\b/i,
    /\bThe\s+answer\s*[:=]\s*\(?([A-E])\)?\b/i,
  ]) {
    const m = explanation.match(re);
    if (m && m[1].toUpperCase() !== correct) {
      return { claimed: m[1].toUpperCase(), stored: correct };
    }
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
    if (optNums?.includes(finalNum) && i !== idx) {
      return { explanationFinal: finalNum, actualMatchLetter: String.fromCharCode(65 + i) };
    }
  }
  return null;
}

function isFlagged(q) {
  if (findLetterMismatch(q.explanation, q.correctAnswer)) return true;
  for (const re of AI_LEAK_PATTERNS) if (re.test(q.explanation ?? "")) return true;
  if (findFinalNumberMismatch(q.options, q.correctAnswer, q.explanation)) return true;
  return false;
}

// ── Groq solver — output ONE letter only ────────────────────────────
async function solveWithGroq(q) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const stimulus = q.stimulus ? `Stimulus:\n${q.stimulus.slice(0, 2000)}\n\n` : "";
  const prompt = `${stimulus}Question: ${q.questionText}

Options:
${opts.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}

Output ONLY the letter (A/B/C/D/E) of the correct answer. No explanation, no period, just the letter.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a strict AP/SAT/ACT exam answer key. Solve the multiple-choice question and respond with EXACTLY ONE LETTER: A, B, C, D, or E. No other characters." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 5,
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const raw = String(data.choices?.[0]?.message?.content ?? "").trim().toUpperCase();
  // Extract first valid letter from response (handles "A.", "(A)", "A)" etc.)
  const m = raw.match(/[A-E]/);
  return m?.[0] ?? null;
}

async function processOne(q, stats) {
  try {
    const aiAnswer = await solveWithGroq(q);
    if (!aiAnswer) {
      stats.aiFailed++;
      return { id: q.id, action: "ai_failed" };
    }
    const stored = q.correctAnswer.toUpperCase();
    const numMismatch = findFinalNumberMismatch(q.options, stored, q.explanation);

    // Decision tree
    if (aiAnswer === stored) {
      // False positive on the audit — stored answer is right.
      stats.falsePositive++;
      return { id: q.id, action: "false_positive", aiAnswer, stored };
    }

    // AI disagrees with stored. Two cases:
    // (a) AI matches the heuristic's "actualMatch" letter → high confidence
    //     stored is wrong.
    // (b) AI matches some OTHER letter (neither stored nor heuristic) →
    //     ambiguous; unapprove for manual review.
    const heuristicMatch = numMismatch?.actualMatchLetter ?? null;
    if (heuristicMatch && aiAnswer === heuristicMatch) {
      // High-confidence fix
      stats.fixed++;
      if (!DRY) {
        await prisma.question.update({
          where: { id: q.id },
          data: { correctAnswer: aiAnswer },
        });
      }
      return { id: q.id, action: "fixed", from: stored, to: aiAnswer };
    }

    // Ambiguous: AI says one letter, heuristic suggested another, stored is a third.
    // Trust AI for non-numeric questions (no heuristic available); unapprove
    // for ambiguous numeric ones.
    if (!numMismatch) {
      // Non-numeric question and AI disagrees with stored — apply AI's answer.
      stats.fixed++;
      if (!DRY) {
        await prisma.question.update({
          where: { id: q.id },
          data: { correctAnswer: aiAnswer },
        });
      }
      return { id: q.id, action: "fixed_nonNumeric", from: stored, to: aiAnswer };
    }

    // Ambiguous numeric — unapprove for manual review.
    stats.unapproved++;
    if (!DRY) {
      await prisma.question.update({
        where: { id: q.id },
        data: { isApproved: false },
      });
    }
    return { id: q.id, action: "unapproved_ambiguous", aiAnswer, stored, heuristicMatch };
  } catch (e) {
    stats.errors++;
    return { id: q.id, action: "error", error: e.message?.slice(0, 100) };
  }
}

async function workerLoop(queue, stats, results) {
  while (queue.length > 0) {
    const q = queue.shift();
    if (!q) break;
    const r = await processOne(q, stats);
    results.push(r);
    stats.processed++;
    if (stats.processed % 25 === 0) {
      process.stdout.write(`\r  processed ${stats.processed} | fixed ${stats.fixed} | false-pos ${stats.falsePositive} | unapproved ${stats.unapproved} | errors ${stats.errors}     `);
    }
  }
}

async function main() {
  console.log(`\n📋 Pulling flagged questions${courseFilter ? ` for ${courseFilter}` : ""}…`);
  const where = {
    isApproved: true,
    questionType: "MCQ",
    ...(courseFilter ? { course: courseFilter } : {}),
  };
  const all = await prisma.question.findMany({
    where,
    select: {
      id: true, course: true, questionText: true, stimulus: true,
      options: true, correctAnswer: true, explanation: true,
    },
  });
  const flagged = all.filter(isFlagged).slice(0, LIMIT);
  console.log(`  ${all.length} approved → ${flagged.length} flagged${LIMIT < Infinity ? ` (limit ${LIMIT})` : ""}\n`);

  if (flagged.length === 0) {
    console.log("Nothing to fix. Exiting.");
    await prisma.$disconnect();
    return;
  }

  console.log(`${DRY ? "🟡 DRY RUN" : "⚡ APPLYING FIXES"} with ${WORKERS} parallel workers…`);

  const queue = [...flagged];
  const results = [];
  const stats = { processed: 0, fixed: 0, falsePositive: 0, unapproved: 0, errors: 0, aiFailed: 0 };
  const workers = Array.from({ length: WORKERS }, () => workerLoop(queue, stats, results));
  await Promise.all(workers);

  console.log(`\n\n📊 Final tally`);
  console.log(`  Processed:                ${stats.processed}`);
  console.log(`  Fixed (correctAnswer):    ${stats.fixed}`);
  console.log(`  False positive (no chg):  ${stats.falsePositive}`);
  console.log(`  Unapproved (ambiguous):   ${stats.unapproved}`);
  console.log(`  Errors:                   ${stats.errors}`);
  console.log(`  AI failed to answer:      ${stats.aiFailed}`);

  // Save log file for review.
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = `data/content-accuracy-fix-${ts}.json`;
  try {
    const fs = await import("fs");
    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify({ stats, results }, null, 2));
    console.log(`\n  Log written: ${logPath}`);
  } catch (e) { console.warn(`  log write failed: ${e.message}`); }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
