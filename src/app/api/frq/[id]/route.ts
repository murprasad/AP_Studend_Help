import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/frq/[id]
 *
 * Returns the full FRQ including `rubric` and `sampleResponse`.
 * Only safe to call once the student has either submitted an attempt
 * OR explicitly clicked "reveal". The UI is responsible for guarding
 * this call — if they hit it early they've forfeited the practice value,
 * which is acceptable for an honor-system self-grade flow.
 *
 * Pass ?reveal=true or we check for an existing FrqAttempt for this user.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed } = rateLimit(session.user.id, "frq:get", 60);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const reveal = searchParams.get("reveal") === "true";

    // If not explicitly revealing, only unlock full details if the student
    // has already submitted an attempt. Beta 9.0.7 — also fetch the
    // latest attempt's studentText so the UI can rehydrate the user's
    // typed answer in the reveal echo (previously this was empty,
    // showing '(no answer recorded)' even though DB had content).
    const latestAttempt = await prisma.frqAttempt.findFirst({
      where: { userId: session.user.id, frqId: id },
      orderBy: { submittedAt: "desc" },
      select: { id: true, studentText: true, selfScore: true, submittedAt: true },
    });

    const unlocked = reveal || !!latestAttempt;

    const frq = await prisma.freeResponseQuestion.findUnique({
      where: { id },
      select: {
        id: true,
        course: true,
        unit: true,
        year: true,
        questionNumber: true,
        type: true,
        sourceUrl: true,
        promptText: true,
        stimulus: true,
        totalPoints: true,
        isApproved: true,
        rubric: unlocked,
        sampleResponse: unlocked,
      },
    });

    if (!frq || !frq.isApproved) {
      return NextResponse.json({ error: "FRQ not found" }, { status: 404 });
    }

    // Beta 9.0.7 — return latest attempt so UI can rehydrate the echo.
    // studentText is JSON-stringified Record<string,string> (or legacy
    // raw string); UI parses with parseAnswersFromStored.
    return NextResponse.json({
      frq,
      unlocked,
      latestAttempt: latestAttempt
        ? {
            studentText: latestAttempt.studentText,
            selfScore: latestAttempt.selfScore,
            submittedAt: latestAttempt.submittedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/frq/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
