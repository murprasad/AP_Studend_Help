import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit } from "@prisma/client";
import { estimateApScore } from "@/lib/utils";
import {
  computeSatSectionScore,
  familyForCourse,
  inferModule2Tier,
} from "@/lib/sat-scaled-score";
import { getCourseForUnit } from "@/lib/courses";
import { callAIWithCascade } from "@/lib/ai-providers";
import { rateLimit } from "@/lib/rate-limit";
import { detectTierUps, tierOf } from "@/lib/mastery-tier-up";

/**
 * Retry a transient Neon-HTTP failure a couple of times before giving up.
 *
 * Why: the Neon HTTP transport (no pooled connection) cold-starts per request
 * on Cloudflare Workers. The very first DB statement of a request occasionally
 * 500s / times out while the serverless endpoint warms up. For the ONE write
 * that must succeed to record a student's answer, a tiny retry turns a
 * student-visible "Failed to submit answer" into a silent recovery.
 *
 * Kept deliberately small (2 retries, short backoff) so a genuinely-broken
 * write still fails fast rather than hanging the submit.
 */
async function withNeonRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Unique-constraint (P2002) or other deterministic errors won't get
      // better on retry — only retry what looks transient (network / 5xx /
      // timeout). Anything with a Prisma error code is treated as terminal.
      const code = (err as { code?: string })?.code;
      if (code && code.startsWith("P")) throw err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 150 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

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
    } else if (answer === "__IDK__") {
      // Beta 9.1 — "I don't know" sentinel. Student admits they don't know
      // the answer. Treated as not-correct (so it doesn't pollute mastery
      // stats with false-positive correctness) but recorded distinctly via
      // the sentinel value in studentAnswer. Future analytics can split
      // honest knowledge gaps from careless wrong answers via:
      //   WHERE studentAnswer = '__IDK__'
      isCorrect = false;
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
        distractorExplanations: question.distractorExplanations ?? null,
      });
    }

    // 2026-05-28 PRD Phase 5 — optional Brainscape CBR confidence (mirror PL).
    const bodyConf = (body as { confidenceSelf?: number }).confidenceSelf;
    const confidenceSelf = (typeof bodyConf === "number" && bodyConf >= 1 && bodyConf <= 5) ? bodyConf : null;

    // ── CRITICAL WRITE ────────────────────────────────────────────────────
    // Recording the StudentResponse is the ONE write that must succeed: it is
    // what lets the student see their result and feeds every downstream stat.
    // Everything AFTER this point is SECONDARY and must never be able to fail
    // the submission (see the .catch()-wrapped writes below).
    //
    // We retry transient Neon cold-start failures here. If it STILL fails we
    // surface a `transient: true` 503 so the client lets the student retry
    // WITHOUT recording them as wrong — an infra hiccup must never cost a
    // student a correct answer or pollute mastery stats.
    try {
      await withNeonRetry(() =>
        prisma.studentResponse.create({
          data: {
            userId: session.user.id,
            questionId,
            sessionId,
            studentAnswer: answer,
            isCorrect,
            timeSpentSecs: timeSpentSecs || 0,
            confidenceSelf,
          },
        }),
      );
    } catch (createErr) {
      // P2002 = a sibling request (double-tap / retry) already recorded this
      // exact response. That's a success, not a failure — fall through and
      // return the graded result rather than erroring.
      const code = (createErr as { code?: string })?.code;
      if (code !== "P2002") {
        console.error("studentResponse.create failed after retries:", createErr);
        return NextResponse.json(
          {
            error: "Couldn't save your answer just now — please try again.",
            transient: true,
          },
          { status: 503 },
        );
      }
    }

    // 2026-05-28 — Incremental correctAnswers update (mirror PL bc00cf4+).
    // The field was only finalized at session-complete; abandoned sessions
    // displayed 0/N even when StudentResponse rows had partial correct
    // answers. The completion handler still overwrites with recomputed
    // correctCount, so a missed increment self-corrects on finish. The
    // duplicate-response guard above means retries don't double-count.
    if (isCorrect) {
      prisma.practiceSession.update({
        where: { id: sessionId },
        data: { correctAnswers: { increment: 1 } },
      }).catch(() => { /* non-critical aggregation */ });
    }

    // Update question stats — SECONDARY. A failure here used to bubble to the
    // outer catch and 500 the whole submit ("Failed to submit answer") even
    // though the StudentResponse was already saved. Wrapped in .catch() so a
    // transient Neon hiccup on this write can never fail the submission.
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        timesAnswered: { increment: 1 },
        timesCorrect: { increment: isCorrect ? 1 : 0 },
      },
      select: { timesAnswered: true, timesCorrect: true, difficulty: true },
    }).catch((err) => {
      console.error("question stats update failed (non-blocking):", err);
      return null;
    });

    // Performance feedback loop: auto-adjust difficulty or flag for review.
    // Skipped if the stats update above failed (updatedQuestion === null).
    const { timesAnswered: ta, timesCorrect: tc, difficulty: currentDiff } = updatedQuestion ?? {};
    if (updatedQuestion && ta != null && tc != null && ta >= 50) {
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
      distractorExplanations: question.distractorExplanations ?? null,
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
    // F7 (#100) 2026-05-31 — Digital SAT 200-800 scaled score. Returns null
    // for non-SAT courses; result.summary surfaces it for the UI to show
    // alongside the AP 1-5 estimate when applicable.
    // F8 (#100) — Apply Module-2-tier ceiling derived from M1 performance.
    // For SAT/PSAT sessions, order responses by sessionQuestion.order and
    // infer the tier the student would have been routed to. The result is
    // a CB-spec-shaped scaled score that respects adaptive equating.
    const satFamily = familyForCourse(practiceSession.course as string);
    let satSectionScore: ReturnType<typeof computeSatSectionScore> = null;
    // F9 (#100) 2026-05-31 — Per-content-domain subscores for SAT/PSAT.
    // CB Bluebook shows a per-domain breakout under the section score so
    // students see which of the 4 content domains is the weakest. The
    // same scaled-score curve runs against each domain's accuracy.
    let satDomainSubscores: Array<{
      unit: string;
      accuracyPercent: number;
      totalAnswered: number;
      scaledScore: number;
    }> = [];
    if (satFamily) {
      // Order responses by their sessionQuestion.order so M1 split is correct
      const sqRows = await prisma.sessionQuestion.findMany({
        where: { sessionId },
        orderBy: { order: "asc" },
        select: { questionId: true },
      });
      const responseById = new Map(responses.map((r) => [r.questionId, r]));
      const orderedResponses = sqRows
        .map((sq) => responseById.get(sq.questionId))
        .filter((r): r is NonNullable<typeof r> => !!r)
        .map((r) => ({ isCorrect: r.isCorrect }));
      const module2Tier = inferModule2Tier(orderedResponses) ?? undefined;
      satSectionScore = computeSatSectionScore({
        accuracyPercent: accuracy,
        totalAnswered: responses.length,
        family: satFamily,
        module2Tier,
      });

      // F9 — compute per-domain subscores. Load each response's
      // question.unit so we can group accuracy by content domain.
      const responsesWithUnit = await prisma.studentResponse.findMany({
        where: { sessionId },
        select: {
          isCorrect: true,
          question: { select: { unit: true } },
        },
      });
      const byUnit = new Map<string, { correct: number; total: number }>();
      for (const r of responsesWithUnit) {
        const unit = r.question?.unit;
        if (!unit) continue;
        const u = byUnit.get(unit) ?? { correct: 0, total: 0 };
        u.total += 1;
        if (r.isCorrect) u.correct += 1;
        byUnit.set(unit, u);
      }
      satDomainSubscores = Array.from(byUnit.entries())
        .map(([unit, { correct, total }]) => {
          const acc = total > 0 ? (correct / total) * 100 : 0;
          const sub = computeSatSectionScore({
            accuracyPercent: acc,
            totalAnswered: total,
            family: satFamily,
            module2Tier,
          });
          return {
            unit,
            accuracyPercent: Math.round(acc),
            totalAnswered: total,
            scaledScore: sub?.scaledScore ?? 0,
          };
        })
        // Sort weakest → strongest so the student sees the gap first.
        .sort((a, b) => a.scaledScore - b.scaledScore);
    }

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

    // Beta 8.12 funnel fix — mark onboarding done after the user completes
    // their FIRST session. This is what differentiates the new-student
    // auto-redirect (to /practice/quickstart) from the returning-student
    // experience (lands on /dashboard normally). Idempotent — only sets
    // if currently null.
    const onboardingResult = await prisma.user.updateMany({
      where: { id: session.user.id, onboardingCompletedAt: null },
      data: { onboardingCompletedAt: new Date() },
    }).catch(() => ({ count: 0 }));
    const justCompletedOnboarding = onboardingResult.count > 0;

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

    // 2026-05-28 Sprint D3 (mirrored from PL) — server is single source of
    // truth for session summary. totalQuestions reflects planned session
    // size; answeredCount is what user actually submitted; questions[] is
    // canonical per-Q rows. Client summary renders directly from this.
    const plannedTotal = updatedSession.totalQuestions || responses.length;
    const responseById = new Map(responses.map((r) => [r.questionId, r]));
    const sessionQuestions = await prisma.sessionQuestion.findMany({
      where: { sessionId },
      orderBy: { order: "asc" },
      select: { questionId: true, order: true },
    });
    const questionRows = sessionQuestions.map((sq) => {
      const r = responseById.get(sq.questionId);
      return {
        questionId: sq.questionId,
        order: sq.order,
        answered: !!r,
        isCorrect: r?.isCorrect ?? null,
        timeSpentSecs: r?.timeSpentSecs ?? null,
      };
    });

    const response = NextResponse.json({
      session: updatedSession,
      summary: {
        totalQuestions: plannedTotal,
        correctAnswers: correctCount,
        answeredCount: responses.length,
        accuracy: plannedTotal > 0 ? Math.round((correctCount / plannedTotal) * 100) : 0,
        timeSpentSecs: totalTime,
        xpEarned,
        apScoreEstimate: apScore,
        // F7 — Digital SAT scaled section score (200-800 SAT / 160-760 PSAT).
        // null for non-SAT courses; UI conditionally renders.
        satScaledScore: satSectionScore?.scaledScore ?? null,
        satScaleMin: satSectionScore?.scaleMin ?? null,
        satScaleMax: satSectionScore?.scaleMax ?? null,
        // F9 — per-content-domain subscores (4 domains per section,
        // sorted weakest first). Empty for non-SAT courses.
        satDomainSubscores,
        previousAccuracy: previousSession?.score != null ? Math.round(previousSession.score) : null,
        questions: questionRows,
      },
    });

    // Beta 9.0.3 hotfix (2026-04-29) — set onboarding_completed cookie
    // ALWAYS at session-complete (not just when DB transitions). Reason:
    // user's JWT may have onboardingCompletedAt=null even when DB has a
    // date (sign-in happened pre-Beta-9, JWT cached null, DB later updated
    // by a PATCH that ran 200ms ago). The 9.0.2 fix only set the cookie
    // when DB transitioned, missing the case where DB was already set
    // from a prior session but JWT was still null. Setting cookie always
    // is safe — middleware only reads the bridge when JWT says null,
    // and only honors it for "user has finished at least one session."
    // (justCompletedOnboarding is preserved as a signal but no longer
    //  gates the cookie — see Task #36/#37 followup for proper JWT
    //  refresh on session complete.)
    // 2026-05-01 — cookie value is now the userId (not "true") so a
    // cookie left in the browser by a different user can't bypass the
    // /journey redirect for a fresh user on the same machine. Middleware
    // requires cookie value === JWT.id.
    response.cookies.set("onboarding_completed", session.user.id, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day — long enough to bridge until JWT refresh
      sameSite: "lax",
      httpOnly: false,
    });
    // Reference justCompletedOnboarding to keep the variable used (for
    // future analytics or response-payload extension).
    void justCompletedOnboarding;

    return response;
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

/**
 * 2026-05-27 — Atomic-safe rewrite per design audit P0 finding.
 *
 * See PL companion fix for the full incident write-up. Summary: the
 * previous read-modify-write pattern lost XP increments + double-counted
 * streaks under concurrent answer submits (two tabs, double-tap, retry).
 *
 * New shape:
 *  - XP is incremented via atomic SQL UPDATE (row-level safe on Neon HTTP).
 *  - Streak math is gated on "first submit of the day" — subsequent
 *    submits the same calendar day skip the streak path entirely.
 */
async function updateUserProgress(userId: string, xpEarned: number) {
  try {
    if (xpEarned <= 0) return;

    await prisma.$executeRawUnsafe(
      `UPDATE users
         SET "totalXp" = "totalXp" + $1,
             level     = FLOOR(SQRT(("totalXp" + $1) / 100.0)) + 1
       WHERE id = $2`,
      xpEarned,
      userId,
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakDays: true, longestStreak: true, streakFreezes: true, lastActiveDate: true },
    });
    if (!user) return;

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) {
      const lastActiveDay = new Date(lastActive);
      lastActiveDay.setHours(0, 0, 0, 0);
      if (lastActiveDay.getTime() === today.getTime()) {
        // Already counted today — sibling request handled streak. Only
        // touch lastActiveDate so heartbeat stays current.
        await prisma.user.update({
          where: { id: userId },
          data: { lastActiveDate: now },
        });
        return;
      }
    }

    let newStreak = user.streakDays;
    let newFreezes = user.streakFreezes ?? 0;
    if (lastActive) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastActiveDay = new Date(lastActive);
      lastActiveDay.setHours(0, 0, 0, 0);

      if (lastActiveDay.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else if (lastActiveDay.getTime() < yesterday.getTime()) {
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        const missedOneDayOnly = lastActiveDay.getTime() === twoDaysAgo.getTime();
        if (missedOneDayOnly && newFreezes > 0) {
          newFreezes -= 1;
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    } else {
      newStreak = 1;
    }

    const prevStreak = user.streakDays;
    if (newStreak > prevStreak && newStreak % 7 === 0) {
      newFreezes = Math.min(newFreezes + 1, 5);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        streakDays: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak ?? 0),
        streakFreezes: newFreezes,
        lastActiveDate: now,
      },
    });
  } catch (error) {
    console.error("updateUserProgress error:", error);
  }
}
