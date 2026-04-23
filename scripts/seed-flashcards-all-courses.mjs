#!/usr/bin/env node
// Seed flashcards for every course that has approved MCQs but no
// (or very few) flashcards yet. Real user 2026-04-23 reported AP
// Physics view "shows other subjects" — root cause was AP_PHYSICS_1
// had 0 seeded flashcards, so the /flashcards page silently fell back
// to the default course's cards.
//
// This iterates all courses, seeds up to N=300 per course from its own
// approved MCQs. Idempotent via contentHash.
//
// Usage: node scripts/seed-flashcards-all-courses.mjs [--per-course=300]

import "dotenv/config";
import { createHash } from "crypto";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const perCourseArg = process.argv.find((a) => a.startsWith("--per-course="));
const PER_COURSE = perCourseArg ? parseInt(perCourseArg.slice("--per-course=".length), 10) : 300;

function hash(s) {
  return createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

function optsArr(o) {
  if (!o) return null;
  if (Array.isArray(o)) return o;
  if (typeof o === "string") { try { return JSON.parse(o); } catch { return null; } }
  return null;
}

function answerLetterToText(letter, opts) {
  const idx = String(letter).trim().toUpperCase().charCodeAt(0) - 65;
  if (idx < 0 || idx >= opts.length) return null;
  const raw = String(opts[idx] ?? "").trim();
  return raw.replace(/^[A-Ea-e][)\.\-]\s*/, "").trim();
}

// Get per-course current flashcard counts.
const counts = await prisma.flashcard.groupBy({
  by: ["course"],
  where: { isApproved: true, userId: null },
  _count: { _all: true },
});
const countMap = Object.fromEntries(counts.map((c) => [c.course, c._count._all]));

// Get all courses with approved MCQs.
const coursesWithQs = await prisma.question.groupBy({
  by: ["course"],
  where: { isApproved: true, questionType: "MCQ" },
  _count: { _all: true },
});

let totalInserted = 0;
for (const c of coursesWithQs) {
  const currentCount = countMap[c.course] || 0;
  if (currentCount >= PER_COURSE) {
    console.log(`${c.course.padEnd(32)} ${currentCount} already — skip`);
    continue;
  }
  const needed = PER_COURSE - currentCount;
  const questions = await prisma.question.findMany({
    where: { course: c.course, isApproved: true, questionType: "MCQ" },
    take: needed + 50, // buffer for skip-on-fail
    select: {
      id: true, course: true, unit: true, topic: true,
      questionText: true, options: true, correctAnswer: true,
      explanation: true, difficulty: true, apSkill: true,
    },
    orderBy: { createdAt: "desc" },
  });

  let inserted = 0;
  for (const q of questions) {
    if (inserted >= needed) break;
    const opts = optsArr(q.options);
    if (!opts || opts.length === 0) continue;
    const back = answerLetterToText(q.correctAnswer, opts);
    if (!back) continue;
    const front = (q.questionText || "").trim();
    if (front.length < 20) continue;
    const explanation = (q.explanation || "").trim();
    if (explanation.length < 60) continue;

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
          contentHash: hash(`flashcard:${q.course}:${front}`),
          examRelevance: 0.7,
          isApproved: true,
          modelUsed: "seeded-from-question",
        },
      });
      inserted++;
    } catch (e) {
      if (String(e?.code) !== "P2002" && !String(e.message).includes("Unique constraint")) {
        console.error(`${q.course} insert error: ${e.message}`);
      }
    }
  }
  console.log(`${c.course.padEnd(32)} +${inserted} (was ${currentCount}, need ${needed})`);
  totalInserted += inserted;
}

console.log(`\nTotal inserted: ${totalInserted}`);
