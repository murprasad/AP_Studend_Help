/**
 * Bulk-populate questions for the 3 AP3 courses via /api/admin/mega-populate.
 * Authenticates as admin (NextAuth credentials flow), then iterates course→unit.
 *
 * Usage: npx tsx scripts/populate-all.ts
 *   - Assumes `npm run dev` is running on :3000
 *   - Assumes .env has DATABASE_URL pointing at prod Neon (it does in this repo)
 *   - Admin credentials read from ADMIN_EMAIL + ADMIN_PASSWORD env vars
 *
 * Ported from PrepLion's scripts/populate-all.ts with AP3 scope.
 */
export {};

const BASE = process.env.POPULATE_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "murprasad@yahoo.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "AdminPrep2026!";
const DEFAULT_TARGET = Number(process.env.TARGET_PER_UNIT ?? 10);

// PrepLion-scale targets: ~500 Qs per subject.
// World (9 units) × 55 = 495, CSP (5 units) × 100 = 500, Physics (10 units) × 50 = 500.
const PER_COURSE_TARGET: Record<string, number> = {
  AP_WORLD_HISTORY: Number(process.env.TARGET_WORLD ?? DEFAULT_TARGET),
  AP_COMPUTER_SCIENCE_PRINCIPLES: Number(process.env.TARGET_CSP ?? DEFAULT_TARGET),
  AP_PHYSICS_1: Number(process.env.TARGET_PHYSICS ?? DEFAULT_TARGET),
  AP_PSYCHOLOGY: Number(process.env.TARGET_PSYCH ?? DEFAULT_TARGET),
  AP_BIOLOGY: Number(process.env.TARGET_BIO ?? DEFAULT_TARGET),
  // Added 2026-04-17 — both have 9 units, per-unit target 56 → course total ~504.
  AP_US_HISTORY: Number(process.env.TARGET_USH ?? DEFAULT_TARGET),
  AP_STATISTICS: Number(process.env.TARGET_STATS ?? DEFAULT_TARGET),
};

const COURSES: Record<string, string[]> = {
  AP_WORLD_HISTORY: [
    "UNIT_1_GLOBAL_TAPESTRY",
    "UNIT_2_NETWORKS_OF_EXCHANGE",
    "UNIT_3_LAND_BASED_EMPIRES",
    "UNIT_4_TRANSOCEANIC_INTERCONNECTIONS",
    "UNIT_5_REVOLUTIONS",
    "UNIT_6_INDUSTRIALIZATION",
    "UNIT_7_GLOBAL_CONFLICT",
    "UNIT_8_COLD_WAR",
    "UNIT_9_GLOBALIZATION",
  ],
  AP_COMPUTER_SCIENCE_PRINCIPLES: [
    "CSP_1_CREATIVE_DEVELOPMENT",
    "CSP_2_DATA",
    "CSP_3_ALGORITHMS_AND_PROGRAMMING",
    "CSP_4_COMPUTER_SYSTEMS_NETWORKS",
    "CSP_5_IMPACT_OF_COMPUTING",
  ],
  AP_PHYSICS_1: [
    "PHY1_1_KINEMATICS",
    "PHY1_2_FORCES_AND_NEWTONS_LAWS",
    "PHY1_3_CIRCULAR_MOTION_GRAVITATION",
    "PHY1_4_ENERGY",
    "PHY1_5_MOMENTUM",
    "PHY1_6_SIMPLE_HARMONIC_MOTION",
    "PHY1_7_TORQUE_AND_ROTATION",
    "PHY1_8_ELECTRIC_CHARGE_AND_FORCE",
    "PHY1_9_DC_CIRCUITS",
    "PHY1_10_WAVES_AND_SOUND",
  ],
  AP_PSYCHOLOGY: [
    "PSYCH_1_SCIENTIFIC_FOUNDATIONS",
    "PSYCH_2_BIOLOGICAL_BASES",
    "PSYCH_3_SENSATION_PERCEPTION",
    "PSYCH_4_LEARNING",
    "PSYCH_5_COGNITION",
    "PSYCH_6_DEVELOPMENTAL",
    "PSYCH_7_MOTIVATION_EMOTION",
    "PSYCH_8_CLINICAL",
    "PSYCH_9_SOCIAL",
  ],
  AP_BIOLOGY: [
    "BIO_1_CHEMISTRY_OF_LIFE",
    "BIO_2_CELL_STRUCTURE_FUNCTION",
    "BIO_3_CELLULAR_ENERGETICS",
    "BIO_4_CELL_COMMUNICATION",
    "BIO_5_HEREDITY",
    "BIO_6_GENE_EXPRESSION",
    "BIO_7_NATURAL_SELECTION",
    "BIO_8_ECOLOGY",
  ],
  AP_US_HISTORY: [
    "APUSH_1_PERIOD_1491_1607",
    "APUSH_2_PERIOD_1607_1754",
    "APUSH_3_PERIOD_1754_1800",
    "APUSH_4_PERIOD_1800_1848",
    "APUSH_5_PERIOD_1844_1877",
    "APUSH_6_PERIOD_1865_1898",
    "APUSH_7_PERIOD_1890_1945",
    "APUSH_8_PERIOD_1945_1980",
    "APUSH_9_PERIOD_1980_PRESENT",
  ],
  AP_STATISTICS: [
    "STATS_1_EXPLORING_DATA",
    "STATS_2_MODELING_DATA",
    "STATS_3_COLLECTING_DATA",
    "STATS_4_PROBABILITY",
    "STATS_5_SAMPLING_DISTRIBUTIONS",
    "STATS_6_INFERENCE_PROPORTIONS",
    "STATS_7_INFERENCE_MEANS",
    "STATS_8_CHI_SQUARE",
    "STATS_9_INFERENCE_SLOPES",
  ],
};

async function main() {
  console.log(`🔐 Authenticating ${ADMIN_EMAIL} at ${BASE}...`);

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      json: "true",
    }),
    redirect: "manual",
  });

  const allCookies = [
    ...csrfCookies,
    ...(signInRes.headers.getSetCookie?.() ?? []),
  ].join("; ");

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: allCookies },
  });
  const session = (await sessionRes.json()) as {
    user?: { email: string; role: string };
  };

  if (!session?.user?.email) {
    console.error("❌ Authentication failed. Check ADMIN_EMAIL / ADMIN_PASSWORD.");
    console.log("Session response:", JSON.stringify(session));
    process.exit(1);
  }
  console.log(`✅ Logged in as ${session.user.email} (${session.user.role})\n`);

  const filter = process.env.COURSES_FILTER;
  const courseEntries = Object.entries(COURSES).filter(
    ([course]) => !filter || course === filter
  );
  if (filter) console.log(`  (filtered to ${filter})\n`);
  let totalGenerated = 0;
  let totalFailed = 0;
  const startedAt = Date.now();

  // Chunk size per mega-populate call — keeps each request under client timeout.
  // At ~20s per Q with v2 validation, CHUNK=15 means each call finishes in ~5 min.
  const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 15);
  const MAX_CHUNKS_PER_UNIT = Number(process.env.MAX_CHUNKS_PER_UNIT ?? 10);

  for (const [course, units] of courseEntries) {
    console.log(`📚 ${course}`);
    const fullTarget = PER_COURSE_TARGET[course] ?? DEFAULT_TARGET;
    for (const unit of units) {
      let unitTotal = 0;
      let unitFailed = 0;
      let consecutiveSkipped = 0;
      let currentTarget = 0; // incremented each chunk

      for (let chunk = 0; chunk < MAX_CHUNKS_PER_UNIT; chunk++) {
        currentTarget = Math.min(currentTarget + CHUNK_SIZE, fullTarget);
        if (currentTarget > fullTarget) currentTarget = fullTarget;

        process.stdout.write(`  ├─ ${unit.padEnd(42)} [chunk ${chunk + 1}, target=${currentTarget}] `);
        const t0 = Date.now();
        try {
          const res = await fetch(`${BASE}/api/admin/mega-populate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: allCookies },
            body: JSON.stringify({ course, unit, targetPerUnit: currentTarget }),
            signal: AbortSignal.timeout(20 * 60 * 1000), // 20 min cap per chunk
          });

          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          if (!res.ok) {
            const text = await res.text();
            console.log(`❌ ${res.status} (${elapsed}s): ${text.slice(0, 100)}`);
            unitFailed++;
            break;
          }

          const data = (await res.json()) as {
            generated: number;
            failed: number;
            skipped?: boolean;
            difficulty: { EASY: number; MEDIUM: number; HARD: number };
          };

          if (data.skipped) {
            console.log(`⏩ already at ${currentTarget} (${elapsed}s)`);
            consecutiveSkipped++;
            if (consecutiveSkipped >= 1 && currentTarget >= fullTarget) break; // fully done
          } else {
            console.log(`✅ +${data.generated} (E:${data.difficulty.EASY} M:${data.difficulty.MEDIUM} H:${data.difficulty.HARD}), ${data.failed} fail, ${elapsed}s`);
            unitTotal += data.generated;
            unitFailed += data.failed;
            consecutiveSkipped = 0;
            if (currentTarget >= fullTarget && data.generated === 0) break; // no progress
          }
        } catch (err) {
          console.log(`❌ ${err instanceof Error ? err.message : err}`);
          unitFailed++;
          break; // abort this unit on fetch error, next unit takes over
        }
        await new Promise((r) => setTimeout(r, 800));
      }

      totalGenerated += unitTotal;
      totalFailed += unitFailed;
      console.log(`     └─ unit done: +${unitTotal}, ${unitFailed} failed`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\n════════════════════════════════════════`);
  console.log(`Total generated: ${totalGenerated}`);
  console.log(`Total failed:    ${totalFailed}`);
  console.log(`Elapsed:         ${mins} min`);
  console.log(`════════════════════════════════════════`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
