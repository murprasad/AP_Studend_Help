import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
for (const c of ["AP_US_HISTORY", "AP_STATISTICS"]) {
  const total = await p.question.count({ where: { course: c } });
  const approved = await p.question.count({ where: { course: c, isApproved: true } });
  console.log(`${c}: ${approved} approved / ${total} total`);
}
await p.$disconnect();
