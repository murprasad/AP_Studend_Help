/**
 * POST /api/analytics/dashboard-event
 *
 * Lightweight, fire-and-forget funnel instrumentation for the
 * Dashboard → Coach Card → CTA click path. Writes one row of
 * `DashboardImpression` per dashboard view, then patches the same
 * row as the user moves through the funnel.
 *
 * Design rules:
 *   - Non-blocking: any server-side failure returns 200 `{ ok: false }`
 *     so the dashboard never crashes on an analytics hiccup.
 *   - No PII beyond the signed-in userId, the course string, the CTA
 *     type, and the projected score. No IP, no user-agent.
 *   - Auth required (session.user.id) — users can only write for
 *     themselves.
 *
 * Event model:
 *   loaded            → create row, return { impressionId }
 *   coach_requested   → stamp coachPlanRequestedAt
 *   coach_rendered    → stamp coachPlanRenderedAt + ctaType + roughScore
 *   coach_clicked     → stamp coachPlanCtaClickedAt
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Event = "loaded" | "coach_requested" | "coach_rendered" | "coach_clicked";

interface Body {
  impressionId?: string;
  course?: string;
  event?: Event;
  ctaType?: string;
  roughScore?: number;
}

function ok(extra: Record<string, unknown> = {}) {
  // Always 200 so the client never sees an analytics failure as an error.
  return NextResponse.json({ ok: true, ...extra });
}

function silentFail() {
  return NextResponse.json({ ok: false });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return silentFail();
    const userId = session.user.id;

    // Body can arrive as plain JSON (normal fetch) or a Blob from
    // navigator.sendBeacon (the CTA path). Both end up with the same
    // JSON payload.
    let body: Body = {};
    try {
      body = (await req.json()) as Body;
    } catch {
      return silentFail();
    }

    const { event, course, impressionId, ctaType, roughScore } = body;
    if (!event) return silentFail();

    // Hard log: write every inbound event into funnel_events before the
    // aggregated DashboardImpression logic runs. If the aggregated counters
    // later show 0 for `coach_requested`, we can diff against this table to
    // see whether the client was actually firing and the problem is in the
    // join (impressionId mismatch) rather than the event itself.
    try {
      await prisma.funnelEvent.create({
        data: {
          userId,
          event: String(event).slice(0, 32),
          course: course ? String(course).slice(0, 64) : null,
          impressionId: impressionId ? String(impressionId).slice(0, 64) : null,
          ctaType: ctaType ? String(ctaType).slice(0, 64) : null,
          roughScore: typeof roughScore === "number" && Number.isFinite(roughScore) ? roughScore : null,
        },
      });
    } catch {
      // Never let the raw log block the aggregate update.
    }

    if (event === "loaded") {
      if (!course) return silentFail();
      // Defensive clamp — keep the column small and predictable.
      const courseStr = String(course).slice(0, 64);
      const row = await prisma.dashboardImpression.create({
        data: { userId, course: courseStr },
        select: { id: true },
      });
      return ok({ impressionId: row.id });
    }

    if (!impressionId) return silentFail();
    // Synthetic ids from the client-side race fallback won't match any
    // DashboardImpression row. That's fine — the funnel_events row above
    // captures them. `updateMany` returns count:0 silently for no match.

    // For all the downstream events, scope writes to rows owned by
    // this user. If the row doesn't exist (e.g. user opened multiple
    // tabs or the page crashed before `loaded` landed), this is a
    // no-op — updateMany returns count: 0 and we don't throw.
    if (event === "coach_requested") {
      await prisma.dashboardImpression.updateMany({
        where: { id: impressionId, userId },
        data: { coachPlanRequestedAt: new Date() },
      });
      return ok();
    }

    if (event === "coach_rendered") {
      await prisma.dashboardImpression.updateMany({
        where: { id: impressionId, userId },
        data: {
          coachPlanRenderedAt: new Date(),
          ctaType: ctaType ? String(ctaType).slice(0, 64) : null,
          roughScore: typeof roughScore === "number" && Number.isFinite(roughScore) ? roughScore : null,
        },
      });
      return ok();
    }

    if (event === "coach_clicked") {
      await prisma.dashboardImpression.updateMany({
        where: { id: impressionId, userId },
        data: { coachPlanCtaClickedAt: new Date() },
      });
      return ok();
    }

    return silentFail();
  } catch {
    // Analytics must never surface as a user-visible failure.
    return silentFail();
  }
}
