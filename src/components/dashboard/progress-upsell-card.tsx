"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, Target, Trophy, ShieldCheck, Sparkles } from "lucide-react";
import { resolveUpgradeCta, type ExamFamily } from "@/lib/progress-cta";

interface Props {
  course: string;
  /** Optional — pass from the dashboard page.tsx server component so
   *  we can suppress the upsell for premium users without a client
   *  round-trip. Falls back to treating the user as free if omitted. */
  isPremium?: boolean;
}

/**
 * Score-tier-aware CTA card. Replaces the generic "Upgrade to Pass
 * Plan" on the dashboard with copy that matches the student's current
 * trajectory:
 *
 * - Zero signal → pitches the diagnostic
 * - Struggling → "Fix your weakest unit now"
 * - Building → "Take your first mock"
 * - Close → "You're one mock away from a 4"
 * - Ready → "Prove you're ready — Pass Confident Guarantee"
 *
 * Reads from /api/readiness so the score tier is always in sync with
 * the rest of the dashboard.
 */
export function ProgressUpsellCard({ course, isPremium }: Props) {
  const [data, setData] = useState<{
    family: ExamFamily;
    scaledScore: number;
    showScore: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/readiness?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) {
          setData({
            family: d.family,
            scaledScore: d.scaledScore,
            showScore: d.showScore,
          });
        }
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course]);

  if (loading) return null;
  if (!data) return null;

  const cta = resolveUpgradeCta({
    family: data.family,
    scaledScore: data.scaledScore,
    showScore: data.showScore,
    isPremium,
  });

  // Pick an icon + accent color per tier so the card has visual variety
  // without being generic.
  const tierVisual = {
    "zero-signal": { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    struggling: { icon: Target, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    building: { icon: ArrowRight, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    close: { icon: Trophy, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    ready: { icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  }[cta.tierLabel];
  const Icon = tierVisual.icon;

  return (
    <div className={`rounded-xl border ${tierVisual.border} ${tierVisual.bg} p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-lg ${tierVisual.bg} flex items-center justify-center flex-shrink-0 border ${tierVisual.border}`}>
          <Icon className={`h-5 w-5 ${tierVisual.color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{cta.headline}</p>
          <p className="text-xs text-muted-foreground">{cta.subcopy}</p>
        </div>
      </div>
      <Link href={cta.targetUrl} className="flex-shrink-0">
        <Button size="sm" className="gap-1.5 w-full sm:w-auto">
          {!isPremium && cta.targetUrl === "/pricing" && <Crown className="h-3.5 w-3.5" />}
          {cta.ctaText}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
