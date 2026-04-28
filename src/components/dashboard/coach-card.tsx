"use client";

/**
 * Dashboard "Coach Mode" hero — replaces the fragmented top-of-dashboard
 * (ReadinessCard + 3-CTA Quick Actions + exam countdown in isolation) with
 * one prescription that answers three questions on first load:
 *
 *   1. Where am I? — a rough projected score (even pre-diagnostic)
 *   2. What does passing require? — questions/time until next tier
 *   3. What do I do NOW? — one dominant CTA, not a menu
 *
 * Based on the "dashboard → coach" UX rewrite (2026-04-18 session).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCached } from "@/lib/dashboard-cache";
import {
  Target,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
} from "lucide-react";

interface Props {
  course: string;
  // Funnel instrumentation — set by the parent client wrapper after
  // the /loaded event returns. Null while the impression is still
  // being created; in that case we simply skip follow-up events
  // (better to drop one event than block rendering).
  impressionId?: string | null;
}

/**
 * Fire-and-forget analytics POST. Failures are swallowed so a slow
 * or down analytics route can never break the dashboard.
 */
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

interface CoachPlanResponse {
  family: "AP" | "SAT" | "ACT";
  scaleMax: number;
  roughScore: number;
  confidence: "very_low" | "low" | "medium" | "high";
  verdict: string;
  targetScore: number;
  daysUntilExam: number | null;
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
  accuracyDelta: { from: number; to: number; deltaPct: number } | null;
}

function formatScore(family: "AP" | "SAT" | "ACT", score: number): string {
  if (family === "AP") return score.toFixed(1);
  return String(Math.round(score));
}

function scaleSuffix(family: "AP" | "SAT" | "ACT", scaleMax: number): string {
  if (family === "AP") return "/5";
  if (family === "SAT") return "";
  return `/${scaleMax}`;
}

export function CoachCard({ course, impressionId }: Props) {
  const [data, setData] = useState<CoachPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Stamp "coach_requested" BEFORE the fetch so a slow or failing
    // /api/coach-plan still shows up in the funnel as "requested but
    // never rendered" (that's exactly the signal we want).
    if (impressionId) {
      logDashboardEvent({ impressionId, course, event: "coach_requested" });
    }
    fetchCached<CoachPlanResponse & { error?: unknown }>(`/api/coach-plan?course=${course}`)
      .then((d) => {
        if (!cancelled && d && !d.error) setData(d);
      })
      .catch(() => { /* graceful degrade — dashboard still renders other cards */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course, impressionId]);

  // "coach_rendered" — fired once per (impressionId, data) pair so we
  // don't re-log on every React re-render. If the impression row lands
  // AFTER the coach plan data (race), the effect re-runs and logs.
  useEffect(() => {
    if (!impressionId || !data) return;
    logDashboardEvent({
      impressionId,
      course,
      event: "coach_rendered",
      ctaType: data.nextAction?.type,
      roughScore: data.roughScore,
    });
  }, [impressionId, data, course]);

  if (loading) {
    return (
      <Card className="card-glow border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analyzing your progress…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { family, scaleMax, roughScore, confidence, verdict, targetScore } = data;
  const showDisclaimer = confidence === "very_low" || confidence === "low";

  const scoreText = formatScore(family, roughScore);
  const targetText = formatScore(family, targetScore);

  return (
    <Card className="card-glow border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* ── 1. Where am I? ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Projected {family} Score
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-blue-500 tabular-nums">
                  {scoreText}
                </span>
                <span className="text-base text-muted-foreground">
                  {scaleSuffix(family, scaleMax)}
                </span>
              </div>
              <p className="text-sm font-medium mt-0.5">{verdict}</p>
            </div>
          </div>
          {showDisclaimer && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/40">
              Rough estimate
            </Badge>
          )}
        </div>

        {/* ── 2. What does passing require? ─────────────────────────── */}
        <div className="rounded-lg bg-secondary/40 border border-border/30 p-3.5 flex items-start gap-3">
          {data.daysUntilExam !== null ? (
            <Calendar className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-sm leading-relaxed">
            {data.daysUntilExam !== null ? (
              <>
                <span className="font-semibold">{data.daysUntilExam} day{data.daysUntilExam === 1 ? "" : "s"} left</span>
                {" → "}
                <span>
                  complete <span className="font-semibold">~{data.questionsToTarget} questions</span> to reach a{" "}
                  <span className="font-semibold">{targetText}</span>
                  {" "}({data.minutesToTarget}+ min)
                </span>
              </>
            ) : (
              <>
                <span>
                  <span className="font-semibold">~{data.questionsToTarget} questions</span> gets you to a{" "}
                  <span className="font-semibold">{targetText}</span> — that's{" "}
                  {data.minutesToTarget}+ min of focused work.
                </span>
                <Link href="/settings" className="block text-xs text-muted-foreground underline hover:text-foreground mt-1">
                  Set your exam date →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── 3. Weakest unit with numeric impact ───────────────────── */}
        {data.weakestUnit && data.weakestUnit.missRatePct >= 30 && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed min-w-0">
              <p className="font-semibold truncate">{data.weakestUnit.unitName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You're missing <span className="font-semibold text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400">{data.weakestUnit.missRatePct}%</span> here —
                likely <span className="font-semibold text-foreground">~{data.weakestUnit.likelyMissesOn50Q} question{data.weakestUnit.likelyMissesOn50Q === 1 ? "" : "s"}</span> lost on exam day.
              </p>
            </div>
          </div>
        )}

        {/* ── 4. Accuracy delta (positive = dopamine) ────────────────── */}
        {data.accuracyDelta && data.accuracyDelta.deltaPct !== 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {data.accuracyDelta.deltaPct > 0 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span>
                  Accuracy up from{" "}
                  <span className="font-semibold text-foreground">{data.accuracyDelta.from}%</span>{" "}
                  → <span className="font-semibold text-emerald-500">{data.accuracyDelta.to}%</span>{" "}
                  this window. Keep it going.
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  Accuracy down from{" "}
                  <span className="font-semibold text-foreground">{data.accuracyDelta.from}%</span>{" "}
                  → <span className="font-semibold text-foreground">{data.accuracyDelta.to}%</span>{" "}
                  — back to focused practice.
                </span>
              </>
            )}
          </div>
        )}

        {/* ── 5. THE single dominant CTA ────────────────────────────── */}
        <Link
          href={data.nextAction.url}
          className="block"
          onClick={() => {
            // The onClick fires right before navigation — a regular
            // fetch can be canceled when the page unloads, so we use
            // navigator.sendBeacon for reliable delivery. Falls back
            // to fetch where sendBeacon is unavailable.
            if (!impressionId) return;
            const payload = JSON.stringify({
              impressionId,
              course,
              event: "coach_clicked",
            });
            try {
              if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
                navigator.sendBeacon(
                  "/api/analytics/dashboard-event",
                  new Blob([payload], { type: "application/json" }),
                );
                return;
              }
            } catch { /* fall through */ }
            logDashboardEvent({ impressionId, course, event: "coach_clicked" });
          }}
        >
          <Button size="lg" className="btn-lift w-full gap-2 h-12 text-base font-semibold">
            {data.nextAction.ctaText}
            <span className="text-xs font-normal opacity-80">· {data.nextAction.minutes} min</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>

        {showDisclaimer && (
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed text-center">
            Estimate gets sharper with every session.{" "}
            <Link href="/methodology" className="underline hover:text-foreground">
              How we calculate this
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
