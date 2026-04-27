import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit } from "@prisma/client";
import { estimateApScore } from "@/lib/utils";
import { getCourseForUnit } from "@/lib/courses";
import { callAIWithCascade } from "@/lib/ai-providers";
import { rateLimit } from "@/lib/rate-limit";
import { detectTierUps, tierOf } from "@/lib/mastery-tier-up";

// Submit an answer for a question in a session
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed } = rateLimit(session.user.id, "practice:answer", 60);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
    }

    const body = await req.json();
    const { questionId, answer, timeSpentSecs } = body;
    const { sessionId } = params;

    if (!questionId || !answer) {
      return NextResponse.json({ error: "questionId and answer are required" }, { status: 400 });
    }

    // Verify session belongs to user
    const practiceSession = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!practiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (practiceSession.status === "COMPLETED") {
      return NextResponse.json({ error: "Session already completed" }, { status: 400 });
    }

    // Get the question to check answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Detect open-ended (FRQ) questions — options is null or empty array
    const parsedOptions = question.options
      ? (Array.isArray(question.options) ? question.options : (() => { try { return JSON.parse(question.options as string); } catch { return []; } })())
      : [];
    const isOpenEnded = parsedOptions.length === 0;

    let isCorrect: boolean;
    let frqScore: { pointsEarned: number; totalPoints: number; feedback: string; modelAnswer: string } | undefined;

    if (isOpenEnded && answer.trim().length > 10) {
      // AI rubric scoring for FRQ answers — prompt varies by question type
      const qtypeLabel = question.questionType === "CODING"
        ? "AP Computer Science Principles written response"
        : question.questionType === "DBQ"
        ? "AP Document-Based Question essay"
        : question.questionType === "LEQ"
        ? "AP Long Essay Question"
        : question.questionType === "SAQ"
        ? "AP Short Answer Question"
        : "AP Free Response Question";
      try {
        const scoringPrompt = `You are an experienced AP teacher grading a ${qtypeLabel}. Provide TEACHER-STYLE coaching feedback, not just a score.

Question: ${question.questionText}
Model Answer / Rubric: ${question.correctAnswer}
${question.explanation ? `Scoring Guidance: ${question.explanation}` : ""}
Student Response: ${answer}

Return ONLY valid JSON (no markdown, no extra text):
{
  "pointsEarned": 2,
  "totalPoints": 4,
  "feedback": "Coaching narrative in 2-3 short paragraphs. (1) ONE specific strength in the student's response — quote a phrase. (2) ONE specific weakness with a concrete fix — e.g. 'Your thesis lacks complexity in part C — try arguing X while acknowledging Y.' (3) ONE actionable tip for next time — e.g. 'For DBQ part D, always cite at least 3 documents AND analyze sourcing on 2 of them.' Sound like a teacher who genuinely wants them to improve.",
  "strengths": ["specific strength 1 (quote student's words)", "specific strength 2"],
  "weaknesses": ["specific weakness with concrete fix 1", "specific weakness 2"],
  "nextStepTip": "1-sentence actionable coaching tip",
  "modelAnswer": "complete model response earning full credit, following AP exam conventions for this question type"
}`;

        const raw = await Promise.race([
          callAIWithCascade(scoringPrompt),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("AI scoring timeout")), 15000)
          ),
        ]);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.pointsEarned === "number" && typeof parsed.totalPoints === "number") {
            // Combine teacher-coaching fields into single feedback string for
            // existing frqScore consumers that read .feedback. The structured
            // strengths/weaknesses/tip stay in the JSON for richer UI later.
            const richFeedback = parsed.feedback
              + (parsed.strengths?.length ? "\n\n**Strengths:** " + parsed.strengths.join("; ") : "")
              + (parsed.weaknesses?.length ? "\n\n**Areas to improve:** " + parsed.weaknesses.join("; ") : "")
              + (parsed.nextStepTip ? "\n\n**Next time:** " + parsed.nextStepTip : "");
            frqScore = {
              pointsEarned: parsed.pointsEarned,
              totalPoints: parsed.totalPoints,
              feedback: richFeedback,
              modelAnswer: parsed.modelAnswer ?? "",
            };
            isCorrect = frqScore.pointsEarned >= frqScore.totalPoints / 2;
          } else {
            // AI returned malformed JSON — surface as transient error so the
            // client can let the student retry. Don't record an incorrect
            // StudentResponse for what is an infrastructure failure.
            return NextResponse.json(
              {
                error: "Grading temporarily unavailable. Please try again.",
                transient: true,
              },
              { status: 503 },
            );
          }
        } else {
          // No JSON found in AI response — treat as transient failure.
          return NextResponse.json(
            {
              error: "Grading temporarily unavailable. Please try again.",
              transient: true,
            },
            { status: 503 },
          );
        }
      } catch {
        // AI scoring timed out or threw. Treat as transient — DO NOT mark
        // the student's answer as wrong (peak-AP-season Groq slow-patches
        // were causing correct FRQ responses to be recorded as incorrect,
        // tanking accuracy stats and triggering false mastery downgrades).
        return NextResponse.json(
          {
            error: "Grading temporarily unavailable. Please try again in a moment.",
            transient: true,
          },
          { status: 503 },
        );
      }
    } else {
      isCorrect = answer.toUpperCase() === question.correctAnswer.toUpperCase();
    }

    // Check if already answered in this session
    const existingResponse = await prisma.studentResponse.findFirst({
      where: { userId: session.user.id, questionId, sessionId },
    });

    if (existingResponse) {
      return NextResponse.json({
        isCorrect: existingResponse.isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    }

    // Record the response
    await prisma.studentResponse.create({
      data: {
        userId: session.user.id,
        questionId,
        sessionId,
        studentAnswer: answer,
        isCorrect,
        timeSpentSecs: timeSpentSecs || 0,
      },
    });

    // Update question stats
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        timesAnswered: { increment: 1 },
        timesCorrect: { increment: isCorrect ? 1 : 0 },
      },
      select: { timesAnswered: true, timesCorrect: true, difficulty: true },
    });

    // Performance feedback loop: auto-adjust difficulty or flag for review
    const { timesAnswered: ta, timesCorrect: tc, difficulty: currentDiff } = updatedQuestion;
    if (ta >= 50) {
      const correctRate = tc / ta;
      if (correctRate > 0.85 && currentDiff !== "EASY") {
        // Question is too easy for its labeled difficulty — downgrade one tier
        const nextDiff = currentDiff === "HARD" ? "MEDIUM" : "EASY";
        await prisma.question.update({
          where: { id: questionId },
          data: { difficulty: nextDiff },
        }).catch(() => {}); // non-blocking — don't fail the answer submission
      } else if (correctRate < 0.15) {
        // Question may be flawed or impossible — flag for admin review
        await prisma.question.update({
          where: { id: questionId },
          data: { reportedCount: { increment: 1 } },
        }).catch(() => {});
      }
    }

    // Update mastery score for this unit and detect tier-ups.
    // `updateMasteryScore` returns the before/after masteryScore snapshot so
    // we can fire-and-forget a MasteryTierUp row if a boundary was crossed.
    // CRITICAL: any failure here must NOT break the answer submission —
    // the UI has already graded; tier-up is a celebration layer.
    const tierCtx = await updateMasteryScore(session.user.id, question.unit);
    if (tierCtx && tierOf(tierCtx.after) > tierOf(tierCtx.before)) {
      const diffs = detectTierUps(
        { [question.unit]: tierCtx.before },
        { [question.unit]: tierCtx.after },
      );
      for (const d of diffs) {
        // Fire-and-forget. We intentionally don't `await` — the response to
        // the student should return with just the graded answer.
        prisma.masteryTierUp
          .create({
            data: {
              userId: session.user.id,
              course: getCourseForUnit(question.unit),
              unit: question.unit,
              beforeScore: d.beforeScore,
              afterScore: d.afterScore,
              beforeTier: d.beforeTier,
              afterTier: d.afterTier,
              sessionId,
            },
          })
          .catch((err) => {
            console.error("masteryTierUp create failed (non-blocking):", err);
          });
      }
    }

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      ...(frqScore && { frqScore }),
    });
  } catch (error) {
    console.error("POST /api/practice/[sessionId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Complete a session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId } = params;

    const practiceSession = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!practiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (practiceSession.status === "COMPLETED") {
      // Return existing summary
      const responses = await prisma.studentResponse.findMany({ where: { sessionId } });
      const correctCount = responses.filter((r) => r.isCorrect).length;
      const totalTime = responses.reduce((sum, r) => sum + r.timeSpentSecs, 0);
      const accuracy = responses.length > 0 ? (correctCount / responses.length) * 100 : 0;
      return NextResponse.json({
        session: practiceSession,
        summary: {
          totalQuestions: responses.length,
          correctAnswers: correctCount,
          accuracy: Math.round(accuracy),
          timeSpentSecs: totalTime,
          xpEarned: 0,
          apScoreEstimate: practiceSession.apScoreEstimate || 0,
        },
      });
    }

    // Get all responses for this session
    const responses = await prisma.studentResponse.findMany({
      where: { sessionId },
    });

    const correctCount = responses.filter((r) => r.isCorrect).length;
    const totalTime = responses.reduce((sum, r) => sum + r.timeSpentSecs, 0);
    const accuracy = responses.length > 0 ? (correctCount / responses.length) * 100 : 0;
    const apScore = estimateApScore(accuracy, responses.length);

    const updatedSession = await prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        correctAnswers: correctCount,
        timeSpentSecs: totalTime,
        score: accuracy,
        apScoreEstimate: apScore,
        completedAt: new Date(),
      },
    });

    // Update user XP and streak
    const xpEarned = Math.round(correctCount * 10 + (accuracy >= 80 ? 50 : 0));
    await updateUserProgress(session.user.id, xpEarned);

    // Fetch previous session accuracy for improvement comparison
    const previousSession = await prisma.practiceSession.findFirst({
      where: {
        userId: session.user.id,
        course: practiceSession.course,
        status: "COMPLETED",
        id: { not: sessionId },
      },
      orderBy: { completedAt: "desc" },
      select: { score: true },
    });

    return NextResponse.json({
      session: updatedSession,
      summary: {
        totalQuestions: responses.length,
        correctAnswers: correctCount,
        accuracy: Math.round(accuracy),
        timeSpentSecs: totalTime,
        xpEarned,
        apScoreEstimate: apScore,
        previousAccuracy: previousSession?.score != null ? Math.round(previousSession.score) : null,
      },
    });
  } catch (error) {
    console.error("PATCH /api/practice/[sessionId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateMasteryScore(
  userId: string,
  unit: ApUnit,
): Promise<{ before: number; after: number } | null> {
  try {
    const responses = await prisma.studentResponse.findMany({
      where: {
        userId,
        question: { unit },
      },
      orderBy: { answeredAt: "desc" },
      take: 50,
    });

    if (responses.length === 0) return null;

    const totalAttempts = responses.length;
    const correctAttempts = responses.filter((r) => r.isCorrect).length;
    const accuracy = (correctAttempts / totalAttempts) * 100;

    const recentResponses = responses.slice(0, 10);
    const recentAccuracy =
      recentResponses.length > 0
        ? (recentResponses.filter((r) => r.isCorrect).length / recentResponses.length) * 100
        : 0;

    const masteryScore = accuracy * 0.4 + recentAccuracy * 0.6;
    const avgTimeSecs =
      responses.reduce((sum, r) => sum + r.timeSpentSecs, 0) / totalAttempts;

    // Determine course from unit via registry lookup
    const course = getCourseForUnit(unit);

    // Capture the pre-update masteryScore so the caller can diff tiers.
    // If no row exists yet, treat before as 0 — a fresh unit jumping to e.g.
    // 25% should register as a 0→1 tier-up.
    const existing = await prisma.masteryScore.findUnique({
      where: { userId_unit: { userId, unit } },
      select: { masteryScore: true },
    });
    const before = existing?.masteryScore ?? 0;

    await prisma.masteryScore.upsert({
      where: { userId_unit: { userId, unit } },
      create: {
        userId,
        course,
        unit,
        masteryScore,
        accuracy,
        totalAttempts,
        correctAttempts,
        avgTimeSecs,
        lastPracticed: new Date(),
      },
      update: {
        course,
        masteryScore,
        accuracy,
        totalAttempts,
        correctAttempts,
        avgTimeSecs,
        lastPracticed: new Date(),
      },
    });

    return { before, after: masteryScore };
  } catch (error) {
    console.error("updateMasteryScore error:", error);
    return null;
  }
}

async function updateUserProgress(userId: string, xpEarned: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

    let newStreak = user.streakDays;
    let newFreezes = (user as { streakFreezes?: number }).streakFreezes ?? 0;
    if (lastActive) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      lastActive.setHours(0, 0, 0, 0);

      if (lastActive.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else if (lastActive.getTime() < yesterday.getTime()) {
        // Missed at least one day — try to apply a freeze token
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        const missedOneDayOnly = lastActive.getTime() === twoDaysAgo.getTime();
        if (missedOneDayOnly && newFreezes > 0) {
          // Freeze covers exactly one missed day — streak continues
          newFreezes -= 1;
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    } else {
      newStreak = 1;
    }

    // Award a freeze token for every 7-day streak milestone (weekly consistency)
    const prevStreak = user.streakDays;
    if (newStreak > prevStreak && newStreak % 7 === 0) {
      newFreezes = Math.min(newFreezes + 1, 5); // cap at 5
    }

    const newXp = user.totalXp + xpEarned;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: newXp,
        level: newLevel,
        streakDays: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak ?? 0),
        streakFreezes: newFreezes,
        lastActiveDate: new Date(),
      } as Record<string, unknown>,
    });
  } catch (error) {
    console.error("updateUserProgress error:", error);
  }
}
