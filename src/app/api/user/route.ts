import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClepEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const track = body.track;
    const validTracks = ["ap", "sat", "act", "clep"];
    if (!validTracks.includes(track)) {
      return NextResponse.json({ error: "Invalid track" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { track },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [user, clepEnabled, moduleSubs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          gradeLevel: true,
          school: true,
          role: true,
          subscriptionTier: true,
          streakDays: true,
          longestStreak: true,
          streakFreezes: true,
          examDate: true,
          totalXp: true,
          level: true,
          lastActiveDate: true,
          track: true,
          createdAt: true,
        },
      }),
      isClepEnabled(),
      prisma.moduleSubscription.findMany({
        where: { userId: session.user.id },
        select: { module: true, status: true, stripeCurrentPeriodEnd: true },
      }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user, flags: { clepEnabled }, moduleSubs });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
