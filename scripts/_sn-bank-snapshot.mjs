/**
 * StudentNest bank snapshot — by course, unit, option-count distribution.
 * Mirrors the PrepLion sampler.
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const qs = await p.question.findMany({
  where: { isApproved: true },
  select: { id: true, course: true, unit: true, options: true },
});

console.log(`SN total approved: ${qs.length}\n`);

const byCourse = {};
qs.forEach((q) => {
  if (!byCourse[q.course]) byCourse[q.course] = { count: 0, opts: {} };
  byCourse[q.course].count++;
  const n = Array.isArray(q.options) ? q.options.length : 0;
  byCourse[q.course].opts[n] = (byCourse[q.course].opts[n] || 0) + 1;
});

console.log("Course | approved | 4-opt | 5-opt | other");
console.log("-".repeat(80));
Object.entries(byCourse).sort((a, b) => b[1].count - a[1].count).forEach(([c, info]) => {
  const fourOpt = info.opts[4] || 0;
  const fiveOpt = info.opts[5] || 0;
  const other = info.count - fourOpt - fiveOpt;
  console.log(`${c.padEnd(40)} ${String(info.count).padStart(6)} | ${String(fourOpt).padStart(5)} | ${String(fiveOpt).padStart(5)} | ${String(other).padStart(5)}`);
});

await p.$disconnect();
