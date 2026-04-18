import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, ApUnit } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/frq?course=AP_PHYSICS_1&unit=PHY1_1_KINEMATICS&limit=5
 *
 * Returns a list of FRQs matching the filter. Excludes `rubric` and
 * `sampleResponse` — those are revealed only after the student submits
 * via POST /api/frq/[id]/submit, or explicitly requests reveal via GET
 * /api/frq/[id].
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed } = rateLimit(session.user.id, "frq:list", 60);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const course = searchParams.get("course") as ApCourse | null;
    const unit = searchParams.get("unit") as ApUnit | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    if (!course) {
      return NextResponse.json({ error: "course query param is required" }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      course,
      isApproved: true,
      ...(unit && unit !== ("ALL" as unknown) && { unit }),
    };

    const frqs = await prisma.freeResponseQuestion.findMany({
      where,
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
      },
      orderBy: [{ year: "desc" }, { questionNumber: "asc" }],
      take: limit,
    });

    return NextResponse.json({ frqs });
  } catch (error) {
    console.error("GET /api/frq error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
