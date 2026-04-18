/**
 * Daily Quiz Email — pure-ish question selection logic.
 *
 * The cron at /api/cron/daily-quiz delegates question picking to this
 * module so it can be unit tested and reused. Keeping it out of the
 * route file also side-steps the Next.js App Router rule that forbids
 * non-HTTP exports from route.ts.
 *
 * Selection recipe (designed to PULL users back — not satisfy them):
 *   - weak    : from the user's lowest-mastery unit (with >0 attempts),
 *               pick a MEDIUM question they haven't been sent in 30d.
 *   - booster : from a unit the user has >=80% accuracy on, pick a
 *               MEDIUM question — the "easy win" that builds momentum.
 *   - trap    : any HARD question with >=5 global attempts and <35%
 *               global correct rate — historically trappy, high-curiosity.
 *
 * Returns null if the user lacks the data to make a sensible pick
 * (e.g. no mastery scores yet, or no eligible questions). The cron
 * treats null as "skip this user today".
 *
 * NB: `course` is typed as string so the cron can pass either a plain
 * string or an `ApCourse` enum value without coercion gymnastics. The
 * Prisma call below narrows it.
 */

import type { PrismaClient, Question } from "@prisma/client";
import type { ApCourse } from "@prisma/client";

const DAYS_30 = 30 * 24 * 3600 * 1000;

export interface DailyQuestionPick {
  weak: Question;
  booster: Question;
  trap: Question;
}

export async function selectDailyQuestions(
  userId: string,
  course: string,
  prisma: PrismaClient,
): Promise<DailyQuestionPick | null> {
  // 1. Collect question IDs we've already shipped to this user in the
  //    last 30 days so we can avoid repeats in any slot.
  const thirtyDaysAgo = new Date(Date.now() - DAYS_30);
  const recent = await prisma.dailyQuizSend.findMany({
    where: { userId, sentAt: { gte: thirtyDaysAgo } },
    select: { weakQuestionId: true, boosterQuestionId: true, trapQuestionId: true },
  });
  const alreadySent = new Set<string>();
  for (const r of recent) {
    alreadySent.add(r.weakQuestionId);
    alreadySent.add(r.boosterQuestionId);
    alreadySent.add(r.trapQuestionId);
  }
  const excludeIds = Array.from(alreadySent);

  const courseEnum = course as ApCourse;

  // 2. Pull mastery rows for this user+course. Ignore units with zero
  //    attempts — we need signal, not noise.
  const mastery = await prisma.masteryScore.findMany({
    where: { userId, course: courseEnum, totalAttempts: { gt: 0 } },
    select: { unit: true, masteryScore: true, accuracy: true, totalAttempts: true },
  });

  if (mastery.length === 0) {
    // No practice history — can't personalize weak/booster. Skip for today.
    return null;
  }

  // 3. WEAK — lowest masteryScore unit, MEDIUM question.
  const weakestUnit = [...mastery].sort((a, b) => a.masteryScore - b.masteryScore)[0];
  const weak = await pickQuestion(prisma, {
    course: courseEnum,
    unit: weakestUnit.unit,
    difficulty: "MEDIUM",
    excludeIds,
  });
  if (!weak) return null;

  // 4. BOOSTER — unit with accuracy >= 80%, MEDIUM question. Falls back
  //    to highest-accuracy unit if no unit clears the 80% bar yet.
  const boosterUnits = mastery
    .filter((m) => m.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy);
  const boosterPool = boosterUnits.length > 0
    ? boosterUnits
    : [...mastery].sort((a, b) => b.accuracy - a.accuracy);

  let booster: Question | null = null;
  const boosterExclude = [...excludeIds, weak.id];
  for (const bu of boosterPool) {
    // Don't let booster be the same unit as weak — defeats the point of
    // alternating pain and confidence in one email.
    if (bu.unit === weakestUnit.unit && boosterPool.length > 1) continue;
    booster = await pickQuestion(prisma, {
      course: courseEnum,
      unit: bu.unit,
      difficulty: "MEDIUM",
      excludeIds: boosterExclude,
    });
    if (booster) break;
  }
  if (!booster) return null;

  // 5. TRAP — any HARD question with historical correct-rate below 35%
  //    and at least 5 attempts. Raw query because Prisma can't express
  //    the ratio filter directly.
  const trapExclude = [...excludeIds, weak.id, booster.id];
  const trap = await pickTrapQuestion(prisma, courseEnum, trapExclude);
  if (!trap) return null;

  return { weak, booster, trap };
}

interface PickArgs {
  course: ApCourse;
  unit: Question["unit"];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  excludeIds: string[];
}

async function pickQuestion(prisma: PrismaClient, args: PickArgs): Promise<Question | null> {
  // Grab up to 20 approved candidates and pick one at random in JS so
  // repeat users get variety without us needing ORDER BY RANDOM() which
  // the Neon HTTP adapter handles awkwardly on large tables.
  const pool = await prisma.question.findMany({
    where: {
      course: args.course,
      unit: args.unit,
      difficulty: args.difficulty,
      isApproved: true,
      ...(args.excludeIds.length > 0 ? { id: { notIn: args.excludeIds } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function pickTrapQuestion(
  prisma: PrismaClient,
  course: ApCourse,
  excludeIds: string[],
): Promise<Question | null> {
  // HARD + >= 5 attempts + timesCorrect/timesAnswered < 0.35. We pull a
  // small pool then pick randomly in JS.
  const pool = await prisma.question.findMany({
    where: {
      course,
      difficulty: "HARD",
      isApproved: true,
      timesAnswered: { gte: 5 },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });
  const trappy = pool.filter((q) => q.timesAnswered > 0 && q.timesCorrect / q.timesAnswered < 0.35);
  if (trappy.length === 0) return null;
  return trappy[Math.floor(Math.random() * trappy.length)];
}
