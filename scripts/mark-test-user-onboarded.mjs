#!/usr/bin/env node
// One-off: mark the functional-test user as onboarded so the dashboard
// layout stops redirecting them to /onboarding in Playwright.
//
// Root cause: /api/test/auth was creating the test user without
// `onboardingCompletedAt` set. The dashboard layout checks that
// server-side and redirects on null. Permanent fix is in the next
// /api/test/auth commit; this script fixes the already-existing test
// user so we can deploy that commit with green tests.

import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const TEST_EMAIL = "functional-test-runner@test.studentnest.ai";

const user = await prisma.user.findUnique({
  where: { email: TEST_EMAIL },
  select: { id: true, onboardingCompletedAt: true, track: true },
});
if (!user) {
  console.log(`Test user ${TEST_EMAIL} not found — nothing to do`);
  process.exit(0);
}
console.log(`Before: onboardingCompletedAt=${user.onboardingCompletedAt}, track=${user.track}`);
if (user.onboardingCompletedAt) {
  console.log("Already onboarded — nothing to do");
  process.exit(0);
}
await prisma.user.update({
  where: { id: user.id },
  data: { onboardingCompletedAt: new Date() },
});
console.log(`✅ Marked ${TEST_EMAIL} as onboarded (now)`);
