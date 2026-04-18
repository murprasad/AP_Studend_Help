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
    // has already submitted an attempt.
    const hasAttempt = await prisma.frqAttempt.findFirst({
      where: { userId: session.user.id, frqId: id },
      select: { id: true },
    });

    const unlocked = reveal || !!hasAttempt;

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

    return NextResponse.json({ frq, unlocked });
  } catch (error) {
    console.error("GET /api/frq/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
