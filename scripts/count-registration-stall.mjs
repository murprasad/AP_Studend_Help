/**
 * Count registration-stall candidates — users registered + email-verified
 * but never completed onboarding. Uses the exact same WHERE clause as
 * /api/cron/registration-stall. Does NOT send or write anything.
 *
 * Usage:
 *   node scripts/count-registration-stall.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (!m) continue;
    const [, key, val] = m;
    if (!process.env[key]) process.env[key] = val.trim().replace(/^['"]|['"]$/g, "");
  }
}
loadEnv();

const HOURS = 3600 * 1000;
const DAYS = 24 * HOURS;

const p = new PrismaClient();
try {
  const now = new Date();
  const oldCutoff = new Date(now.getTime() - 14 * DAYS);
  const graceCutoff = new Date(now.getTime() - 2 * HOURS);

  const candidates = await p.user.findMany({
    where: {
      emailVerified: { not: null },
      onboardingCompletedAt: null,
      createdAt: { gte: oldCutoff, lte: graceCutoff },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${candidates.length} Sarayu-case candidate(s):`);
  for (const u of candidates) {
    const prior = await p.trialReengagement.findFirst({
      where: { userId: u.id, emailType: "registration_stall" },
      select: { id: true, sentAt: true },
    });
    const priorTag = prior ? ` [ALREADY SENT ${prior.sentAt.toISOString()}]` : "";
    console.log(
      `  - ${u.email} (${u.firstName ?? "no-name"}) createdAt=${u.createdAt.toISOString()} verified=${u.emailVerified?.toISOString()}${priorTag}`
    );
  }
} finally {
  await p.$disconnect();
}
