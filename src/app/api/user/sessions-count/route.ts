/**
 * GET /api/user/sessions-count
 *
 * Minimal helper — returns the calling user's lifetime PracticeSession count.
 * Used by InviteParentCard to decide whether the student has a progress
 * story worth pitching to a parent.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  // D1 (2026-04-24): return 401 for anonymous, not 200 with placeholder.
  // Previous behavior leaked the API contract shape to unauthed callers
  // and blurred our auth convention (every other user-scoped route
  // returns 401). Same response shape semantics (count=0 for signed-out
  // was accurate), but status should be 401 so clients + abuse detection
  // can distinguish.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const count = await prisma.practiceSession.count({ where: { userId: session.user.id } });
  return NextResponse.json({ count });
}
