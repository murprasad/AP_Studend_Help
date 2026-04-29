"use client";

/**
 * FrqTasteNudge — first-time-user FRQ insertion (Beta 8.13.3).
 *
 * Three states (Beta 9.1.1):
 *   - count === 0: "Try a real FRQ — free first attempt" (taste the format)
 *   - count >= 1, FREE tier: "You've used your free FRQ — upgrade to
 *     unlimited + detailed coaching" (conversion moment)
 *   - count >= 1, Premium: hidden (unlimited; nudge has no purpose)
 *
 * CTA routes to /frq-practice?course=X&first_taste=1 — that page auto-
 * surfaces the highest-quality FRQ with a "your first free FRQ" banner.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, ArrowRight, ShieldCheck, Lock } from "lucide-react";

interface Props {
  course: string;
}

type FrqState =
  | { kind: "loading" }
  | { kind: "first-taste" }       // count === 0
  | { kind: "free-locked" }       // count >= 1, FREE tier
  | { kind: "hidden" };           // Premium, or load error

export function FrqTasteNudge({ course }: Props) {
  const [state, setState] = useState<FrqState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/practice/frq-attempts-count?course=${course}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/user/limits`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([countData, limitsData]: [{ count?: number } | null, { tier?: string; unlimited?: boolean } | null]) => {
      if (cancelled) return;
      const count = countData?.count ?? 0;
      const isPremium = limitsData?.unlimited === true || limitsData?.tier === "PREMIUM";
      if (count === 0) {
        setState({ kind: "first-taste" });
      } else if (!isPremium) {
        // Free tier and they've used their attempt → show upgrade-locked card
        setState({ kind: "free-locked" });
      } else {
        setState({ kind: "hidden" });
      }
    });
    return () => { cancelled = true; };
  }, [course]);

  if (state.kind === "loading" || state.kind === "hidden") return null;

  if (state.kind === "free-locked") {
    return (
      <Card className="rounded-[16px] border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-transparent">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold leading-tight">
                You&apos;ve used your free FRQ for this course
              </p>
              <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                Premium unlocks <strong>unlimited FRQ attempts</strong> + line-by-line coaching that tells you exactly which rubric points you&apos;re missing and how to earn them.
              </p>
            </div>
          </div>
          <Link href={`/billing?utm_source=frq_taste_locked&utm_campaign=frq_cap`}>
            <Button size="sm" className="rounded-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              Upgrade — $9.99/mo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // first-taste
  return (
    <Card className="rounded-[16px] border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-blue-500/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
            <ScrollText className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold leading-tight">
              Now try one real AP-style FRQ
            </p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              MCQs warm up your brain. The AP exam is graded on written answers — write one and see exactly how it scores against the official College Board rubric.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <p className="text-[13px] leading-snug">
            <strong>Free first attempt</strong> — no card, no upgrade. See the rubric, write your answer, get scored.
          </p>
        </div>

        <a
          href={`/frq-practice?course=${course}&first_taste=1`}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue-700 dark:text-blue-400 hover:underline"
        >
          Try a real FRQ now <ArrowRight className="h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  );
}
