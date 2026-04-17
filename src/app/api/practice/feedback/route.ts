import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, rating, feedbackText, context } = await req.json();
  if (!sessionId || (rating !== 1 && rating !== -1)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  // A22.6 — optional free-text (500-char cap to bound DB bloat) and
  // context tag ("completion" | "abandon") distinguishing why the popup
  // fired. Both default to null to preserve the pre-A22.6 contract.
  const trimmedText = typeof feedbackText === "string" && feedbackText.trim().length > 0
    ? feedbackText.trim().slice(0, 500)
    : null;
  const normalizedContext: "completion" | "abandon" | null =
    context === "abandon" ? "abandon" : context === "completion" ? "completion" : null;

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
    update: { rating, feedbackText: trimmedText, context: normalizedContext },
    create: { sessionId, userId: session.user.id, rating, feedbackText: trimmedText, context: normalizedContext },
  });

  return NextResponse.json({ ok: true });
}
