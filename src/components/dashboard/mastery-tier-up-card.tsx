"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Sparkles } from "lucide-react";
import { useCourse } from "@/hooks/use-course";

interface TierUp {
  id: string;
  course: string;
  courseName: string;
  unit: string;
  unitName: string;
  beforeScore: number;
  afterScore: number;
  beforeTier: number;
  afterTier: number;
  projectedScoreDelta: number;
  projectedPassPercentDelta: number;
  createdAt: string;
}

export function MasteryTierUpCard() {
  const [course] = useCourse();
  const [allTierUps, setAllTierUps] = useState<TierUp[]>([]);
  const [displayedScore, setDisplayedScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  // Beta 9.0.9 — filter tier-up announcement to the CURRENTLY SELECTED
  // course. Without this, switching course in the sidebar still showed
  // a stale celebration card from the prior course (user-reported:
  // "I switched to AP World History but dashboard still says I moved
  // AP Biology Unit 6 from 0% → 100%").
  const tierUp = useMemo(
    () => allTierUps.find((t) => t.course === course) ?? null,
    [allTierUps, course]
  );

  // Fetch unread tier-ups on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/mastery-tier-ups", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const tierUps = (d?.tierUps ?? []) as TierUp[];
        setAllTierUps(tierUps);
      })
      .catch(() => {
        /* silent degrade — celebration is a nice-to-have */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset displayed score when the visible tier-up changes (e.g. course switch).
  useEffect(() => {
    if (tierUp) setDisplayedScore(tierUp.beforeScore);
    else setDisplayedScore(null);
  }, [tierUp?.id]);

  // Animate the score counter from beforeScore → afterScore.
  useEffect(() => {
    if (!tierUp || displayedScore === null) return;
    if (displayedScore >= tierUp.afterScore) return;

    const t = setTimeout(() => {
      setDisplayedScore((cur) => {
        if (cur === null) return tierUp.afterScore;
        const next = cur + 1;
        return next > tierUp.afterScore ? tierUp.afterScore : next;
      });
    }, 30);
    return () => clearTimeout(t);
  }, [tierUp, displayedScore]);

  if (loading || !tierUp) return null;

  const handleDismiss = async () => {
    setDismissing(true);
    // Fire-and-forget PATCH. If it fails, we still hide locally so the user
    // isn't stuck staring at the same card — it will re-surface on next page
    // load only if the write truly failed. Acceptable UX tradeoff.
    fetch("/api/mastery-tier-ups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tierUp.id }),
    }).catch(() => {});
    // Remove this tier-up from the list so the next-most-recent for the
    // current course (if any) surfaces, and so course-switching shows
    // the right pending tier-up.
    setAllTierUps((prev) => prev.filter((t) => t.id !== tierUp.id));
  };

  const tierLabel = (t: number) =>
    t >= 4 ? "Mastered" : t >= 3 ? "Strong" : t >= 2 ? "Building" : t >= 1 ? "Warming up" : "Fresh";

  // Copy decisions:
  //   - Use "well above passing" only when afterScore ≥ 60, since that's the
  //     rough CLEP/AP passing threshold. Below 60, celebrate the jump itself.
  const headline =
    tierUp.afterScore >= 60
      ? `You moved ${tierUp.courseName} · ${tierUp.unitName} from ${tierUp.beforeScore}% → ${tierUp.afterScore}% — well above passing.`
      : `You moved ${tierUp.courseName} · ${tierUp.unitName} from ${tierUp.beforeScore}% → ${tierUp.afterScore}%. Keep stacking wins.`;

  return (
    <Card
      className={`card-glow border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-yellow-500/5 transition-opacity ${
        dismissing ? "opacity-0" : "opacity-100"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 relative">
            <Trophy className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            <Sparkles className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                You fixed it
              </span>
              <span className="text-[10px] text-muted-foreground">
                {tierLabel(tierUp.beforeTier)} → {tierLabel(tierUp.afterTier)}
              </span>
            </div>
            <p className="text-sm font-semibold leading-snug">{headline}</p>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {displayedScore ?? tierUp.beforeScore}%
              </span>
              <span className="text-xs text-muted-foreground">mastery for this unit</span>
            </div>
            {tierUp.projectedScoreDelta > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>
                  +{tierUp.projectedScoreDelta.toFixed(1)} AP score projected from this unit
                  {tierUp.projectedPassPercentDelta > 0 &&
                    ` · +${tierUp.projectedPassPercentDelta.toFixed(1)} pp pass% over next 24h pace`}
                </span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
            disabled={dismissing}
            className="flex-shrink-0"
          >
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
