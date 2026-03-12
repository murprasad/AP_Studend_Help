import { PrismaClient } from "@prisma/client";
async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.question.groupBy({by:["course","unit"],where:{isApproved:true},_count:{id:true}});
  const byC: Record<string,number> = {};
  for (const r of rows) { byC[r.course]=(byC[r.course]||0)+r._count.id; }
  for (const [c,n] of Object.entries(byC)) console.log(c, n);
  const total = Object.values(byC).reduce((a,b)=>a+b,0);
  console.log("TOTAL", total);
  const low = rows.filter(r=>r._count.id<20).map(r=>r.unit+":"+r._count.id);
  if(low.length) console.log("BELOW 20:", low.join(", "));
  else console.log("ALL UNITS AT 20+!");
  await prisma.$disconnect();
}
main();
