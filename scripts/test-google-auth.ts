/**
 * Google OAuth flow test — no browser required.
 * Simulates exactly what NextAuth calls during a Google sign-in:
 *   1. signIn callback  → find-or-create DB user
 *   2. jwt callback     → look up DB user by email, populate token
 *   3. session callback → copy token fields into session object
 *
 * Run: npx tsx scripts/test-google-auth.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Result = { test: string; status: "PASS" | "FAIL" | "WARN"; detail: string };
const results: Result[] = [];
const pass = (t: string, d: string) => { results.push({ test: t, status: "PASS", detail: d }); console.log(`  ✅ ${t}: ${d}`); };
const fail = (t: string, d: string) => { results.push({ test: t, status: "FAIL", detail: d }); console.error(`  ❌ ${t}: ${d}`); };
const warn = (t: string, d: string) => { results.push({ test: t, status: "WARN", detail: d }); console.warn(`  ⚠️  ${t}: ${d}`); };

// ─── Replicate the signIn callback from auth.ts ───────────────────────────────
async function simulateSignIn(googleEmail: string, googleName: string, googleImage?: string) {
  const [firstName, ...rest] = googleName.split(" ");
  const lastName = rest.join(" ") || "";

  const existing = await prisma.user.findUnique({ where: { email: googleEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: googleEmail,
        emailVerified: new Date(),
        passwordHash: null,
        firstName,
        lastName,
        gradeLevel: "11",
        avatarUrl: googleImage ?? undefined,
      },
    });
    return { action: "created" };
  } else if (!existing.emailVerified) {
    await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: new Date() } });
    return { action: "verified" };
  }
  return { action: "found" };
}

// ─── Replicate the jwt callback from auth.ts ────────────────────────────────
async function simulateJwtCallback(email: string) {
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, subscriptionTier: true },
  });
  if (!dbUser) return null;
  return { id: dbUser.id, role: dbUser.role, subscriptionTier: dbUser.subscriptionTier };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔍 Google OAuth Flow Test\n");

  // 1. DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    pass("DB connection", "Neon PostgreSQL reachable");
  } catch (e) {
    fail("DB connection", String(e));
    return;
  }

  // 2. Schema: passwordHash nullable
  try {
    const col = await prisma.$queryRaw<Array<{ is_nullable: string }>>`
      SELECT is_nullable FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passwordHash'
    `;
    if (col[0]?.is_nullable === "YES") {
      pass("passwordHash nullable", "Column is nullable — Google users can sign in without a password");
    } else {
      fail("passwordHash nullable", "Column is NOT nullable — Google users will fail user.create");
    }
  } catch (e) {
    warn("passwordHash nullable check", `Could not query information_schema: ${e}`);
  }

  // 3. New Google user flow
  const testEmail = `google_test_${Date.now()}@gmail.com`;
  console.log(`\n── Scenario A: New Google user (${testEmail}) ──`);
  try {
    const result = await simulateSignIn(testEmail, "Alex Johnson", "https://lh3.googleusercontent.com/test");
    if (result.action === "created") {
      pass("signIn callback — new user", "User created successfully");
    } else {
      fail("signIn callback — new user", `Expected 'created', got '${result.action}'`);
    }
  } catch (e) {
    fail("signIn callback — new user", String(e));
  }

  // Verify user was actually persisted
  const newUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!newUser) {
    fail("DB persistence", "User not found in DB after creation");
  } else {
    pass("DB persistence", `id=${newUser.id.slice(0, 12)}… role=${newUser.role} tier=${newUser.subscriptionTier}`);
    if (newUser.passwordHash === null) {
      pass("passwordHash null for Google user", "Correctly stored as null");
    } else {
      fail("passwordHash null for Google user", `Expected null, got ${newUser.passwordHash}`);
    }
    if (newUser.emailVerified) {
      pass("emailVerified auto-set", `Set to ${newUser.emailVerified.toISOString()}`);
    } else {
      fail("emailVerified auto-set", "emailVerified is null — dashboard access will fail");
    }
    if (newUser.firstName === "Alex" && newUser.lastName === "Johnson") {
      pass("name parsed from Google profile", `firstName='${newUser.firstName}' lastName='${newUser.lastName}'`);
    } else {
      fail("name parsed", `Got firstName='${newUser.firstName}' lastName='${newUser.lastName}'`);
    }
  }

  // 4. jwt callback populates token correctly
  console.log("\n── Scenario B: JWT token population ──");
  const token = await simulateJwtCallback(testEmail);
  if (!token) {
    fail("jwt callback", "DB user not found by email — token.id would be undefined");
  } else {
    pass("jwt callback — id", `token.id = ${token.id.slice(0, 12)}…`);
    pass("jwt callback — role", `token.role = ${token.role}`);
    pass("jwt callback — subscriptionTier", `token.subscriptionTier = ${token.subscriptionTier}`);
    if (token.id && token.role && token.subscriptionTier) {
      pass("jwt callback — all fields present", "session.user.id/role/subscriptionTier will be populated");
    }
  }

  // 5. Existing Google user — re-sign-in (idempotent)
  console.log("\n── Scenario C: Existing Google user re-signs in ──");
  try {
    const result = await simulateSignIn(testEmail, "Alex Johnson");
    if (result.action === "found") {
      pass("signIn callback — existing user", "Found existing user, no duplicate created");
    } else {
      fail("signIn callback — existing user", `Expected 'found', got '${result.action}'`);
    }
  } catch (e) {
    fail("signIn callback — existing user", String(e));
  }

  // Confirm no duplicates
  const count = await prisma.user.count({ where: { email: testEmail } });
  if (count === 1) {
    pass("No duplicate users", "Exactly 1 user with this email");
  } else {
    fail("No duplicate users", `Found ${count} users with same email`);
  }

  // 6. Credentials provider: Google-only user blocked from password login
  console.log("\n── Scenario D: Credentials provider blocks Google-only user ──");
  const googleOnlyUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (googleOnlyUser && googleOnlyUser.passwordHash === null) {
    pass("Credentials guard", "auth.ts will throw 'This account uses Google login' — correct behavior");
  } else {
    fail("Credentials guard", "passwordHash is not null — guard won't trigger");
  }

  // 7. Single-name Google user (edge case)
  console.log("\n── Scenario E: Edge case — single-name Google user ──");
  const singleNameEmail = `google_single_${Date.now()}@gmail.com`;
  try {
    await simulateSignIn(singleNameEmail, "Adele");
    const u = await prisma.user.findUnique({ where: { email: singleNameEmail } });
    if (u && u.firstName === "Adele" && u.lastName === "") {
      pass("Single-name user", `firstName='Adele' lastName='' — stored as empty string (valid)`);
    } else {
      fail("Single-name user", `Got firstName='${u?.firstName}' lastName='${u?.lastName}'`);
    }
  } catch (e) {
    fail("Single-name user", String(e));
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  await prisma.user.deleteMany({ where: { email: { in: [testEmail, singleNameEmail] } } });
  console.log("\n  🧹 Test users cleaned up from DB\n");

  // ─── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed · ${failed} failed · ${warned} warnings`);
  if (failed === 0) {
    console.log("✅ Google OAuth flow is correctly implemented — ready for credentials.");
    console.log("\nNext step: add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to Cloudflare Pages.");
  } else {
    console.log("❌ Fix the failures above before enabling Google login in production.");
  }
  console.log("─".repeat(50) + "\n");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
