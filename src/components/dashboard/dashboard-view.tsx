"use client";

/**
 * DashboardView — StudentNest clutter-free rewrite (2026-04-20).
 *
 * Ported from PrepLion's A25 "radical simplification". Renders 5 cards max:
 *
 *   1. MasteryTierUpCard        — celebration when a unit crosses a mastery tier
 *   2. ResumeCard               — "Continue where you left off" if IN_PROGRESS
 *   3. PrimaryActionStrip       — one dominant CTA (RESUME / START / CONTINUE)
 *   4. OutcomeProgressStrip     — pass probability + today's target + streak
 *   5. MicroWinCard             — "Fix 1 mistake (1 min)" retention nudge
 *   6. WeaknessFocusCard        — single weakest unit, below fold
 *   7. PathProgression          — Duolingo-style vertical path to mastery
 *
 * All cards either self-render-null when they have nothing to show or lazy-
 * fetch their own data. The page ships a skeleton until session resolves.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/hooks/use-course";
import { MasteryTierUpCard } from "@/components/dashboard/mastery-tier-up-card";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { PrimaryActionStrip } from "@/components/dashboard/primary-action-strip";
import { OutcomeProgressStrip } from "@/components/dashboard/outcome-progress-strip";
import { MicroWinCard } from "@/components/dashboard/micro-win-card";
import { WeaknessFocusCard } from "@/components/dashboard/weakness-focus-card";
import { PathProgression } from "@/components/dashboard/path-progression";
import { InviteParentCard } from "@/components/dashboard/invite-parent-card";
import { DailyGoalCard } from "@/components/dashboard/daily-goal-card";
import { CLEPUpsellCard } from "@/components/dashboard/clep-upsell-card";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 py-2 animate-pulse">
      <div className="rounded-[20px] border border-border/30 bg-secondary/10 p-6">
        <div className="h-5 w-48 bg-secondary/40 rounded mb-3" />
        <div className="h-4 w-64 bg-secondary/30 rounded mb-4" />
        <div className="h-12 w-full bg-primary/20 rounded-xl" />
      </div>
      <div className="rounded-[16px] border border-border/30 bg-secondary/10 p-5 space-y-2">
        <div className="h-6 w-40 bg-secondary/40 rounded" />
        <div className="h-2 w-full bg-secondary/30 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { status } = useSession();
  const router = useRouter();
  const [course] = useCourse();
  const [impressionId, setImpressionId] = useState<string | null>(null);

  // Fire one impression row per dashboard load. The coach components use
  // this id for downstream funnel events (requested / rendered / clicked).
  useEffect(() => {
    if (status !== "authenticated") return;
    console.log("[funnel] loaded event firing", { course, status });
    setImpressionId(null);
    fetch("/api/analytics/dashboard-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, event: "loaded" }),
    })
      .then((r) => {
        console.log("[funnel] loaded event response", { ok: r.ok, status: r.status });
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        console.log("[funnel] loaded event parsed", d);
        if (d?.impressionId) {
          console.log("[funnel] impressionId set →", d.impressionId);
          setImpressionId(d.impressionId);
        } else {
          console.warn("[funnel] NO impressionId in response — downstream events will be skipped");
        }
      })
      .catch((e) => {
        console.error("[funnel] loaded event failed", e);
      });
  }, [course, status]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return <DashboardSkeleton />;

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 py-2">
      {/* 0. Celebration — renders null when no unread tier-up */}
      <MasteryTierUpCard />

      {/* 1. Resume hook — renders null when no in-progress session */}
      <ResumeCard course={course as string} />

      {/* 2. The hero — single dominant CTA */}
      <PrimaryActionStrip course={course as string} impressionId={impressionId} />

      {/* 3. Outcome + today's target */}
      <OutcomeProgressStrip course={course as string} />

      {/* 3b. Daily goal — habit-formation loop. Renders null pre-signal. */}
      <DailyGoalCard course={course as string} />

      {/* 4. Retention nudge — renders null when no past mistakes */}
      <MicroWinCard course={course as string} />

      {/* 5. Weakness focus — below fold, ONE unit */}
      <WeaknessFocusCard course={course as string} />

      {/* 6. Vertical path + mock milestone */}
      <PathProgression course={course as string} />

      {/* 7. Conversion hook — renders null until ≥3 sessions practiced */}
      <InviteParentCard />

      {/* 8. Cross-sell — renders null until ≥10 sessions, dismissable */}
      <CLEPUpsellCard />
    </div>
  );
}
