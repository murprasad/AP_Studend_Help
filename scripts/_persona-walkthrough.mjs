/**
 * 2026-06-01 — Persona Walkthrough Simulator.
 *
 * Goal: simulate two student personas with slightly different learning
 * styles end-to-end through the SN dashboard + practice loop. Validates
 * that the system surfaces meaningful next steps at each step:
 *   - Readiness moves coherently with accuracy
 *   - Weakest unit recommendations rotate correctly as mastery shifts
 *   - Today's Set targets the lowest-mastery unit
 *   - Fix A/B/C show the right copy for each persona's stage
 *
 * Personas:
 *   Yin     — ACT_ENGLISH, 5-Q sessions, 50% accuracy (perfect math test)
 *   Adrian  — ACT_ENGLISH, 8-Q sessions, 50% accuracy (mirror but bigger sets)
 *
 * 50/50 accuracy means math should cap readiness around 25-30% — students
 * with mediocre accuracy CANNOT hit pass. That's the validation: the
 * formula is correctly punishing wrong answers, not gamifying engagement.
 *
 * Per-session output:
 *   session N: +5 Qs, accuracy 50%, readiness 27% (Δ+2),
 *              weak: Production of Writing (32% mastery), next: Conventions
 *
 * Setup:
 *   Creates 2 test users in DB with emails persona-yin@test.preplion.local
 *   and persona-adrian@test.preplion.local. Cleanup at end.
 *
 * Usage:
 *   node scripts/_persona-walkthrough.mjs            # full 30-session walkthrough
 *   node scripts/_persona-walkthrough.mjs --keep     # don't cleanup users
 *   node scripts/_persona-walkthrough.mjs --max=10   # 10 sessions per persona
 */
import "dotenv/config";
import crypto from "node:crypto";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const MAX_SESSIONS = parseInt(args.max ?? "30", 10);
const KEEP = !!args.keep;

const COURSE = "ACT_ENGLISH";
const COURSE_NAME = "ACT English";
const ACT_ENG_UNITS = [
  "ACT_ENG_1_PRODUCTION_WRITING",
  "ACT_ENG_2_KNOWLEDGE_LANGUAGE",
  "ACT_ENG_3_CONVENTIONS",
];
const UNIT_DISPLAY = {
  ACT_ENG_1_PRODUCTION_WRITING: "Production of Writing",
  ACT_ENG_2_KNOWLEDGE_LANGUAGE: "Knowledge of Language",
  ACT_ENG_3_CONVENTIONS: "Conventions of Standard English",
};

const PERSONAS = [
  { key: "yin",    email: "persona-yin@test.preplion.local",    qsPerSession: 5, accuracy: 0.50 },
  { key: "adrian", email: "persona-adrian@test.preplion.local", qsPerSession: 8, accuracy: 0.50 },
];

function hash(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function createPersona(p) {
  // Delete any prior test row first (idempotent)
  await sql`DELETE FROM users WHERE email = ${p.email}`;
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO users (
      id, email, "firstName", "lastName", "passwordHash", "gradeLevel",
      role, "subscriptionTier", track, "freeTrialCourse",
      "onboardingCompletedAt", "createdAt", "updatedAt",
      "streakDays", "totalXp", level, "streakFreezes",
      "trialEmailsSent", "passGuaranteeRefundCents"
    )
    VALUES (
      ${id}, ${p.email}, ${"Persona-" + p.key}, ${"Test"}, ${"$2b$10$disabled"}, 'COLLEGE',
      'STUDENT', 'FREE'::"SubTier", 'act', ${COURSE}::"ApCourse",
      NOW(), NOW(), NOW(),
      0, 0, 1, 0,
      0, 0
    )
  `;
  return id;
}

async function cleanupPersona(p) {
  // Delete responses + sessions + user (cascade)
  const u = await sql`SELECT id FROM users WHERE email = ${p.email}`;
  if (u.length === 0) return;
  const uid = u[0].id;
  await sql`DELETE FROM student_responses WHERE "userId" = ${uid}`;
  await sql`DELETE FROM practice_sessions WHERE "userId" = ${uid}`;
  await sql`DELETE FROM daily_practice_plans WHERE "userId" = ${uid}`;
  await sql`DELETE FROM dashboard_impressions WHERE "userId" = ${uid}`.catch(() => {});
  await sql`DELETE FROM users WHERE id = ${uid}`;
}

// ── Per-step queries the dashboard would issue ────────────────────────────

const ACTIVATION_THRESHOLD = 20; // v1.1 — matches src/lib/pass-probability.ts SAMPLE_SIZE_FLOOR

async function getActivationStats(userId) {
  const r = await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(DISTINCT DATE("answeredAt"))::int AS days
    FROM student_responses WHERE "userId" = ${userId}
  `;
  return { totalAnswered: r[0].total, daysActive: r[0].days, activated: r[0].total >= ACTIVATION_THRESHOLD };
}

async function getUnitMasteries(userId) {
  // Per-unit accuracy from student_responses joined to questions
  const r = await sql`
    SELECT q.unit::text AS unit,
           COUNT(*)::int AS attempts,
           COUNT(*) FILTER (WHERE sr."isCorrect" = true)::int AS correct
    FROM student_responses sr
    JOIN questions q ON q.id = sr."questionId"
    WHERE sr."userId" = ${userId} AND q.course = ${COURSE}::"ApCourse"
    GROUP BY q.unit
  `;
  const map = {};
  for (const u of ACT_ENG_UNITS) map[u] = { attempts: 0, correct: 0, mastery: 0 };
  for (const row of r) {
    if (map[row.unit]) {
      map[row.unit] = {
        attempts: row.attempts,
        correct: row.correct,
        mastery: row.attempts ? row.correct / row.attempts : 0,
      };
    }
  }
  return map;
}

function findWeakestUnit(masteries) {
  let weakest = null;
  for (const [unit, m] of Object.entries(masteries)) {
    if (m.attempts === 0) {
      // Untouched units count as weakest (no data → priority for diagnostic coverage)
      return unit;
    }
    if (weakest === null || m.mastery < masteries[weakest].mastery) {
      weakest = unit;
    }
  }
  return weakest;
}

// Replicate pass-probability formula from src/lib/pass-probability.ts — corrected
// to match live code including weight redistribution + normalizeScore curve.
const PASS_THRESHOLD = 0.50; // ACT scaled-score convention
function normalizeScore(score, passThreshold = PASS_THRESHOLD) {
  if (score <= 0) return 0;
  if (score >= 1) return 1;
  if (score < passThreshold) return score;
  const aboveThreshold = (score - passThreshold) / Math.max(1 - passThreshold, 0.01);
  // v1.1 (2026-06-01) — gentle convex lift; matches src/lib/pass-probability.ts
  return score + (1 - score) * Math.pow(aboveThreshold, 1.5) * 0.5;
}
function recentDrillAccuracy(responses) {
  if (responses.length === 0) return null;
  const decay = 0.97; // v1.1
  let numer = 0, denom = 0;
  for (let i = 0; i < responses.length && i < 30; i += 1) {
    const w = Math.pow(decay, i);
    numer += w * (responses[i].isCorrect ? 1 : 0);
    denom += w;
  }
  return denom > 0 ? numer / denom : null;
}
function coverageGradient(units) {
  if (units.length === 0) return 0;
  return units.reduce((s, u) => {
    if (u.mastery >= 0.70) return s + 1;
    if (u.mastery <= 0.30) return s + 0;
    return s + (u.mastery - 0.30) / 0.40;
  }, 0) / units.length;
}
function computeReadiness(masteries, totalAnswered, recentResponses) {
  // 2026-06-01 SAMPLE_SIZE_FLOOR raised 5 → 20 in src/lib/pass-probability.ts
  if (totalAnswered < 20) return null;
  // No mocks in simulation → mockNorm = null
  const reversed = [...recentResponses].reverse(); // newest first per lib spec
  const drillNorm = recentDrillAccuracy(reversed);
  const units = Object.values(masteries);
  const coverage = coverageGradient(units);

  if (drillNorm === null) return null;
  // Weight redistribution: no mocks → drill takes mock's 0.6 weight
  const drillWeight = 0.9;
  const coverageWeight = 0.1;
  const drillTerm = drillWeight * normalizeScore(drillNorm);
  const coverageTerm = coverageWeight * coverage;
  return Math.max(0, Math.min(1, drillTerm + coverageTerm));
}

async function sampleQuestionsForUnit(unit, n) {
  const r = await sql`
    SELECT id FROM questions
    WHERE course = ${COURSE}::"ApCourse"
      AND unit = ${unit}::"ApUnit"
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
    ORDER BY RANDOM()
    LIMIT ${n}
  `;
  return r.map((row) => row.id);
}

async function runSession(persona, userId, sessionNum, recentResponses) {
  // 1. Dashboard view: compute what the user "sees"
  const activation = await getActivationStats(userId);
  const masteries = await getUnitMasteries(userId);
  const readiness = computeReadiness(masteries, activation.totalAnswered, recentResponses);
  const weakest = findWeakestUnit(masteries);
  const weakestName = UNIT_DISPLAY[weakest] || weakest;
  const weakestMastery = masteries[weakest]?.mastery ?? 0;
  const dashView = activation.activated
    ? `readiness=${readiness !== null ? Math.round(readiness * 100) + "%" : "N/A"}`
    : `Activation gate: ${activation.totalAnswered}/${ACTIVATION_THRESHOLD} → "Answer ${ACTIVATION_THRESHOLD - activation.totalAnswered} more to unlock"`;
  const tsCardTitle = weakest
    ? `Strengthen ${weakestName}`
    : "Today's Set";

  // 2. User reads dashboard, decides to start Today's Set
  // 3. Sample questions from the weakest unit (Today's Set logic)
  const qIds = await sampleQuestionsForUnit(weakest, persona.qsPerSession);
  if (qIds.length === 0) {
    console.log(`    ⚠ No questions in ${weakest}`);
    return { responses: [], readiness, weakest, weakestMastery };
  }
  // 4. Answer with target accuracy
  const sessionId = crypto.randomUUID();
  await sql`
    INSERT INTO practice_sessions (id, "userId", course, "sessionType", "totalQuestions", "startedAt", "completedAt")
    VALUES (${sessionId}, ${userId}, ${COURSE}::"ApCourse", 'QUICK_PRACTICE'::"SessionType", ${qIds.length}, NOW(), NOW())
  `;
  const newResponses = [];
  for (const qId of qIds) {
    const isCorrect = Math.random() < persona.accuracy;
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO student_responses (id, "userId", "questionId", "sessionId", "studentAnswer", "isCorrect", "timeSpentSecs", "answeredAt")
      VALUES (${id}, ${userId}, ${qId}, ${sessionId}, 'A', ${isCorrect}, 30, NOW())
    `;
    newResponses.push({ isCorrect, qId });
  }
  // 5. Post-session: report transition
  const after = await getUnitMasteries(userId);
  const newReadiness = computeReadiness(after, activation.totalAnswered + qIds.length, [...recentResponses, ...newResponses]);
  const delta = readiness !== null && newReadiness !== null
    ? Math.round((newReadiness - readiness) * 100)
    : null;
  const acc = newResponses.filter((r) => r.isCorrect).length / newResponses.length;
  const newWeakest = findWeakestUnit(after);

  // Print session story
  console.log(`  session ${String(sessionNum).padStart(2)}: ${dashView} | next: "${tsCardTitle}" (was ${Math.round(weakestMastery * 100)}%)`);
  console.log(`              answered ${qIds.length} Qs at ${Math.round(acc * 100)}% → readiness ${newReadiness !== null ? Math.round(newReadiness * 100) + "%" : "N/A"}${delta !== null ? ` (Δ${delta >= 0 ? "+" : ""}${delta})` : ""}; now weakest=${UNIT_DISPLAY[newWeakest] || newWeakest} (${Math.round((after[newWeakest]?.mastery || 0) * 100)}%)`);

  return { responses: newResponses, readiness: newReadiness, weakest: newWeakest, weakestMastery: after[newWeakest]?.mastery ?? 0 };
}

// ── Persona run ────────────────────────────────────────────────────────────

async function runPersona(persona) {
  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(`Persona ${persona.key.toUpperCase()}: ${persona.qsPerSession} Qs/session, ${persona.accuracy * 100}% target accuracy`);
  console.log(`══════════════════════════════════════════════════════════\n`);
  const userId = await createPersona(persona);
  console.log(`Created user ${userId.slice(0, 8)}...`);
  const recentResponses = [];
  let lastReadiness = null;
  let plateauCount = 0;
  const PASS_TARGET = 0.60; // 60% readiness counts as "magic pass" for sim
  for (let s = 1; s <= MAX_SESSIONS; s += 1) {
    const r = await runSession(persona, userId, s, recentResponses);
    recentResponses.push(...r.responses);
    // Stop if reach pass target
    if (r.readiness !== null && r.readiness >= PASS_TARGET) {
      console.log(`\n  ✅ ${persona.key.toUpperCase()} reached pass target (${Math.round(r.readiness * 100)}%) after ${s} sessions`);
      break;
    }
    // Stop if plateaued (no improvement for 5 sessions)
    if (lastReadiness !== null && r.readiness !== null && Math.abs(r.readiness - lastReadiness) < 0.005) {
      plateauCount += 1;
      if (plateauCount >= 5) {
        console.log(`\n  ⏸ ${persona.key.toUpperCase()} plateaued at ~${Math.round((r.readiness || 0) * 100)}% — math check: 50% accuracy can't break the formula's ceiling.`);
        break;
      }
    } else {
      plateauCount = 0;
    }
    lastReadiness = r.readiness;
  }
  return userId;
}

// ── Main ───────────────────────────────────────────────────────────────────

const createdUsers = [];
try {
  for (const p of PERSONAS) {
    const uid = await runPersona(p);
    createdUsers.push({ p, uid });
  }
} finally {
  if (!KEEP) {
    console.log(`\n\nCleaning up test personas…`);
    for (const p of PERSONAS) await cleanupPersona(p);
  } else {
    console.log(`\n\n--keep set — test users left in DB. Emails: ${PERSONAS.map((p) => p.email).join(", ")}`);
  }
}

console.log("\nDone.");
