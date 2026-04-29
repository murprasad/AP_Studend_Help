import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { FREE_LIMITS } from "@/lib/tier-limits";
import { hasAnyPremium, isPremiumForTrack } from "@/lib/tiers";
import type { ModuleSub } from "@/lib/tiers";

/**
 * POST /api/frq/[id]/submit
 *
 * Body: { studentText: string | Record<string,string>, selfScore?: number }
 *
 * - Legacy callers send a raw string (1 per-FRQ textarea).
 * - New per-type callers send a keyed record (e.g. SAQ -> {A, B, C},
 *   DBQ -> {essay}, multi-part -> {a, b, c, ...}).
 *
 * Either shape is accepted: we JSON-stringify the record before writing to
 * `FrqAttempt.studentText`, so the Prisma column stays `String @db.Text` and
 * the 10 existing Physics rows keep working.
 *
 * Creates an FrqAttempt row and returns the full FRQ with rubric +
 * sampleResponse so the UI can render the self-grade comparison view.
 *
 * No AI grading — the student compares their answer to the rubric and
 * records their own score (0..totalPoints).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed } = rateLimit(session.user.id, "frq:submit", 60);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
    }

    const { id } = params;
    const body = (await req.json().catch(() => ({}))) as {
      studentText?: unknown;
      selfScore?: number;
    };

    // Coerce either shape into a canonical string for storage. Records become
    // JSON (so the reveal flow can rehydrate keyed answers); strings pass
    // through as-is.
    const studentText = coerceStudentText(body.studentText);
    const selfScore = typeof body.selfScore === "number" ? body.selfScore : null;

    if (!studentText) {
      return NextResponse.json({ error: "studentText is required" }, { status: 400 });
    }
    if (studentText.length > 20000) {
      return NextResponse.json({ error: "studentText exceeds 20k chars" }, { status: 400 });
    }

    const frq = await prisma.freeResponseQuestion.findUnique({
      where: { id },
    });

    if (!frq || !frq.isApproved) {
      return NextResponse.json({ error: "FRQ not found" }, { status: 404 });
    }

    if (selfScore !== null && (selfScore < 0 || selfScore > frq.totalPoints)) {
      return NextResponse.json(
        { error: `selfScore must be between 0 and ${frq.totalPoints}` },
        { status: 400 }
      );
    }

    // Beta 9.0.8 — enforce per-type/per-course free attempt cap. Without
    // this, free users can submit unlimited FRQ attempts via this route
    // (the cap on /api/practice only covered the MCQ-session-with-FRQ-type
    // path, not the dedicated /frq-practice flow).
    const userTrack = session.user.track ?? "ap";
    const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    const hasPremium = isAdmin || hasAnyPremium(moduleSubs) || isPremiumForTrack(session.user.subscriptionTier, userTrack);

    if (!hasPremium) {
      const frqTypeKey = frq.type.toLowerCase();
      const limitKey = (
        frqTypeKey === "dbq" ? "dbqFreeAttemptsPerCourse" :
        frqTypeKey === "leq" ? "leqFreeAttemptsPerCourse" :
        frqTypeKey === "saq" ? "saqFreeAttemptsPerCourse" :
        "frqFreeAttemptsPerCourse"
      ) as keyof typeof FREE_LIMITS;
      const limit = FREE_LIMITS[limitKey] as number;

      // Count distinct FRQs of this type in this course where the user has
      // already attempted. Multiple attempts on the SAME FRQ count as 1
      // ("free re-attempt with fresh eyes" is fine; cap is on coverage, not
      // re-tries). Distinct count avoids counting a 2nd attempt on the
      // same FRQ as a 2nd cap consumption.
      const distinctFrqsAttempted = await prisma.frqAttempt.findMany({
        where: {
          userId: session.user.id,
          frq: { type: frq.type, course: frq.course },
        },
        select: { frqId: true },
        distinct: ["frqId"],
      });
      const distinctCount = distinctFrqsAttempted.length;
      const alreadyAttemptedThisFrq = distinctFrqsAttempted.some((a) => a.frqId === id);

      // Block if: user is at cap AND this is a NEW FRQ (not a re-attempt
      // of one they've already started).
      if (distinctCount >= limit && !alreadyAttemptedThisFrq) {
        return NextResponse.json({
          error: `You've used your free ${frq.type} attempt for this course. Premium unlocks unlimited attempts + detailed coaching.`,
          limitExceeded: true,
          limitType: "frq_per_type_cap",
          attemptsUsed: distinctCount,
          attemptsAllowed: limit,
          upgradeUrl: `/billing?utm_source=frq_cap&utm_campaign=frq_taste&type=${frq.type}`,
        }, { status: 403 });
      }
    }

    // Record the attempt. Multiple attempts per FRQ are allowed — gives the
    // student room to come back and try again with fresh eyes.
    await prisma.frqAttempt.create({
      data: {
        userId: session.user.id,
        frqId: id,
        studentText,
        selfScore,
        revealed: true,
      },
    });

    // Return the full FRQ so the UI can render rubric + sample response.
    return NextResponse.json({
      frq: {
        id: frq.id,
        course: frq.course,
        unit: frq.unit,
        year: frq.year,
        questionNumber: frq.questionNumber,
        type: frq.type,
        sourceUrl: frq.sourceUrl,
        promptText: frq.promptText,
        stimulus: frq.stimulus,
        totalPoints: frq.totalPoints,
        rubric: frq.rubric,
        sampleResponse: frq.sampleResponse,
      },
    });
  } catch (error) {
    console.error("POST /api/frq/[id]/submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Accept either a raw string (legacy) or a Record<string,string> (new
 * per-type inputs) and return the canonical string we'll write to
 * `FrqAttempt.studentText`. Invalid shapes return "" so the caller can 400.
 */
function coerceStudentText(input: unknown): string {
  if (typeof input === "string") return input.trim();
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const record: Record<string, string> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (typeof v === "string") record[k] = v;
    }
    const anyContent = Object.values(record).some(
      (v) => v.trim().length > 0
    );
    if (!anyContent) return "";
    return JSON.stringify(record);
  }
  return "";
}
