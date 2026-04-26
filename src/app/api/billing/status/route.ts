import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Cold-start defense (Beta 8.0 fix, 2026-04-26 — supersedes Beta 7.2).
  // Beta 7.2 only handled moduleSubs. The user.findUnique cold-start was
  // still 500-ing /billing on first deploy26 hit. Now BOTH queries
  // degrade — if user.findUnique throws, we return a stale-but-valid
  // FREE tier from session so the page renders and Stripe portal still
  // works. Real DB will recover on next call.
  let user: {
    subscriptionTier: string;
    track: string | null;
    stripeSubscriptionId: string | null;
    stripeCurrentPeriodEnd: Date | null;
    stripeSubscriptionStatus: string | null;
  } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        track: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripeSubscriptionStatus: true,
      },
    });
  } catch (e) {
    console.warn("[/api/billing/status] user cold-start fallback:", e instanceof Error ? e.message : String(e));
    // Stale-but-valid: assume FREE so page renders. Real tier will load
    // on the next request when isolate is warm.
    user = {
      subscriptionTier: "FREE",
      track: null,
      stripeSubscriptionId: null,
      stripeCurrentPeriodEnd: null,
      stripeSubscriptionStatus: null,
    };
  }

  if (!user) {
    user = {
      subscriptionTier: "FREE",
      track: null,
      stripeSubscriptionId: null,
      stripeCurrentPeriodEnd: null,
      stripeSubscriptionStatus: null,
    };
  }

  let moduleSubs: Array<{ module: string; status: string; stripeCurrentPeriodEnd: Date | null }> = [];
  try {
    moduleSubs = await prisma.moduleSubscription.findMany({
      where: { userId: session.user.id },
      select: { module: true, status: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true },
    });
  } catch (e) {
    console.warn("[/api/billing/status] moduleSubs cold-start fallback:", e instanceof Error ? e.message : String(e));
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
}
