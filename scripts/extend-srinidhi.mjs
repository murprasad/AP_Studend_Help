#!/usr/bin/env node
// Extend Srinidhi's manual Premium grant by an additional 30 days
// (60 days total from today) as goodwill for the webhook failure.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const NEW_END = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

const users = await prisma.user.findMany({
  where: { email: { contains: "saravanab", mode: "insensitive" } },
  select: { id: true, email: true, stripeCurrentPeriodEnd: true, subscriptionTier: true },
});

console.log(`Extending ${users.length} account(s) to ${NEW_END.toISOString().slice(0, 10)} (60 days):\n`);

for (const u of users) {
  await prisma.user.update({
    where: { id: u.id },
    data: { stripeCurrentPeriodEnd: NEW_END, subscriptionTier: "PREMIUM" },
  });
  // Update the matching ModuleSubscription too
  const mods = await prisma.moduleSubscription.findMany({
    where: { userId: u.id, status: "active" },
    select: { id: true, module: true, stripeCurrentPeriodEnd: true },
  });
  for (const m of mods) {
    await prisma.moduleSubscription.update({
      where: { id: m.id },
      data: { stripeCurrentPeriodEnd: NEW_END },
    });
    console.log(`  ${u.email} [${m.module}] ${m.stripeCurrentPeriodEnd?.toISOString().slice(0, 10) ?? "-"} → ${NEW_END.toISOString().slice(0, 10)}`);
  }
  if (mods.length === 0) {
    console.log(`  ${u.email} (no active module subs — User row updated only)`);
  }
}

console.log("\nDone.");
