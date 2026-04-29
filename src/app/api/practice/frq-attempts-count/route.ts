// Beta 8.13.3 — count of FRQ-type submissions (DBQ/LEQ/SAQ/FRQ/CODING)
// per user+course. Used by FrqTasteNudge to decide whether to surface the
// "try a real FRQ" CTA on the MCQ session-summary screen (only when 0
// prior attempts).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, QuestionType } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const course = url.searchParams.get("course") as ApCourse | null;
  if (!course || !VALID_AP_COURSES.includes(course)) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  // Beta 9.1.1 fix — count BOTH:
  //   (a) studentResponse rows where question is FRQ-type (legacy MCQ
  //       session with FRQ questionType — older path)
  //   (b) frqAttempt rows for this course (current /frq-practice +
  //       /api/frq/[id]/submit path — what real users actually use)
  // Original code only counted (a), so users submitting via the dedicated
  // FRQ flow stayed at count=0 → FrqTasteNudge kept showing forever.
  const [legacyCount, dedicatedCount] = await Promise.all([
    prisma.studentResponse.count({
      where: {
        userId: session.user.id,
        question: {
          course,
          questionType: { in: [QuestionType.DBQ, QuestionType.LEQ, QuestionType.SAQ, QuestionType.FRQ, QuestionType.CODING] },
        },
      },
    }),
    prisma.frqAttempt.count({
      where: {
        userId: session.user.id,
        frq: { course },
      },
    }),
  ]);

  return NextResponse.json({ count: legacyCount + dedicatedCount });
}
