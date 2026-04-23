#!/usr/bin/env node
// One-off: show flashcard counts per course + sample a few from AP_PHYSICS_1
// to diagnose a real-user report that the /flashcards page shows
// "other subject" cards when they're on AP Physics.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();

const counts = await prisma.flashcard.groupBy({
  by: ["course"],
  where: { isApproved: true, userId: null },
  _count: { _all: true },
  orderBy: { _count: { course: "desc" } },
});
console.log("Per-course approved global flashcards:\n");
for (const c of counts) {
  console.log(`  ${String(c.course).padEnd(32)} ${c._count._all}`);
}

console.log("\n\nSample 3 AP_PHYSICS_1 flashcards:\n");
const physics = await prisma.flashcard.findMany({
  where: { course: "AP_PHYSICS_1", isApproved: true, userId: null },
  take: 3,
  select: { id: true, unit: true, topic: true, front: true, back: true },
});
for (const f of physics) {
  console.log(`  ${f.id} — ${f.unit} / ${f.topic}`);
  console.log(`    front: ${(f.front || "").slice(0, 120)}`);
  console.log(`    back:  ${(f.back || "").slice(0, 80)}`);
  console.log();
}

console.log("\nAP_PHYSICS_1 total:");
const physicsCount = await prisma.flashcard.count({
  where: { course: "AP_PHYSICS_1", isApproved: true, userId: null },
});
console.log(`  ${physicsCount} cards`);
