#!/usr/bin/env node
// Diagnose state of the E2E test user we just tried to create.
// Read-only — does not modify any data.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const email = "murprasad+e2e-test1@gmail.com";

const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    subscriptionTier: true,
    emailVerified: true,
    createdAt: true,
    passwordHash: true,
    track: true,
    onboardingCompletedAt: true,
  },
});

if (!user) {
  console.log(`❌ No user found with email "${email}".`);
  console.log(`   This means the registration POST never succeeded.`);
  console.log(`   Likely causes:`);
  console.log(`     1. Form submission errored (check browser devtools network tab)`);
  console.log(`     2. POST /api/auth/register returned 4xx/5xx`);
  console.log(`     3. Form validation rejected before submit`);
  process.exit(0);
}

console.log(`✅ User found:\n`);
console.log(`   id:                    ${user.id}`);
console.log(`   email:                 ${user.email}`);
console.log(`   name:                  ${user.firstName ?? "(none)"} ${user.lastName ?? "(none)"}`);
console.log(`   role:                  ${user.role}`);
console.log(`   subscriptionTier:        ${user.subscriptionTier}`);
console.log(`   track:                   ${user.track ?? "(none)"}`);
console.log(`   emailVerified:           ${user.emailVerified ? user.emailVerified.toISOString() : "❌ NOT VERIFIED"}`);
console.log(`   onboardingCompletedAt: ${user.onboardingCompletedAt?.toISOString() ?? "(not done)"}`);
console.log(`   createdAt:             ${user.createdAt.toISOString()}`);
console.log(`   has passwordHash:        ${!!user.passwordHash} ${user.passwordHash ? "(can sign in with credentials)" : "(Google OAuth user — no password)"}`);

if (!user.emailVerified) {
  console.log(`\n⚠️  Account exists but email not verified. NextAuth credentials provider`);
  console.log(`   may reject sign-in. In production, EMAIL_SERVER_USER may be set, requiring`);
  console.log(`   the user to click the verification link before signing in.`);
}
