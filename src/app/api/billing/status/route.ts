import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionTier: true,
      track: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeSubscriptionStatus: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const moduleSubs = await prisma.moduleSubscription.findMany({
    where: { userId: session.user.id },
    select: { module: true, status: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true },
  });

  return NextResponse.json({
    subscriptionTier: user.subscriptionTier,
    track: user.track,
    subscriptionStatus: user.stripeSubscriptionStatus,
    currentPeriodEnd: user.stripeCurrentPeriodEnd?.toISOString() ?? null,
    hasSubscriptionId: !!user.stripeSubscriptionId,
    moduleSubs: moduleSubs.map(s => ({
      module: s.module,
      status: s.status,
      currentPeriodEnd: s.stripeCurrentPeriodEnd?.toISOString() ?? null,
    })),
  });
}
