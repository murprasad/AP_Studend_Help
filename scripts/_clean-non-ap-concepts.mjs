import { makePrisma } from "./_prisma-http.mjs";
const p = makePrisma();
const AP_ONLY = ["AP_BIOLOGY","AP_CALCULUS_AB","AP_CALCULUS_BC","AP_CHEMISTRY","AP_COMPUTER_SCIENCE_PRINCIPLES","AP_PHYSICS_1","AP_PSYCHOLOGY","AP_STATISTICS","AP_US_HISTORY","AP_WORLD_HISTORY"];
const before = await p.sageCoachConcept.count();
const del = await p.sageCoachConcept.deleteMany({ where: { course: { notIn: AP_ONLY } } });
const after = await p.sageCoachConcept.count();
console.log(`Deleted ${del.count} non-AP concepts | Before: ${before} | After: ${after}`);
const g = await p.sageCoachConcept.groupBy({ by: ["course"], _count: true });
for (const r of g.sort((a,b) => b._count - a._count)) console.log(" ", r.course.padEnd(40), r._count);
