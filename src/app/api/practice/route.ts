import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionType, ApUnit, Difficulty, ApCourse, QuestionType, SubTier } from "@prisma/client";
import { VALID_AP_COURSES, getUnitsForCourse, COURSE_REGISTRY, getCourseTrack, getCourseModule } from "@/lib/courses";
import { generateQuestion } from "@/lib/ai";
import { isPremiumRestrictionEnabled, getSetting } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { isPremiumForTrack, isAnyPremium, hasModulePremium, hasAnyPremium, type ModuleSub } from "@/lib/tiers";

// Create a new practice session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed } = rateLimit(session.user.id, "practice:create", 20);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
    }

    const body = await req.json();
    const { sessionType, unit, difficulty, questionCount = 10, course = "AP_WORLD_HISTORY", questionType: requestedType } = body;

    if (!sessionType) {
      return NextResponse.json({ error: "sessionType is required" }, { status: 400 });
    }

    if (!VALID_AP_COURSES.includes(course as ApCourse)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    const userTrack = session.user.track ?? "ap";
    const courseModule = getCourseModule(course as ApCourse);
    const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    const hasPremium = isAdmin || hasModulePremium(moduleSubs, courseModule) || isPremiumForTrack(session.user.subscriptionTier, userTrack);
    const [premiumRestricted, aiGenEnabled] = await Promise.all([
      isPremiumRestrictionEnabled(),
      getSetting("ai_generation_enabled", "true").then((v) => v === "true"),
    ]);

    // Gate FRQ/SAQ/LEQ/DBQ behind Premium (only when premium restriction is enabled)
    const isFrqType = requestedType && requestedType !== "MCQ";
    if (premiumRestricted && isFrqType && !hasPremium) {
      return NextResponse.json({
        error: "FRQ practice (SAQ, LEQ, DBQ) requires a Premium subscription.",
        limitExceeded: true,
        upgradeUrl: "/pricing",
      }, { status: 403 });
    }

    // Gate FREE users to 3 practice sessions/day (mock exams excluded, only when restriction is enabled)
    if (premiumRestricted && (sessionType === "PRACTICE" || sessionType === "QUICK_PRACTICE" || sessionType === "FOCUSED_STUDY")) {
      if (!hasPremium) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaySessions = await prisma.practiceSession.count({
          where: {
            userId: session.user.id,
            startedAt: { gte: startOfDay },
            status: { not: "ABANDONED" },
          },
        });
        if (todaySessions >= 3) {
          return NextResponse.json({
            error: "Free accounts get 3 practice sessions per day. Upgrade to Premium for unlimited practice.",
            limitExceeded: true,
            upgradeUrl: "/pricing",
          }, { status: 429 });
        }
      }
    }

    // Determine which questions to include
    const resolvedQuestionType = isFrqType ? (requestedType as QuestionType) : QuestionType.MCQ;
    const whereClause: Record<string, unknown> = {
      isApproved: true,
      questionType: resolvedQuestionType,
      course: course as ApCourse,
      ...(unit && unit !== "ALL" && { unit: unit as ApUnit }),
      ...(difficulty && difficulty !== "ALL" && { difficulty: difficulty as Difficulty }),
    };

    let allQuestions = await prisma.question.findMany({
      where: whereClause,
      select: {
        id: true, course: true, unit: true, topic: true, subtopic: true,
        difficulty: true, questionType: true, questionText: true,
        stimulus: true, stimulusImageUrl: true, options: true,
        correctAnswer: true, explanation: true,
      },
    });

    // Fetch questions this user has already answered (correctly, and recently seen in last 48h)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const allQuestionIds = allQuestions.map((q) => q.id);
    const [correctResponses, recentResponses] = await Promise.all([
      prisma.studentResponse.findMany({
        where: { userId: session.user.id, isCorrect: true, questionId: { in: allQuestionIds } },
        select: { questionId: true },
      }),
      prisma.studentResponse.findMany({
        where: { userId: session.user.id, questionId: { in: allQuestionIds }, answeredAt: { gte: fortyEightHoursAgo } },
        select: { questionId: true },
      }),
    ]);

    const correctlyAnsweredIds = new Set(correctResponses.map((r) => r.questionId));
    const recentlySeenIds = new Set(recentResponses.map((r) => r.questionId));

    // Three-tier priority pool: never seen > recently seen (not mastered) > seen correct
    let freshQuestions = allQuestions.filter((q) =>
      !correctlyAnsweredIds.has(q.id) && !recentlySeenIds.has(q.id)
    );
    const seenCorrectQuestions = allQuestions.filter((q) => correctlyAnsweredIds.has(q.id));

    // Fetch student's mastery scores for adaptive topic targeting
    const masteryData = await prisma.masteryScore.findMany({
      where: { userId: session.user.id, course: course as ApCourse },
      orderBy: { masteryScore: "asc" },
    });
    // Build weak-topic map: unit → weakest keyTheme (for targeted generation)
    const weakTopicMap = new Map<string, string>();
    for (const m of masteryData) {
      if (m.masteryScore < 70) {
        const unitMeta = COURSE_REGISTRY[course as ApCourse]?.units[m.unit as ApUnit];
        const themes = unitMeta?.keyThemes || [];
        if (themes.length) weakTopicMap.set(m.unit, themes[0]);
      }
    }

    // Auto-generate AI questions when the DB bank is insufficient (if flag enabled)
    // Keep generation count low to avoid CF Workers timeout (~100s).
    // Empty banks: generate 3 (fast, reliable). Thin banks: 5. Normal: 5.
    const MAX_GEN_PER_REQUEST = allQuestions.length === 0 ? 3 : 5;
    let aiGenerationWarning: string | null = null;
    if (aiGenEnabled && freshQuestions.length < questionCount) {
      const needed = Math.min(questionCount - freshQuestions.length, MAX_GEN_PER_REQUEST);
      const courseUnitKeys = getUnitsForCourse(course as ApCourse);
      const diffs: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

      // Pick a random existing question as seed for variation generation
      const seedPool = allQuestions.filter((q) =>
        difficulty && difficulty !== "ALL" ? q.difficulty === difficulty : true
      );
      const seedQuestion = seedPool.length > 0
        ? seedPool[Math.floor(Math.random() * Math.min(seedPool.length, 5))].questionText
        : undefined;

      const genPromises = Array.from({ length: needed }, (_, i) => {
        const u: ApUnit = (unit && unit !== "ALL")
          ? (unit as ApUnit)
          : courseUnitKeys[i % courseUnitKeys.length];
        const d: Difficulty = (difficulty && difficulty !== "ALL")
          ? (difficulty as Difficulty)
          : diffs[i % diffs.length];
        const weakTopic = weakTopicMap.get(u) || undefined;
        return generateQuestion(u, d, resolvedQuestionType, weakTopic, course as ApCourse, (hasPremium ? "PREMIUM" : "FREE") as "FREE" | "PREMIUM", seedQuestion, true /* quickMode */)
          .then((gen) =>
            prisma.question.create({
              data: {
                course: course as ApCourse,
                unit: gen.unit,
                topic: gen.topic,
                subtopic: gen.subtopic,
                difficulty: gen.difficulty,
                questionType: gen.questionType,
                questionText: gen.questionText,
                stimulus: gen.stimulus || null,
                stimulusImageUrl: gen.stimulusImageUrl || null,
                options: gen.options ?? undefined,
                correctAnswer: gen.correctAnswer,
                explanation: gen.explanation,
                isAiGenerated: true,
                isApproved: true,
                modelUsed: gen.modelUsed ?? null,
                generatedForTier: (hasPremium ? "PREMIUM" : "FREE") as SubTier,
                contentHash: gen.contentHash ?? null,
                apSkill: gen.apSkill ?? null,
                bloomLevel: gen.bloomLevel ?? null,
              },
              select: {
                id: true, course: true, unit: true, topic: true, subtopic: true,
                difficulty: true, questionType: true, questionText: true,
                stimulus: true, stimulusImageUrl: true, options: true,
                correctAnswer: true, explanation: true,
              },
            }).catch((err: { code?: string }) => {
              // P2002 = unique constraint violation — duplicate question; skip silently
              if (err?.code === "P2002") return null;
              throw err;
            })
          );
      });

      // Race against a 60s timeout to prevent CF Workers from being killed (~100s limit)
      const settled = await Promise.race([
        Promise.allSettled(genPromises),
        new Promise<PromiseSettledResult<(typeof allQuestions)[0]>[]>((resolve) =>
          setTimeout(() => resolve([]), 60000)
        ),
      ]);
      const generated = settled
        .filter((r): r is PromiseFulfilledResult<(typeof allQuestions)[0]> => r.status === "fulfilled" && (r as PromiseFulfilledResult<unknown>).value !== null)
        .map((r) => (r as PromiseFulfilledResult<(typeof allQuestions)[0]>).value);

      if (generated.length > 0) {
        freshQuestions = [...freshQuestions, ...generated];
        const stillNeeded = questionCount - freshQuestions.length;
        aiGenerationWarning = stillNeeded > 0
          ? `${generated.length} AI question${generated.length === 1 ? "" : "s"} generated. Start another session to get ${stillNeeded} more — they'll be ready instantly!`
          : `${generated.length} AI question${generated.length === 1 ? "" : "s"} generated and saved for future sessions too.`;

        // Fire-and-forget: if bank was empty, generate more in background for next session
        if (allQuestions.length === 0) {
          const bgCount = Math.min(5, courseUnitKeys.length);
          const bgDiffs: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.MEDIUM, Difficulty.EASY];
          void Promise.allSettled(
            Array.from({ length: bgCount }, (_, i) =>
              generateQuestion(
                courseUnitKeys[i % courseUnitKeys.length] as ApUnit,
                bgDiffs[i % bgDiffs.length],
                resolvedQuestionType, undefined, course as ApCourse, "FREE", undefined, true
              ).then((gen) =>
                prisma.question.create({
                  data: {
                    course: course as ApCourse, unit: gen.unit, topic: gen.topic, subtopic: gen.subtopic,
                    difficulty: gen.difficulty, questionType: gen.questionType, questionText: gen.questionText,
                    stimulus: gen.stimulus || null, stimulusImageUrl: gen.stimulusImageUrl || null,
                    options: gen.options ?? undefined, correctAnswer: gen.correctAnswer, explanation: gen.explanation,
                    isAiGenerated: true, isApproved: true, modelUsed: gen.modelUsed ?? null,
                    contentHash: gen.contentHash ?? null, apSkill: gen.apSkill ?? null, bloomLevel: gen.bloomLevel ?? null,
                  },
                }).catch(() => null)
              ).catch(() => null)
            )
          );
        }
      } else if (allQuestions.length === 0) {
        // Retry once more with reduced count — sometimes providers recover after a brief delay
        try {
          const retryUnit = courseUnitKeys[0] as ApUnit;
          const retryQ = await generateQuestion(retryUnit, Difficulty.MEDIUM, resolvedQuestionType, undefined, course as ApCourse, "FREE", undefined, true);
          const saved = await prisma.question.create({
            data: {
              course: course as ApCourse, unit: retryQ.unit, topic: retryQ.topic, subtopic: retryQ.subtopic,
              difficulty: retryQ.difficulty, questionType: retryQ.questionType, questionText: retryQ.questionText,
              stimulus: retryQ.stimulus || null, stimulusImageUrl: retryQ.stimulusImageUrl || null,
              options: retryQ.options ?? undefined, correctAnswer: retryQ.correctAnswer, explanation: retryQ.explanation,
              isAiGenerated: true, isApproved: true, modelUsed: retryQ.modelUsed ?? null,
              contentHash: retryQ.contentHash ?? null, apSkill: retryQ.apSkill ?? null, bloomLevel: retryQ.bloomLevel ?? null,
            },
            select: { id: true, course: true, unit: true, topic: true, subtopic: true, difficulty: true, questionType: true, questionText: true, stimulus: true, stimulusImageUrl: true, options: true, correctAnswer: true, explanation: true },
          });
          if (saved) {
            freshQuestions = [saved as (typeof allQuestions)[0]];
            aiGenerationWarning = "1 question generated on retry. More will be available on your next session.";
          }
        } catch {
          return NextResponse.json(
            { error: "No questions available yet for this course. The question bank is being populated — please try again in a few minutes." },
            { status: 400 }
          );
        }
      }
    }

    // Warn only if still below target after AI generation
    const lowBankWarning = !aiGenerationWarning && freshQuestions.length < questionCount * 2
      ? `Only ${freshQuestions.length} questions in the bank — you may see repeats soon.`
      : null;

    // Build scoring pool: never-seen first, then recently-seen-not-mastered, then mastered
    const recentlySeenNotMastered = allQuestions.filter(
      (q) => recentlySeenIds.has(q.id) && !correctlyAnsweredIds.has(q.id)
    );
    const pool = freshQuestions.length >= questionCount
      ? freshQuestions
      : [...freshQuestions, ...recentlySeenNotMastered, ...seenCorrectQuestions];

    const scored = pool.map((q) => {
      let priority = Math.random();
      if (!correctlyAnsweredIds.has(q.id) && !recentlySeenIds.has(q.id)) priority += 4; // never seen: highest
      else if (recentlySeenIds.has(q.id) && !correctlyAnsweredIds.has(q.id)) priority += 2; // recently seen, not mastered
      else priority += 1;  // already mastered: lowest (fallback only)
      return { ...q, priority };
    });

    scored.sort((a, b) => b.priority - a.priority);
    const count = Math.min(questionCount, scored.length);
    let selectedQuestions = scored.slice(0, count);

    // A22.5 port — Topic interleaving. Cap consecutive same-unit exposure
    // at 2 for multi-unit sessions so students get a recovery beat between
    // same-unit drills. Skipped for FOCUSED_STUDY on a specific unit
    // (single-unit pool) and for MOCK_EXAM (blueprint already interleaves).
    // Pure helper at lib/interleave-by-unit.ts.
    const isMultiUnit = !unit || unit === "ALL";
    if (isMultiUnit && sessionType !== "MOCK_EXAM" && selectedQuestions.length > 2) {
      const { interleaveByUnit } = await import("@/lib/interleave-by-unit");
      selectedQuestions = interleaveByUnit(selectedQuestions) as typeof selectedQuestions;
    }

    // Guard: if no questions available after all attempts, return 400 (not 500)
    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this course yet. Questions are being generated — please try again in a few seconds." },
        { status: 400 }
      );
    }

    // Create the session (two steps to avoid implicit transactions,
    // which are not supported by the Neon HTTP adapter)
    const practiceSession = await prisma.practiceSession.create({
      data: {
        userId: session.user.id,
        course: course as ApCourse,
        sessionType: sessionType as SessionType,
        totalQuestions: selectedQuestions.length,
      },
    });

    // Insert session questions via raw SQL to avoid implicit transactions
    // (the Neon HTTP adapter does not support transactions).
    // $executeRawUnsafe with positional params is safe here — all values
    // come from the database or are generated by crypto.randomUUID().
    const placeholders = selectedQuestions
      .map((_, i) => {
        const b = i * 4;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`;
      })
      .join(", ");
    const values = selectedQuestions.flatMap((q, i) => [
      crypto.randomUUID(), practiceSession.id, q.id, i,
    ]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO session_questions (id, "sessionId", "questionId", "order") VALUES ${placeholders}`,
      ...values
    );

    return NextResponse.json({
      sessionId: practiceSession.id,
      lowBankWarning,
      aiGenerationWarning,
      questions: selectedQuestions.map((q) => ({
        id: q.id,
        course: q.course,
        unit: q.unit,
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        questionType: q.questionType,
        questionText: q.questionText,
        stimulus: q.stimulus,
        stimulusImageUrl: q.stimulusImageUrl,
        options: q.options,
      })),
    });
  } catch (error) {
    console.error("POST /api/practice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get all sessions for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const sessions = await prisma.practiceSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/practice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
