"use client";

/**
 * SageCoachPromoCard — Phase B (Beta 8.3 prep), 2026-04-26.
 *
 * Promotes the FRQ grader (Sage Coach) from a buried sidebar link to a
 * prominent dashboard card. Shipping the 220 official CB FRQs in
 * Beta 8.2 doesn't help conversion if students don't know the AI grader
 * exists — this card surfaces it where they actually look.
 *
 * Rendering rules:
 *   - Hides when: course has 0 FRQs (no value to promote) OR Sage Coach
 *     not enabled at all (defensive; future flag).
 *   - For PREMIUM users: green-tinted card, direct CTA to /sage-coach.
 *   - For FREE users: amber lock card showing this is a Premium feature,
 *     CTA to /billing with utm_source=sage_coach_promo.
 *
 * Dashboard placement: between WeaknessFocusCard and FlashcardsDueCard
 * — that's where students naturally look after seeing their score +
 * weakest unit ("OK, I see what to fix; how do I get help writing it?").
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Lock, ArrowRight, Sparkles } from "lucide-react";
import { fetchCached } from "@/lib/dashboard-cache";

interface Props {
  course: string;
}

interface LimitsSnippet {
  tier: "FREE" | "PREMIUM";
  unlimited: boolean;
}

export function SageCoachPromoCard({ course }: Props) {
  const [hasFrqs, setHasFrqs] = useState<boolean | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Cheap probe — just need to know if at least 1 FRQ exists for course.
    // Beta 8.3 hotfix (2026-04-26): URL was /api/frq/list (404); actual
    // route is /api/frq. Card was silently never rendering because the
    // 404 produced null → setHasFrqs never fired → !hasFrqs guard hid card.
    // Also switched to fetchCached so this card shares the /api/frq fetch
    // with CramModeCard + DailyStudyOSCard.
    fetchCached<{ frqs?: unknown[]; list?: unknown[] } | null>(`/api/frq?course=${course}&limit=1`)
      .then((d) => {
        if (cancelled || !d) return;
        const list = d.frqs ?? d.list ?? [];
        setHasFrqs(Array.isArray(list) && list.length > 0);
      })
      .catch(() => { if (!cancelled) setHasFrqs(false); });

    fetchCached<LimitsSnippet | null>("/api/user/limits")
      .then((d) => {
        if (cancelled || !d) return;
        setIsPremium(d.tier === "PREMIUM" || d.unlimited === true);
      })
      .catch(() => { if (!cancelled) setIsPremium(false); });

    return () => { cancelled = true; };
  }, [course]);

  // Don't render until we know the basics. Avoids a flash-of-card when
  // it shouldn't be there.
  if (hasFrqs === null || isPremium === null) return null;
  if (!hasFrqs) return null;

  if (isPremium) {
    return (
      <Card className="rounded-[16px] border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Mic className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-semibold leading-tight">Sage Coach — FRQ Grader</p>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5">
                  Premium
                </Badge>
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">
                Submit your free-response answer → instant AI feedback against the official College Board rubric. Practice the writing the exam actually rewards.
              </p>
            </div>
          </div>
          <Link href={`/sage-coach?course=${course}`} className="block">
            <Button size="sm" className="w-full h-10 gap-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700">
              Try Sage Coach
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Free tier — paywalled CTA into billing.
  return (
    <Card className="rounded-[16px] border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-semibold leading-tight">Get instant FRQ feedback</p>
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5 inline-flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Premium
              </Badge>
            </div>
            <p className="text-[13px] text-muted-foreground mt-1">
              Sage Coach grades your written FRQ responses against the official College Board rubric — line by line. Premium feature.
            </p>
          </div>
        </div>
        <Link href="/billing?utm_source=sage_coach_promo&utm_campaign=phase_b" className="block">
          <Button size="sm" variant="outline" className="w-full h-10 gap-2 rounded-[10px] border-amber-500/40 hover:bg-amber-500/10">
            Unlock Sage Coach
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
