"use client";

/**
 * PrimaryActionStrip — the dashboard hero in the Duolingo-adapted rewrite.
 *
 * Replaces the old CoachCard. One dominant button. Title varies by state:
 *   - "Resume" when there's an IN_PROGRESS session
 *   - "Start Your Diagnostic" when tierLabel === "high_risk" and no sessions ever
 *   - "Continue Your Pass Plan" otherwise
 *
 * Fires three funnel events via the existing /api/analytics/dashboard-event
 * plumbing (stamped with `impressionId` so we can join downstream):
 *   1. `coach_requested` — pre-fetch
 *   2. `coach_rendered`  — post-fetch (once per impressionId+data pair)
 *   3. `coach_clicked`   — on navigation, sent via sendBeacon so the
 *      post survives the page unload
 *
 * Pulse-on-mount animation runs for 1.2s and clears on mousemove/scroll —
 * keeps the button drawing the eye on first paint without pestering users
 * who've already engaged with the page.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Loader2, TrendingUp } from "lucide-react";

interface Props {
  course: string;
  impressionId?: string | null;
}

interface CoachPlanResponse {
  roughScore: number;
  tierLabel?: "high_risk" | "below_passing" | "near_passing" | "on_track" | "ready";
  passPercent?: number;
  questionsToTarget: number;
  minutesToTarget: number;
  weakestUnit: {
    unit: string;
    unitName: string;
    masteryScore: number;
    missRatePct: number;
    likelyMissesOn50Q: number;
  } | null;
  nextAction: {
    type: string;
    url: string;
    ctaText: string;
    minutes: number;
    questions: number;
  };
  inProgressSession: {
    id: string;
    startedAt: string;
    answered: number;
    total: number;
    sessionType?: string;
  } | null;
}

function logDashboardEvent(payload: Record<string, unknown>): void {
  try {
    void fetch("/api/analytics/dashboard-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => { /* silent */ });
  } catch {
    /* silent */
  }
}

export function PrimaryActionStrip({ course, impressionId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<CoachPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // Pulse state — true on mount for 1.2s, then false. Interactions cut it short.
  const [pulse, setPulse] = useState(true);
  const renderedImpressionRef = useRef<string | null>(null);

  // ── Fetch coach plan ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    console.log("[funnel] PrimaryActionStrip useEffect", { impressionId, course });
    if (impressionId) {
      console.log("[funnel] firing coach_requested", impressionId);
      logDashboardEvent({ impressionId, course, event: "coach_requested" });
    } else {
      console.warn("[funnel] coach_requested SKIPPED — impressionId not yet available");
    }
    fetch(`/api/coach-plan?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && !d.error) setData(d);
      })
      .catch(() => {
        /* silent — we render nothing on failure, leaving space for the sub-cards */
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course, impressionId]);

  // ── coach_rendered exactly once per (impressionId, data) pair ───────────
  useEffect(() => {
    if (!impressionId || !data) {
      console.log("[funnel] coach_rendered WAITING", { impressionId: !!impressionId, hasData: !!data });
      return;
    }
    if (renderedImpressionRef.current === impressionId) return;
    renderedImpressionRef.current = impressionId;
    console.log("[funnel] firing coach_rendered", impressionId, data.nextAction?.type);
    logDashboardEvent({
      impressionId,
      course,
      event: "coach_rendered",
      ctaType: data.nextAction?.type,
      tierLabel: data.tierLabel,
      roughScore: data.roughScore,
    });
  }, [impressionId, data, course]);

  // ── Pulse-clear on interaction ──────────────────────────────────────────
  useEffect(() => {
    if (!pulse) return;
    const stop = () => setPulse(false);
    const timer = setTimeout(stop, 1200);
    window.addEventListener("mousemove", stop, { once: true });
    window.addEventListener("scroll", stop, { once: true, passive: true });
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", stop);
      window.removeEventListener("scroll", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, [pulse]);

  if (loading) {
    return (
      <Card className="rounded-[20px] shadow-sm border-border/40">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading your next step…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { inProgressSession, tierLabel, weakestUnit, nextAction } = data;

  // ── Copy + navigation decision ──────────────────────────────────────────
  let title: string;
  let buttonLabel: string;
  let subtitle: string | null = null;
  let detail: string | null = null;
  let href: string;

  if (inProgressSession) {
    title = "Resume Your Session";
    buttonLabel = "RESUME";
    const mins = Math.max(
      1,
      Math.round((Date.now() - new Date(inProgressSession.startedAt).getTime()) / 60000),
    );
    const timeLabel = mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
    subtitle = `Started ${timeLabel}`;
    detail = inProgressSession.total > 0
      ? `${inProgressSession.total} question${inProgressSession.total === 1 ? "" : "s"} waiting`
      : "Pick up where you left off";
    // Route to the right page based on session type when we know it.
    const t = inProgressSession.sessionType;
    if (t === "DIAGNOSTIC") href = "/diagnostic";
    else if (t === "MOCK_EXAM") href = "/mock-exam";
    else href = `/practice?resume=${inProgressSession.id}`;
  } else if (tierLabel === "high_risk" && !weakestUnit) {
    // Zero signal → 60-second warmup framing.
    //
    // The old "Start Your Diagnostic / 15 questions / finds your starting
    // point" copy was driving ~14% view→start on PrepLion (2026-04-19
    // 24h metric). ChatGPT behavioral review flagged the "judgment"
    // framing as the blocker. Warmup framing is "exploration": 3 Qs, 60s,
    // no test feel, evaluation shown AFTER engagement not before. See
    // memory project_activation_retention_backlog.
    title = "Warm up. See your level.";
    buttonLabel = "TRY IT — 60 SEC";
    subtitle = "3 questions · about 60 seconds";
    detail = "Quick practice. No test feel.";
    href = "/warmup";
  } else if (weakestUnit) {
    title = "Continue Your Pass Plan";
    buttonLabel = inProgressSession ? "RESUME" : "CONTINUE";
    subtitle = weakestUnit.unitName;
    detail = `You're missing ${weakestUnit.missRatePct}% of questions here`;
    href = `/practice?mode=focused&unit=${encodeURIComponent(weakestUnit.unit)}`;
  } else {
    // Fallback: no weak unit, no in-progress, not high-risk
    title = "Continue Your Pass Plan";
    buttonLabel = "CONTINUE";
    subtitle = "Daily practice";
    detail = `${nextAction.questions} question${nextAction.questions === 1 ? "" : "s"} · ${nextAction.minutes} min`;
    href = nextAction.url || "/practice";
  }

  const minutesLabel = inProgressSession ? "Continue" : `${nextAction.minutes} min`;
  const questionsLabel = inProgressSession
    ? null
    : `${nextAction.questions} questions`;
  const scoreHint = !inProgressSession && (tierLabel === "high_risk" || tierLabel === "below_passing")
    ? "+progress"
    : null;

  const onClick = () => {
    setPulse(false);
    console.log("[funnel] hero CTA clicked", { impressionId, href });
    if (impressionId) {
      const payload = JSON.stringify({ impressionId, course, event: "coach_clicked" });
      try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(
            "/api/analytics/dashboard-event",
            new Blob([payload], { type: "application/json" }),
          );
        } else {
          logDashboardEvent({ impressionId, course, event: "coach_clicked" });
        }
      } catch {
        logDashboardEvent({ impressionId, course, event: "coach_clicked" });
      }
    }
    router.push(href);
  };

  return (
    <Card className="rounded-[20px] shadow-sm border-border/40 bg-card">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-[18px] font-bold leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-[16px] font-medium mt-1.5 text-foreground/90 line-clamp-1">{subtitle}</p>
          )}
          {detail && (
            <p className="text-[13px] text-muted-foreground mt-1">{detail}</p>
          )}
        </div>

        {(minutesLabel || questionsLabel || scoreHint) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {minutesLabel}
            </span>
            {questionsLabel && <span>· {questionsLabel}</span>}
            {scoreHint && (
              <span className="inline-flex items-center gap-1">
                · <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> {scoreHint}
              </span>
            )}
          </div>
        )}

        <Button
          onClick={onClick}
          className={[
            "w-full h-12 rounded-[12px] text-base font-semibold gap-2",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            pulse ? "animate-pulse" : "",
          ].join(" ")}
        >
          {buttonLabel}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
