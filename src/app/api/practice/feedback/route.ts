import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, rating } = await req.json();
  if (!sessionId || (rating !== 1 && rating !== -1)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Verify the session belongs to this user
  const practiceSession = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    select: { id: true },
  });
  if (!practiceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.sessionFeedback.upsert({
    where: { sessionId },
    update: { rating },
    create: { sessionId, userId: session.user.id, rating },
  });

  return NextResponse.json({ ok: true });
}
