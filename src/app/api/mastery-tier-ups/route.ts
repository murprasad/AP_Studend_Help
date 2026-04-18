import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { AP_UNITS, AP_COURSES } from "@/lib/utils";
import { projectImprovement } from "@/lib/pass-engine";

export const dynamic = "force-dynamic";

// Rough AP-score delta per tier crossed. Tuned to feel believable, not greedy.
// Crossing low tiers matters more (filling a hole); crossing the top tier
// yields the biggest confidence boost. Values are "projected AP points"
// (0.1–0.4) per the PRD spec; caller multiplies by tiers crossed this event.
const PROJECTED_AP_DELTA_PER_TIER: Record<number, number> = {
  1: 0.15, // 0 → 20
  2: 0.25, // 20 → 40
  3: 0.30, // 40 → 60
  4: 0.40, // 60 → 80 or 80 → 100
};

// GET /api/mastery-tier-ups — returns UNREAD tier-ups for the signed-in user.
// "Unread" = shownAt IS NULL. Sorted newest-first so the UI shows the latest
// win on top.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(session.user.id, "mastery-tier-ups:get", 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const rows = await prisma.masteryTierUp.findMany({
    where: { userId: session.user.id, shownAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const tierUps = rows.map((row) => {
    const tiersCrossed = Math.max(1, row.afterTier - row.beforeTier);
    // Take the highest-tier boundary the user crossed for the delta (a 0→2
    // jump is more impressive than 0→1, so weight by the top tier reached).
    const perTier = PROJECTED_AP_DELTA_PER_TIER[row.afterTier] ?? 0.15;
    const projectedScoreDelta = +(perTier * tiersCrossed).toFixed(2);

    // Also surface a pass-% projection delta so the celebration card can
    // show "+X pp projected over 7 days if you keep up this pace" — wired
    // through the existing predictor so we don't double-track logic.
    // We interpret the tier-up as roughly 1 day of compounding improvement,
    // measured from the afterScore baseline.
    const passDelta = +(
      projectImprovement(row.afterScore, 1) - row.afterScore
    ).toFixed(1);

    return {
      id: row.id,
      course: row.course,
      courseName: AP_COURSES[row.course] ?? String(row.course),
      unit: row.unit,
      unitName: AP_UNITS[row.unit] ?? String(row.unit),
      beforeScore: Math.round(row.beforeScore),
      afterScore: Math.round(row.afterScore),
      beforeTier: row.beforeTier,
      afterTier: row.afterTier,
      projectedScoreDelta,
      projectedPassPercentDelta: passDelta,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ tierUps });
}

// PATCH /api/mastery-tier-ups — marks a tier-up as shown so it stops
// appearing on the dashboard. Body: { id }.
//
// Negative cases (documented, not exhaustive):
//   - missing id                → 400
//   - id belongs to another user → 404 (don't leak existence)
//   - id already shown           → idempotent, returns ok
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(session.user.id, "mastery-tier-ups:patch", 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const id = body && typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const row = await prisma.masteryTierUp.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.masteryTierUp.update({
    where: { id },
    data: { shownAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
