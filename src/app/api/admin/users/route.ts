/**
 * GET /api/admin/users?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns all users (free + premium) who signed up in the date range,
 * plus total revenue earned from premium subscriptions in that range.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  // Build date filter
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (startStr) dateFilter.gte = new Date(startStr + "T00:00:00Z");
  if (endStr) dateFilter.lte = new Date(endStr + "T23:59:59.999Z");

  const whereClause = Object.keys(dateFilter).length > 0
    ? { createdAt: dateFilter }
    : {};

  // Fetch users in range
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      gradeLevel: true,
      subscriptionTier: true,
      track: true,
      createdAt: true,
      moduleSubscriptions: {
        select: {
          module: true,
          status: true,
          stripeCurrentPeriodEnd: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate revenue from premium users in the date range
  let totalFree = 0;
  let totalPremium = 0;
  let monthlyCount = 0;
  let annualCount = 0;

  for (const u of users) {
    const activeSubs = u.moduleSubscriptions.filter(
      (ms) => ms.status === "active" || ms.status === "canceling"
    );

    if (activeSubs.length === 0 && u.subscriptionTier === "FREE") {
      totalFree++;
    } else if (activeSubs.length > 0) {
      totalPremium++;
      for (const ms of activeSubs) {
        const isAnnual =
          ms.stripeCurrentPeriodEnd &&
          (ms.stripeCurrentPeriodEnd.getTime() - ms.createdAt.getTime()) /
            (1000 * 60 * 60 * 24) > 180;
        if (isAnnual) annualCount++;
        else monthlyCount++;
      }
    } else if (u.subscriptionTier !== "FREE") {
      // Legacy premium without module subscriptions
      totalPremium++;
      monthlyCount++;
    } else {
      totalFree++;
    }
  }

  const totalRevenueMonthly = monthlyCount * 9.99 + annualCount * (79.99 / 12);
  const totalRevenueAnnual = monthlyCount * 9.99 * 12 + annualCount * 79.99;

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
      email: u.email,
      gradeLevel: u.gradeLevel,
      tier: u.subscriptionTier,
      track: u.track,
      signedUp: u.createdAt,
      subscriptions: u.moduleSubscriptions.map((ms) => ({
        module: ms.module,
        status: ms.status,
      })),
    })),
    stats: {
      total: users.length,
      free: totalFree,
      premium: totalPremium,
      monthlyPlans: monthlyCount,
      annualPlans: annualCount,
      estimatedMRR: Math.round(totalRevenueMonthly * 100) / 100,
      estimatedARR: Math.round(totalRevenueAnnual * 100) / 100,
    },
  });
}
