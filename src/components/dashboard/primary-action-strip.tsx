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
  //
  // Fires `coach_requested` when impressionId is known, and also falls
  // back to a synthetic id after 1s so the funnel captures the request
  // even when analytics is down. The coach-plan fetch itself runs
  // regardless so the card still renders.
  const requestedRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Primary path — impressionId available
    if (impressionId && requestedRef.current !== impressionId) {
      requestedRef.current = impressionId;
      logDashboardEvent({ impressionId, course, event: "coach_requested" });
    }

    // Fallback — if impressionId hasn't arrived within 1s, fire anyway
    // with a synthetic id. Better to over-count than under-count; reports
    // can filter the `fallback_` prefix to see true instrumentation rate.
    const fallbackTimer = setTimeout(() => {
      if (!impressionId && requestedRef.current === null) {
        const synth = `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        requestedRef.current = synth;
        logDashboardEvent({ impressionId: synth, course, event: "coach_requested" });
      }
    }, 1000);

    fetch(`/api/coach-plan?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && !d.error) setData(d);
      })
      .catch(() => {
        /* silent — we render nothing on failure, leaving space for the sub-cards */
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [course, impressionId]);

  // ── coach_rendered exactly once per (impressionId, data) pair ───────────
  useEffect(() => {
    if (!data) return;
    const id = impressionId ?? requestedRef.current;
    if (!id) return;
    if (renderedImpressionRef.current === id) return;
    renderedImpressionRef.current = id;
    logDashboardEvent({
      impressionId: id,
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
    const t = inProgressSession.sessionType;
    if (t === "DIAGNOSTIC") href = "/diagnostic";
    else if (t === "MOCK_EXAM") href = "/mock-exam";
    else href = `/practice?resume=${inProgressSession.id}`;
  } else if (tierLabel === "high_risk" && !weakestUnit) {
    // Zero-signal warmup — activation step, not conversion.
    // HOTFIX 2026-04-22: /warmup page doesn't exist; user-reported 404.
    // Redirect to the existing focused-practice auto-launch (3 Qs, any
    // unit, no time pressure) which gives the same "try it" UX without
    // a new page build. The practice page already handles
    // ?mode=focused&count=3 via its auto-launch effect (see useSearchParams
    // block at src/app/(dashboard)/practice/page.tsx).
    title = "Warm up. See your level.";
    buttonLabel = "TRY IT — 60 SEC";
    subtitle = "3 questions · about 60 seconds";
    detail = "Quick practice. No test feel.";
    href = "/practice?mode=focused&count=3";
  } else if (tierLabel === "ready") {
    // On-track + mock complete — push them to take the full mock exam.
    title = "Take the Mock Exam";
    buttonLabel = "START MOCK";
    subtitle = "Full-length timed exam";
    detail = "Verify you're ready for test day";
    href = "/mock-exam";
  } else if (tierLabel && (tierLabel === "high_risk" || tierLabel === "below_passing")) {
    // At-risk with signal — outcome-framed CTA. User's feedback: stateful
    // copy beats generic action verbs. Reveal what they'll learn.
    title = "See Your Predicted Score";
    buttonLabel = "SEE MY SCORE →";
    subtitle = weakestUnit ? weakestUnit.unitName : "Your predicted AP score";
    detail = weakestUnit
      ? `Biggest gap: ${weakestUnit.missRatePct}% miss rate. Fix this → +score.`
      : "Based on what you've answered so far";
    href = weakestUnit
      ? `/practice?mode=focused&unit=${encodeURIComponent(weakestUnit.unit)}`
      : (nextAction.url || "/practice");
  } else if (tierLabel === "near_passing") {
    title = "Close Your Score Gap";
    buttonLabel = "BOOST MY SCORE →";
    subtitle = weakestUnit ? weakestUnit.unitName : "You're close to passing";
    detail = weakestUnit
      ? `${weakestUnit.missRatePct}% miss here — fix and you pass.`
      : "A few focused sessions closes the gap";
    href = weakestUnit
      ? `/practice?mode=focused&unit=${encodeURIComponent(weakestUnit.unit)}`
      : (nextAction.url || "/practice");
  } else if (weakestUnit) {
    // on_track with a weak unit, or unknown tier — keep the fix-unit framing.
    title = "Continue Your Pass Plan";
    buttonLabel = "CONTINUE";
    subtitle = weakestUnit.unitName;
    detail = `You're missing ${weakestUnit.missRatePct}% of questions here`;
    href = `/practice?mode=focused&unit=${encodeURIComponent(weakestUnit.unit)}`;
  } else {
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
    // Use the impressionId OR the synthetic fallback id we stamped in the
    // request-firing effect, so clicks are always attributable even if the
    // server `loaded` POST failed.
    const id = impressionId ?? requestedRef.current;
    if (id) {
      const payload = JSON.stringify({ impressionId: id, course, event: "coach_clicked" });
      try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(
            "/api/analytics/dashboard-event",
            new Blob([payload], { type: "application/json" }),
          );
        } else {
          logDashboardEvent({ impressionId: id, course, event: "coach_clicked" });
        }
      } catch {
        logDashboardEvent({ impressionId: id, course, event: "coach_clicked" });
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
