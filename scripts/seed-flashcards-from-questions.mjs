#!/usr/bin/env node
// Seed Flashcard rows from existing approved Question rows.
//
// Pragmatic v1: gives the /flashcards UI real content without waiting for
// an AI generator. Lossy (an MCQ stem isn't an ideal flashcard prompt) but
// useful immediately. A future seed generator will produce concept-first
// cards via AI.
//
// Conversion:
//   front       = questionText (stripped of "(stimulus above)" lead-ins)
//   back        = the option text matching correctAnswer (e.g. "A" → opts[0])
//   explanation = existing explanation field
//   cardType    = APPLICATION  (since it tests applying knowledge to a
//                 specific scenario, which is what most MCQs do)
//   contentHash = SHA-256 of front (so re-running is idempotent)
//
// Usage:
//   node scripts/seed-flashcards-from-questions.mjs            # all approved Qs
//   node scripts/seed-flashcards-from-questions.mjs --course=AP_PHYSICS_1
//   node scripts/seed-flashcards-from-questions.mjs --limit=1000 --dry-run

import "dotenv/config";
import { createHash } from "crypto";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();

const courseArg = process.argv.find((a) => a.startsWith("--course="));
const COURSE = courseArg ? courseArg.slice("--course=".length) : null;
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.slice("--limit=".length), 10) : 5000;
const DRY_RUN = process.argv.includes("--dry-run");

function hash(s) {
  return createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

function optsArr(o) {
  if (!o) return null;
  if (Array.isArray(o)) return o;
  if (typeof o === "string") {
    try { return JSON.parse(o); } catch { return null; }
  }
  return null;
}

function answerLetterToText(letter, opts) {
  // Strip a leading label like "A) " so the back of the card is just the answer.
  const idx = String(letter).trim().toUpperCase().charCodeAt(0) - 65;
  if (idx < 0 || idx >= opts.length) return null;
  const raw = String(opts[idx] ?? "").trim();
  return raw.replace(/^[A-Ea-e][)\.\-]\s*/, "").trim();
}

async function main() {
  const where = {
    isApproved: true,
    questionType: "MCQ",
    ...(COURSE ? { course: COURSE } : {}),
  };

  const questions = await prisma.question.findMany({
    where,
    take: LIMIT,
    select: {
      id: true, course: true, unit: true, topic: true,
      questionText: true, options: true, correctAnswer: true,
      explanation: true, difficulty: true, apSkill: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Considering ${questions.length} approved MCQs${COURSE ? ` for ${COURSE}` : ""}…`);
  let candidates = 0;
  let inserted = 0;
  let skipped = 0;

  for (const q of questions) {
    const opts = optsArr(q.options);
    if (!opts || opts.length === 0) { skipped++; continue; }
    const back = answerLetterToText(q.correctAnswer, opts);
    if (!back) { skipped++; continue; }
    const front = (q.questionText || "").trim();
    if (front.length < 20) { skipped++; continue; }
    const explanation = (q.explanation || "").trim();
    if (explanation.length < 60) { skipped++; continue; }

    candidates++;
    const contentHash = hash(`flashcard:${q.course}:${front}`);

    if (DRY_RUN) continue;

    try {
      await prisma.flashcard.create({
        data: {
          course: q.course,
          unit: q.unit,
          topic: q.topic ?? "general",
          concept: q.apSkill ?? q.topic ?? "general",
          cardType: "APPLICATION",
          difficulty: q.difficulty,
          front,
          back,
          explanation,
          contentHash,
          examRelevance: 0.7,
          isApproved: true,
          modelUsed: "seeded-from-question",
        },
      });
      inserted++;
    } catch (e) {
      // P2002 unique constraint on contentHash means we already seeded this Q.
      if (String(e?.code) === "P2002" || String(e.message).includes("Unique constraint")) {
        skipped++;
      } else {
        console.error(`Insert error for question ${q.id}:`, e.message);
        skipped++;
      }
    }
  }

  console.log(`\nCandidates: ${candidates}`);
  console.log(`Inserted:   ${inserted}${DRY_RUN ? " (dry-run, skipped)" : ""}`);
  console.log(`Skipped:    ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
