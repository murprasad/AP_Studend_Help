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
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeSubscriptionStatus: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.stripeSubscriptionStatus,
    currentPeriodEnd: user.stripeCurrentPeriodEnd?.toISOString() ?? null,
    hasSubscriptionId: !!user.stripeSubscriptionId,
  });
}
