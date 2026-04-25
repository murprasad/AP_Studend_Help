#!/usr/bin/env node
/**
 * verify-allaccess.mjs — Verifies the Beta 7.1 entitlement fix end-to-end.
 *
 * Flow:
 *   1. Pre-seed ModuleSubscription{module:"ap", status:"active"} for the
 *      functional-test-runner user (via direct Prisma).
 *   2. Hit POST /api/test/auth?action=create — server reads fresh
 *      moduleSubs from DB and forges a NextAuth JWT with the AP entitlement.
 *   3. Use that JWT (as the production session cookie) to POST /api/practice
 *      with course=ACT_MATH (a non-AP course).
 *   4. Expect 200 + sessionId — proves a single-module purchase grants
 *      practice access to all modules.
 *   5. Cleanup the test session + ModuleSubscription.
 *
 * Pre-Beta-7.1 (deploy17): would 429 with limitExceeded after 20 questions
 *   because hasModulePremium(subs, "act") was false.
 * Post-Beta-7.1: 200 because hasAnyPremium(subs) is now used.
 *
 * Touches only the test-runner user. Read-only for real production data.
 */

import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const APP_URL = process.argv[2] ?? process.env.NEXTAUTH_URL ?? "https://studentnest.ai";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("Missing CRON_SECRET in .env");
  process.exit(1);
}

const prisma = makePrisma();
const log = (label, val) => console.log(`  ${label.padEnd(36)} ${val}`);

async function main() {
  console.log("\n🔍 verify-allaccess — Beta 7.1 entitlement probe\n");
  log("Target", APP_URL);

  // Step 1: ensure test user exists (no JWT yet — moduleSubs will be empty
  //         in the response if we call this before seeding the sub).
  let createRes = await fetch(`${APP_URL}/api/test/auth`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create" }),
  });
  if (!createRes.ok) {
    console.error(`❌ /api/test/auth?action=create — HTTP ${createRes.status}`);
    process.exit(1);
  }
  const initial = await createRes.json();
  const userId = initial.userId;
  log("Test user", `${userId} (${initial.email})`);

  // Step 2: seed AP-only ModuleSubscription
  await prisma.moduleSubscription.deleteMany({ where: { userId } });
  await prisma.moduleSubscription.create({
    data: { userId, module: "ap", status: "active" },
  });
  log("ModuleSubscription seeded", `userId=${userId} module=ap status=active`);

  // Step 3: re-call /api/test/auth?action=create — server now reads fresh
  //         moduleSubs from DB and bakes them into the JWT.
  createRes = await fetch(`${APP_URL}/api/test/auth`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create" }),
  });
  if (!createRes.ok) {
    console.error(`❌ second create — HTTP ${createRes.status}`);
    process.exit(1);
  }
  const { sessionToken, cookieName } = await createRes.json();
  log("JWT cookie", `${cookieName}=...${sessionToken.slice(-12)}`);

  // Step 4: probe /api/practice with course=ACT_MATH (the all-access test)
  console.log("\n── Probe: POST /api/practice course=ACT_MATH ──");
  const probeRes = await fetch(`${APP_URL}/api/practice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${cookieName}=${sessionToken}`,
    },
    body: JSON.stringify({
      sessionType: "QUICK_PRACTICE",
      unit: "ALL",
      difficulty: "ALL",
      questionCount: 1,
      course: "ACT_MATH",
    }),
  });
  const probeBody = await probeRes.json().catch(() => ({}));
  log("Status", probeRes.status);
  log("limitExceeded?", probeBody.limitExceeded ?? false);
  log("Error?", probeBody.error ?? "none");
  if (probeBody.sessionId) log("sessionId", probeBody.sessionId);

  // Cleanup probe session if created
  if (probeBody.sessionId) {
    try {
      await prisma.studentResponse.deleteMany({ where: { sessionId: probeBody.sessionId } });
      await prisma.practiceSession.delete({ where: { id: probeBody.sessionId } });
    } catch { /* non-fatal */ }
  }

  // Cleanup ModuleSubscription so we don't leave the test user looking Premium
  await prisma.moduleSubscription.deleteMany({ where: { userId } });

  // Verdict
  console.log("");
  const passed = probeRes.status === 200 && !probeBody.limitExceeded;
  if (passed) {
    console.log("✅ PASS — Premium-AP user can start ACT practice (Beta 7.1 all-access works)");
    process.exit(0);
  } else {
    console.log("❌ FAIL — gating still blocks cross-module practice");
    console.log("    Expected: 200 + sessionId");
    console.log(`    Got:      ${probeRes.status} + ${JSON.stringify(probeBody).slice(0, 200)}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("verify-allaccess fatal:", e);
  process.exit(2);
});
