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
  if (!session?.user?.id) return NextResponse.json({ count: 0 });
  const count = await prisma.practiceSession.count({ where: { userId: session.user.id } });
  return NextResponse.json({ count });
}
