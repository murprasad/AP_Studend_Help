#!/usr/bin/env node
// Diagnose flashcards labeled AP_CHEMISTRY but containing content from
// other courses (e.g. Islamic Golden Age).
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();

const COURSES = [
  "AP_CHEMISTRY",
  "AP_WORLD_HISTORY",
  "AP_PHYSICS_1",
  "AP_BIOLOGY",
  "AP_US_HISTORY",
];

const SUSPICIOUS_TERMS_BY_COURSE = {
  AP_CHEMISTRY: [
    "Islamic Golden Age",
    "World War",
    "Revolution",
    "Renaissance",
    "Empire",
    "Pope",
    "Dynasty",
  ],
  AP_PHYSICS_1: ["Islamic", "World War", "Renaissance", "Pope", "Dynasty"],
  AP_BIOLOGY: ["Islamic", "World War", "Renaissance", "Pope"],
};

console.log("Looking for cross-contaminated flashcards...\n");

for (const course of COURSES) {
  const total = await prisma.flashcard.count({ where: { course } });
  console.log(`── ${course} (${total} cards total) ──`);

  const sample = await prisma.flashcard.findMany({
    where: { course },
    select: { id: true, course: true, unit: true, topic: true, concept: true },
    take: 5,
  });

  for (const c of sample) {
    console.log(`   ${c.id.slice(0, 10)}  unit=${c.unit}  topic=${c.topic?.slice(0, 40)}`);
    console.log(`              concept: ${(c.concept ?? "").slice(0, 80)}`);
  }

  // Check for mismatched content
  const suspicious = SUSPICIOUS_TERMS_BY_COURSE[course] ?? [];
  let mismatchCount = 0;
  for (const term of suspicious) {
    const matches = await prisma.flashcard.count({
      where: {
        course,
        OR: [
          { topic: { contains: term, mode: "insensitive" } },
          { concept: { contains: term, mode: "insensitive" } },
        ],
      },
    });
    if (matches > 0) {
      console.log(`   ⚠️  Found ${matches} card(s) matching "${term}" — likely mislabeled`);
      mismatchCount += matches;
    }
  }
  if (mismatchCount > 0) {
    console.log(`   ❌ ${mismatchCount} suspected cross-course contamination\n`);
  } else {
    console.log(`   ✅ No suspicious terms found\n`);
  }
}
