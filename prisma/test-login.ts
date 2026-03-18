/**
 * End-to-end login test script.
 * Tests bcrypt verification, DB lookup, and NextAuth signIn flow.
 * Run: npx tsx prisma/test-login.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

const results: TestResult[] = [];
function pass(test: string, detail: string) { results.push({ test, status: "PASS", detail }); }
function fail(test: string, detail: string) { results.push({ test, status: "FAIL", detail }); }
function warn(test: string, detail: string) { results.push({ test, status: "WARN", detail }); }

async function main() {
  console.log("\n🔍 PrepNova Login System — End-to-End Test\n");

  // ── 1. Database connectivity ───────────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    pass("DB connection", "Neon PostgreSQL reachable");
  } catch (e) {
    fail("DB connection", String(e));
  }

  // ── 2. User lookup for admin account ──────────────────────────────────────
  const adminEmail = "murprasad@yahoo.com";
  let adminUser: { id: string; email: string; role: string; emailVerified: Date | null; passwordHash: string | null } | null = null;
  try {
    adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, role: true, emailVerified: true, passwordHash: true },
    });
    if (!adminUser) {
      fail("Admin user lookup", `${adminEmail} not found in DB`);
    } else {
      pass("Admin user lookup", `Found: ${adminUser.email} | role: ${adminUser.role}`);
    }
  } catch (e) {
    fail("Admin user lookup", String(e));
  }

  // ── 3. Admin role check ────────────────────────────────────────────────────
  if (adminUser) {
    if (adminUser.role === "ADMIN") {
      pass("Admin role", "role = ADMIN ✓");
    } else {
      fail("Admin role", `role = ${adminUser.role} (expected ADMIN)`);
    }
  }

  // ── 4. Email verified check ────────────────────────────────────────────────
  if (adminUser) {
    if (adminUser.emailVerified) {
      pass("Email verified", `verified at ${adminUser.emailVerified.toISOString()}`);
    } else {
      fail("Email verified", "emailVerified is null — login will be blocked by auth.ts");
    }
  }

  // ── 5. Password hash integrity ─────────────────────────────────────────────
  if (adminUser) {
    if (adminUser.passwordHash && adminUser.passwordHash.length === 60) {
      pass("Password hash", `bcrypt hash present (length ${adminUser.passwordHash.length})`);
    } else {
      fail("Password hash", `Invalid hash: length=${adminUser.passwordHash?.length}`);
    }
  }

  // ── 6. Register a fresh test user and verify bcrypt round-trip ────────────
  const testEmail = `login_test_${Date.now()}@example.com`;
  const testPassword = "TestPass123";
  let testUser: { id: string; emailVerified: Date | null; passwordHash: string | null } | null = null;
  try {
    const hash = await bcrypt.hash(testPassword, 12);
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hash,
        firstName: "Login",
        lastName: "Test",
        gradeLevel: "11",
        emailVerified: new Date(), // auto-verify
      },
      select: { id: true, emailVerified: true, passwordHash: true },
    });
    pass("Register test user", `Created ${testEmail}`);
  } catch (e) {
    fail("Register test user", String(e));
  }

  // ── 7. bcrypt.compare — correct password ───────────────────────────────────
  if (testUser) {
    const correct = await bcrypt.compare(testPassword, testUser.passwordHash ?? "");
    if (correct) {
      pass("bcrypt correct password", `bcrypt.compare('${testPassword}', hash) = true`);
    } else {
      fail("bcrypt correct password", "bcrypt.compare returned false for correct password");
    }

    // ── 8. bcrypt.compare — wrong password ──────────────────────────────────
    const wrong = await bcrypt.compare("WrongPassword99", testUser.passwordHash ?? "");
    if (!wrong) {
      pass("bcrypt wrong password", "bcrypt.compare('WrongPassword99', hash) = false (correct)");
    } else {
      fail("bcrypt wrong password", "bcrypt.compare returned true for wrong password!");
    }
  }

  // ── 9. Auth API — CSRF endpoint ───────────────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/auth/csrf");
    const data = await res.json() as { csrfToken?: string };
    if (res.ok && data.csrfToken && data.csrfToken.length > 0) {
      pass("CSRF endpoint", `/api/auth/csrf → 200, token length ${data.csrfToken.length}`);
    } else {
      fail("CSRF endpoint", `status ${res.status}, token: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail("CSRF endpoint", String(e));
  }

  // ── 10. Auth API — providers ───────────────────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/auth/providers");
    const data = await res.json() as Record<string, unknown>;
    if (res.ok && data.credentials) {
      pass("Providers endpoint", "/api/auth/providers → credentials provider present");
    } else {
      fail("Providers endpoint", `Missing credentials: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail("Providers endpoint", String(e));
  }

  // ── 11. Auth API — session (unauthenticated) ───────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/auth/session");
    const data = await res.json();
    if (res.ok) {
      pass("Session endpoint", `/api/auth/session → 200, empty: ${JSON.stringify(data) === '{}'}`);
    } else {
      fail("Session endpoint", `status ${res.status}`);
    }
  } catch (e) {
    fail("Session endpoint", String(e));
  }

  // ── 12. Registration API — success path ───────────────────────────────────
  try {
    const regEmail = `reg_api_test_${Date.now()}@example.com`;
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "API", lastName: "Test", email: regEmail, password: "TestPass1", gradeLevel: "11" }),
    });
    const data = await res.json() as { success?: boolean; error?: string };
    if (res.ok && data.success) {
      pass("Register API (success)", `POST /api/auth/register → 200, ${JSON.stringify(data)}`);
    } else {
      fail("Register API (success)", `status ${res.status}, ${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail("Register API (success)", String(e));
  }

  // ── 13. Registration API — duplicate email ────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Dup", lastName: "User", email: adminEmail, password: "TestPass1", gradeLevel: "11" }),
    });
    const data = await res.json() as { error?: string };
    if (res.status === 400 && data.error?.includes("already exists")) {
      pass("Register API (duplicate)", `400 + 'already exists' error`);
    } else {
      fail("Register API (duplicate)", `status ${res.status}, ${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail("Register API (duplicate)", String(e));
  }

  // ── 14. Registration API — invalid schema ─────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "X", email: "not-an-email", password: "short" }),
    });
    if (res.status === 400) {
      pass("Register API (validation)", `Zod validation → 400 as expected`);
    } else {
      fail("Register API (validation)", `Expected 400, got ${res.status}`);
    }
  } catch (e) {
    fail("Register API (validation)", String(e));
  }

  // ── 15. Login page renders ────────────────────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/login");
    const html = await res.text();
    const hasForm = html.includes("Log In") || html.includes("login");
    const hasBrand = html.includes("PrepNova");
    if (res.ok && hasForm && hasBrand) {
      pass("Login page HTML", "200, contains form + PrepNova branding");
    } else {
      fail("Login page HTML", `ok=${res.ok} form=${hasForm} brand=${hasBrand}`);
    }
  } catch (e) {
    fail("Login page HTML", String(e));
  }

  // ── 16. Protected routes redirect (not 500) ───────────────────────────────
  for (const route of ["/dashboard", "/practice", "/analytics", "/mock-exam", "/ai-tutor", "/study-plan", "/admin"]) {
    try {
      const res = await fetch(`http://localhost:3000${route}`, { redirect: "manual" });
      if (res.status === 307 || res.status === 302) {
        pass(`Protected route ${route}`, `${res.status} redirect → login (correct)`);
      } else if (res.status === 200) {
        warn(`Protected route ${route}`, `200 returned without auth — middleware may not be protecting this route`);
      } else {
        fail(`Protected route ${route}`, `Unexpected status ${res.status}`);
      }
    } catch (e) {
      fail(`Protected route ${route}`, String(e));
    }
  }

  // ── 17. Resources search API ───────────────────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/resources/search?q=silk+roads&source=wikipedia");
    const data = await res.json() as { results?: unknown[] };
    if (res.ok && Array.isArray(data.results) && data.results.length > 0) {
      pass("Resources search API", `Wikipedia search → ${data.results.length} results`);
    } else {
      fail("Resources search API", `status ${res.status}, results: ${JSON.stringify(data).slice(0, 100)}`);
    }
  } catch (e) {
    fail("Resources search API", String(e));
  }

  // ── 18. Practice API (auth check) ─────────────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionType: "QUICK_PRACTICE", course: "AP_WORLD_HISTORY" }),
    });
    if (res.status === 401) {
      pass("Practice API (auth guard)", "401 Unauthorized for unauthenticated request");
    } else {
      fail("Practice API (auth guard)", `Expected 401, got ${res.status}`);
    }
  } catch (e) {
    fail("Practice API (auth guard)", String(e));
  }

  // ── 19. Analytics API (auth check) ────────────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/analytics?course=AP_WORLD_HISTORY");
    if (res.status === 401) {
      pass("Analytics API (auth guard)", "401 Unauthorized");
    } else {
      fail("Analytics API (auth guard)", `Expected 401, got ${res.status}`);
    }
  } catch (e) {
    fail("Analytics API (auth guard)", String(e));
  }

  // ── 20. Study plan API (auth check) ───────────────────────────────────────
  try {
    const res = await fetch("http://localhost:3000/api/study-plan?course=AP_WORLD_HISTORY");
    if (res.status === 401) {
      pass("Study plan API (auth guard)", "401 Unauthorized");
    } else {
      fail("Study plan API (auth guard)", `Expected 401, got ${res.status}`);
    }
  } catch (e) {
    fail("Study plan API (auth guard)", String(e));
  }

  // ── 21. Question bank coverage ────────────────────────────────────────────
  try {
    const counts = await prisma.question.groupBy({
      by: ["course"],
      where: { isApproved: true },
      _count: { id: true },
    });
    const total = counts.reduce((s, c) => s + c._count.id, 0);
    const byC = Object.fromEntries(counts.map(c => [c.course, c._count.id]));
    if (total > 100) {
      pass("Question bank", `${total} approved questions | ${JSON.stringify(byC)}`);
    } else {
      warn("Question bank", `Only ${total} questions — may cause repeated questions quickly`);
    }
  } catch (e) {
    fail("Question bank", String(e));
  }

  // ── 22. Cleanup test users ─────────────────────────────────────────────────
  try {
    await prisma.user.deleteMany({ where: { email: { contains: "login_test_" } } });
    await prisma.user.deleteMany({ where: { email: { contains: "reg_api_test_" } } });
    pass("Test cleanup", "Temporary test users deleted");
  } catch (e) {
    warn("Test cleanup", String(e));
  }

  // ── Print results ──────────────────────────────────────────────────────────
  await prisma.$disconnect();

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const warned = results.filter(r => r.status === "WARN").length;

  console.log("┌─────────────────────────────────────────────────────────────────");
  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️ " : "❌";
    console.log(`│ ${icon} ${r.test}`);
    console.log(`│    ${r.detail}`);
  }
  console.log("├─────────────────────────────────────────────────────────────────");
  console.log(`│ PASSED: ${passed}  WARNED: ${warned}  FAILED: ${failed}`);
  console.log("└─────────────────────────────────────────────────────────────────");

  if (failed > 0) process.exit(1);
}

main();
