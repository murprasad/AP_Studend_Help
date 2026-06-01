/**
 * 2026-05-31 — F16 (#100 SAT=CB parity).
 *
 * GET /api/mock-exam/free-adaptive-status?course=SAT_MATH
 *
 * Reports how many of the 8 free adaptive (SAT/PSAT) full-length mocks
 * the current user has consumed. Used by the mock-exam intro UI to:
 *   - show "X/8 free mocks remaining" badge for free SAT/PSAT students
 *   - skip the 5-Q partial paywall while the student has free mocks left
 *
 * Premium users are NOT subject to this cap — the count is informational.
 * Non-adaptive courses don't use this endpoint.
 *
 * Returns 401 when unauthenticated. Returns 200 always when authed; the
 * response always includes `course`, `mocksUsed`, `mocksRemaining`,
 * `hasFreeMocksLeft`.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FREE_LIMITS } from "@/lib/tier-limits";
import { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

const ADAPTIVE: ReadonlySet<string> = new Set([
  "SAT_MATH",
  "SAT_READING_WRITING",
  "PSAT_MATH",
  "PSAT_READING_WRITING",
]);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") ?? "") as string;
    if (!ADAPTIVE.has(course)) {
      return NextResponse.json({
        course,
        isAdaptive: false,
        mocksUsed: 0,
        mocksRemaining: 0,
        hasFreeMocksLeft: false,
      });
    }

    const mocksUsed = await prisma.practiceSession.count({
      where: {
        userId: session.user.id,
        course: course as ApCourse,
        sessionType: "MOCK_EXAM",
      },
    });
    const cap = FREE_LIMITS.freeAdaptiveMocksLifetime;
    const remaining = Math.max(0, cap - mocksUsed);
    return NextResponse.json({
      course,
      isAdaptive: true,
      cap,
      mocksUsed,
      mocksRemaining: remaining,
      hasFreeMocksLeft: remaining > 0,
    });
  } catch (e) {
    console.error("[/api/mock-exam/free-adaptive-status] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
