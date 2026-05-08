import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionType, ApUnit, Difficulty, ApCourse, QuestionType, SubTier } from "@prisma/client";
import { VALID_AP_COURSES, getUnitsForCourse, COURSE_REGISTRY, getCourseTrack } from "@/lib/courses";
import { generateQuestion } from "@/lib/ai";
import { isPremiumRestrictionEnabled, getSetting, isCourseVisible } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { isPremiumForTrack, isAnyPremium, hasAnyPremium, type ModuleSub } from "@/lib/tiers";
import { FREE_LIMITS, LOCK_COPY } from "@/lib/tier-limits";

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
    const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";

    // Bank-quality visibility gate (2026-05-02). When the visible_courses
    // SiteSetting is populated, reject practice creation for any course
    // not in the allowlist. Admin role bypasses — admins can practice
    // anything to validate question quality.
    if (!isAdmin) {
      const visible = await isCourseVisible(course as string);
      if (!visible) {
        return NextResponse.json(
          {
            error: "Course temporarily unavailable",
            detail:
              "We're rebuilding this course's question bank to meet College Board quality standards. Please pick another course for now.",
          },
          { status: 400 },
        );
      }
    }
    // Entitlement model (Beta 7.1, 2026-04-25): Premium is ALL-ACCESS.
    // Any active module subscription unlocks practice on every course —
    // matches the "$9.99 = everything" promise on /pricing and the rest
    // of the platform (AI tutor, mock exams, diagnostics already use
    // hasAnyPremium). Per-module ModuleSubscription rows still exist for
    // analytics/attribution; they are NOT used for gating here anymore.
    const hasPremium = isAdmin || hasAnyPremium(moduleSubs) || isPremiumForTrack(session.user.subscriptionTier, userTrack);
    const [premiumRestricted, aiGenEnabled] = await Promise.all([
      isPremiumRestrictionEnabled(),
      getSetting("ai_generation_enabled", "true").then((v) => v === "true"),
    ]);

    // Beta 8.13 (2026-04-29) — taste-first FRQ access for free users.
    // Replaces the blanket FRQ paywall (which was killing conversion since
    // students couldn't evaluate DBQ/LEQ quality before paying).
    //
    // Each FRQ type (DBQ, LEQ, SAQ, FRQ-generic, CODING) gives free users
    // 1 lifetime attempt PER COURSE. They see full prompt + documents +
    // rubric, submit answer, get basic AI scoring. Premium unlocks
    // detailed line-by-line feedback + unlimited attempts.
    const isFrqType = requestedType && requestedType !== "MCQ";
    if (isFrqType && !hasPremium) {
      const frqTypeKey = (requestedType ?? "FRQ").toLowerCase();
      const limitKey = (
        frqTypeKey === "dbq" ? "dbqFreeAttemptsPerCourse" :
        frqTypeKey === "leq" ? "leqFreeAttemptsPerCourse" :
        frqTypeKey === "saq" ? "saqFreeAttemptsPerCourse" :
        "frqFreeAttemptsPerCourse"
      ) as keyof typeof FREE_LIMITS;
      const limit = FREE_LIMITS[limitKey] as number;

      // Count prior submitted FRQ responses of this type for this user+course.
      // Joins via session→course since StudentResponse has no course directly.
      const priorAttempts = await prisma.studentResponse.count({
        where: {
          userId: session.user.id,
          question: {
            questionType: requestedType as QuestionType,
            course: course as ApCourse,
          },
        },
      });

      if (priorAttempts >= limit) {
        return NextResponse.json({
          error: `You've used your free ${requestedType} attempt for ${course}. Premium unlocks unlimited + detailed coaching.`,
          limitExceeded: true,
          limitType: "frq_per_type_cap",
          attemptsUsed: priorAttempts,
          attemptsAllowed: limit,
          upgradeUrl: "/billing?utm_source=frq_cap&utm_campaign=frq_taste",
        }, { status: 403 });
      }
    }

    // Single daily question cap for FREE users (Option B — 2026-04-22).
    // Replaces the prior overlapping 15 Qs/day + 3 sessions/day rules
    // (two overlapping caps confused students per reviewer feedback).
    // One cap. One number. Urgency-framed copy via LOCK_COPY.practiceCap.
    // Mock exams intentionally excluded — they have their own Q5 paywall.
    if (!hasPremium && (sessionType === "PRACTICE" || sessionType === "QUICK_PRACTICE" || sessionType === "FOCUSED_STUDY")) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayAnswered = await prisma.studentResponse.count({
        where: {
          userId: session.user.id,
          answeredAt: { gte: startOfDay },
        },
      });
      if (todayAnswered >= FREE_LIMITS.practiceQuestionsPerDay) {
        return NextResponse.json({
          error: LOCK_COPY.practiceCap,
          limitExceeded: true,
          limitType: "daily_question_cap",
          answeredToday: todayAnswered,
          capAmount: FREE_LIMITS.practiceQuestionsPerDay,
          upgradeUrl: "/billing?utm_source=daily_cap&utm_campaign=q_limit",
        }, { status: 429 });
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

    // Beta 8.5 (2026-04-26): bumped recentlySeen window from 48h to 7 days
    // after user-reported "kept regenerating same questions" complaint on
    // AP Chem. With 548 MCQs in the AP Chem bank and a typical 5-10 Q
    // session, a heavy user could exhaust the fresh pool in ~50 sessions
    // and hit recently-seen fallback within 2 days. 7-day window means
    // users who practice daily get genuine variety for at least a week
    // before the same question recurs.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = sevenDaysAgo; // Variable name preserved for downstream readability; semantics widened.
    const allQuestionIds = allQuestions.map((q) => q.id);
    const [correctResponses, recentResponses, sameSessionResponses] = await Promise.all([
      prisma.studentResponse.findMany({
        where: { userId: session.user.id, isCorrect: true, questionId: { in: allQuestionIds } },
        select: { questionId: true },
      }),
      prisma.studentResponse.findMany({
        where: { userId: session.user.id, questionId: { in: allQuestionIds }, answeredAt: { gte: fortyEightHoursAgo } },
        select: { questionId: true },
      }),
      // 2026-05-08 — same-content dedup against questions answered in the
      // last 30 min (covers a single journey session). The DB has dupes
      // (same questionText, different id, contentHash=null) — e.g. 43
      // identical polar-area Qs in AP_CALCULUS_BC. Without this filter,
      // step-3 diagnostic shows the same question the student just
      // answered in step-1 warm-up, with a different id slipping past
      // the questionId-based dedup.
      prisma.studentResponse.findMany({
        where: {
          userId: session.user.id,
          answeredAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        select: { question: { select: { questionText: true } } },
      }),
    ]);

    const correctlyAnsweredIds = new Set(correctResponses.map((r) => r.questionId));
    const recentlySeenIds = new Set(recentResponses.map((r) => r.questionId));
    // Same-session content-text dedup: build a set of normalized question
    // texts answered in the last 30 min, exclude any allQuestions whose
    // questionText normalizes to the same value.
    const normalize = (s: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
    const recentlySeenTexts = new Set(
      sameSessionResponses
        .map((r) => normalize(r.question?.questionText ?? ""))
        .filter((t) => t.length > 0),
    );

    // Three-tier priority pool: never seen > recently seen (not mastered) > seen correct
    // Plus same-text dedup so students don't see the same question twice in
    // a single journey (different id, identical text — old DB has many such pairs).
    let freshQuestions = allQuestions.filter((q) =>
      !correctlyAnsweredIds.has(q.id) &&
      !recentlySeenIds.has(q.id) &&
      !recentlySeenTexts.has(normalize(q.questionText)),
    );
    const seenCorrectQuestions = allQuestions.filter((q) =>
      correctlyAnsweredIds.has(q.id) &&
      !recentlySeenTexts.has(normalize(q.questionText)),
    );

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

    // Capture UA at session-create (added 2026-05-08 for device-class analysis).
    const sessionUserAgent = (req.headers.get("user-agent") ?? "").slice(0, 500) || null;

    // Create the session (two steps to avoid implicit transactions,
    // which are not supported by the Neon HTTP adapter)
    const practiceSession = await prisma.practiceSession.create({
      data: {
        userId: session.user.id,
        course: course as ApCourse,
        sessionType: sessionType as SessionType,
        totalQuestions: selectedQuestions.length,
        userAgent: sessionUserAgent,
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
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO session_questions (id, "sessionId", "questionId", "order") VALUES ${placeholders}`,
        ...values
      );
    } catch (err) {
      // Bulk insert failed — without this catch, the route returns 200 with
      // a sessionId that has no question rows attached, causing the practice
      // UI to render an empty session screen. Roll back the empty session
      // and surface a real error so the user can retry.
      console.error("session_questions bulk insert failed:", err);
      await prisma.practiceSession
        .delete({ where: { id: practiceSession.id } })
        .catch(() => { /* best-effort rollback */ });
      return NextResponse.json(
        { error: "Couldn't load practice questions. Please try again." },
        { status: 500 },
      );
    }

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
