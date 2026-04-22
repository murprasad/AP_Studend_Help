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

      // Capture location from Cloudflare Workers request headers. Free,
      // automatic via the CF edge; no paid geolocation service. Stored
      // on User so admin Recent Signups + Users list show country / city.
      // Fire-and-forget — raw SQL for the same CF Workers HTTP-adapter
      // reliability reason as the coach-funnel UPDATE fixes.
      try {
        const h = req.headers;
        const country = (h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? "").slice(0, 8) || null;
        const region  = (h.get("cf-region")    ?? h.get("x-vercel-ip-country-region") ?? "").slice(0, 64) || null;
        const city    = (h.get("cf-city")      ?? h.get("x-vercel-ip-city") ?? "").slice(0, 64) || null;
        const postal  = (h.get("cf-postal-code") ?? "").slice(0, 16) || null;
        // Only write if we got at least one field — no point dirtying
        // updatedAt when nothing changes.
        if (country || region || city || postal) {
          await prisma.$executeRawUnsafe(
            `UPDATE "users"
             SET "lastLoginCountry" = COALESCE($1, "lastLoginCountry"),
                 "lastLoginRegion"  = COALESCE($2, "lastLoginRegion"),
                 "lastLoginCity"    = COALESCE($3, "lastLoginCity"),
                 "lastLoginPostalCode" = COALESCE($4, "lastLoginPostalCode"),
                 "lastLoginLocationAt" = NOW()
             WHERE id = $5`,
            country, region, city, postal, userId,
          );
        }
      } catch {
        // Never let a geolocation write block the impression return.
      }

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
    // HOTFIX 2026-04-22: Prisma `updateMany` on the HTTP adapter was
    // silently dropping updates on CF Workers — 49 real-CUID
    // coach_requested events fired in 48h but 0 updated the aggregate
    // row (verified by direct DB read showing coachPlanRequestedAt
    // still null on rows whose id+userId matched the inbound event).
    // Switched to $executeRawUnsafe which CLAUDE.md Architecture §2
    // already documents as the known-good path for write-path writes
    // on the HTTP adapter.
    if (event === "coach_requested") {
      await prisma.$executeRawUnsafe(
        `UPDATE "dashboard_impressions" SET "coachPlanRequestedAt" = NOW() WHERE id = $1 AND "userId" = $2`,
        impressionId,
        userId,
      );
      return ok();
    }

    if (event === "coach_rendered") {
      const ctaTypeStr = ctaType ? String(ctaType).slice(0, 64) : null;
      const roughScoreNum = typeof roughScore === "number" && Number.isFinite(roughScore) ? roughScore : null;
      await prisma.$executeRawUnsafe(
        `UPDATE "dashboard_impressions"
         SET "coachPlanRenderedAt" = NOW(),
             "ctaType" = $3,
             "roughScore" = $4
         WHERE id = $1 AND "userId" = $2`,
        impressionId,
        userId,
        ctaTypeStr,
        roughScoreNum,
      );
      return ok();
    }

    if (event === "coach_clicked") {
      await prisma.$executeRawUnsafe(
        `UPDATE "dashboard_impressions" SET "coachPlanCtaClickedAt" = NOW() WHERE id = $1 AND "userId" = $2`,
        impressionId,
        userId,
      );
      return ok();
    }

    return silentFail();
  } catch {
    // Analytics must never surface as a user-visible failure.
    return silentFail();
  }
}
