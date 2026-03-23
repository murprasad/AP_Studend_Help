/**
 * GET /api/admin/subscribers
 *
 * Returns all premium subscribers with details:
 * - User info (name, email, signup date)
 * - Module subscriptions (ap/sat/act/clep)
 * - Plan type (monthly/annual) derived from period length
 * - Status (active/canceling/canceled)
 * - Aggregate stats: total subscribers, total monthly revenue
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all users with active or canceling module subscriptions
  const subscribers = await prisma.user.findMany({
    where: {
      moduleSubscriptions: {
        some: {
          status: { in: ["active", "canceling"] },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      track: true,
      moduleSubscriptions: {
        select: {
          module: true,
          status: true,
          stripeSubscriptionId: true,
          stripeCurrentPeriodEnd: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Also check legacy subscriptions (users with subscriptionTier != FREE but no ModuleSubscription)
  const legacyPremium = await prisma.user.findMany({
    where: {
      subscriptionTier: { not: "FREE" },
      moduleSubscriptions: { none: {} },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      track: true,
      subscriptionTier: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeSubscriptionStatus: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Determine plan type from period length
  function getPlanType(periodEnd: Date | null, createdAt: Date): "monthly" | "annual" | "unknown" {
    if (!periodEnd) return "unknown";
    const diffDays = (periodEnd.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 180 ? "annual" : "monthly";
  }

  // Build unified subscriber list
  const moduleSubscribers = subscribers.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
    email: u.email,
    signedUp: u.createdAt,
    track: u.track,
    subscriptions: u.moduleSubscriptions.map((ms) => ({
      module: ms.module,
      status: ms.status,
      planType: getPlanType(ms.stripeCurrentPeriodEnd, ms.createdAt),
      renewsAt: ms.stripeCurrentPeriodEnd,
      subscribedAt: ms.createdAt,
    })),
  }));

  const legacySubscribers = legacyPremium.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
    email: u.email,
    signedUp: u.createdAt,
    track: u.track,
    subscriptions: [{
      module: u.track || "ap",
      status: u.stripeSubscriptionStatus || "active",
      planType: getPlanType(u.stripeCurrentPeriodEnd, u.createdAt),
      renewsAt: u.stripeCurrentPeriodEnd,
      subscribedAt: u.createdAt,
    }],
  }));

  const allSubscribers = [...moduleSubscribers, ...legacySubscribers];

  // Aggregate stats
  const totalActive = allSubscribers.filter((s) =>
    s.subscriptions.some((sub) => sub.status === "active")
  ).length;

  let monthlyCount = 0;
  let annualCount = 0;
  for (const s of allSubscribers) {
    for (const sub of s.subscriptions) {
      if (sub.status !== "active" && sub.status !== "canceling") continue;
      if (sub.planType === "annual") annualCount++;
      else monthlyCount++;
    }
  }

  const monthlyRevenue = (monthlyCount * 9.99) + (annualCount * (79.99 / 12));
  const annualRevenue = (monthlyCount * 9.99 * 12) + (annualCount * 79.99);

  return NextResponse.json({
    subscribers: allSubscribers,
    stats: {
      totalSubscribers: allSubscribers.length,
      totalActive,
      monthlyPlans: monthlyCount,
      annualPlans: annualCount,
      estimatedMRR: Math.round(monthlyRevenue * 100) / 100,
      estimatedARR: Math.round(annualRevenue * 100) / 100,
    },
  });
}
