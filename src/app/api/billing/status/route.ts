import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Cold-start defense (Beta 7.2, 2026-04-25): two Prisma calls without
  // try/catch were causing a 5xx on /billing during deploy19's
  // persona-b-sidebar-walk run when CF Worker isolates were fresh.
  // Wrap each query so one cold-start hiccup degrades the response
  // gracefully rather than 500-ing the whole billing page.
  try {
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

    let moduleSubs: Array<{ module: string; status: string; stripeCurrentPeriodEnd: Date | null }> = [];
    try {
      moduleSubs = await prisma.moduleSubscription.findMany({
        where: { userId: session.user.id },
        select: { module: true, status: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true },
      });
    } catch (e) {
      console.warn("[/api/billing/status] moduleSubs cold-start fallback:", e instanceof Error ? e.message : String(e));
      // Empty array degrades gracefully — billing page renders the user-row
      // tier without per-module rows. Better than a 500.
    }

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
  } catch (e) {
    console.error("[/api/billing/status] error:", e);
    return NextResponse.json({ error: "Failed to load billing status" }, { status: 500 });
  }
}
