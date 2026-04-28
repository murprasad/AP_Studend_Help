import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Cached in module scope for 1h to avoid hammering DB on every page render.
// CF Workers warm instances persist this; cold starts hit DB once.
type Cached = { ts: number; data: SocialProof };
let cached: Cached | null = null;
const TTL_MS = 60 * 60 * 1000;

interface SocialProof {
  totalStudents: number;
  activeWeek: number;
  questionsAnsweredWeek: number;
  totalApprovedQuestions: number;
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) {
    return NextResponse.json(cached.data, { headers: { "Cache-Control": "public, max-age=3600" } });
  }
  try {
    const [students, activeRows, answeredRows, qBank] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.studentResponse.findMany({
        where: { answeredAt: { gt: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.studentResponse.count({
        where: { answeredAt: { gt: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.question.count({ where: { isApproved: true } }),
    ]);
    const data: SocialProof = {
      totalStudents: students,
      activeWeek: activeRows.length,
      questionsAnsweredWeek: answeredRows,
      totalApprovedQuestions: qBank,
    };
    cached = { ts: now, data };
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({
      totalStudents: 100,
      activeWeek: 30,
      questionsAnsweredWeek: 400,
      totalApprovedQuestions: 10000,
    }, { headers: { "Cache-Control": "public, max-age=300" } });
  }
}
