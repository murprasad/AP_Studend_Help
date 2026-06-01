"use client";

/**
 * Today's Set CTA — the dashboard's primary action.
 *
 * Calls /api/todays-set?course=X on mount. Renders a single tile with the
 * Q count and weakest-concept tags. Clicking starts a focused practice
 * session pre-loaded with the plan's question IDs.
 *
 * If alreadyDone is true (user completed today's set), shows a "Take
 * another" affordance pointing at /practice picker instead.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AP_UNITS } from "@/lib/utils";

/**
 * 2026-06-01 — Fix A + B for new-user activation gap.
 * Forensic on user `itsyourgirlyin@gmail.com` (3-Q ACT_ENGLISH user) showed
 * she landed on dashboard 11s after first practice ended, saw "14 mins · 12
 * questions · 1 weakest concept", and bounced. The subtitle hid the
 * actionable hook (which concept) behind a count, and led with time-cost
 * not value. This subtitle now:
 *   - Names the concept ("Strengthen Production of Writing")
 *   - Shows the question count
 *   - Drops the minutes lead (it was a deterrent for n=3 history users)
 */
function unitDisplayName(unitKey: string): string {
  // conceptKeys come in as "unit:ACT_ENG_1_PRODUCTION_WRITING"; strip prefix
  const raw = unitKey.startsWith("unit:") ? unitKey.slice(5) : unitKey;
  return (AP_UNITS as Record<string, string>)[raw] ?? raw.replace(/_/g, " ");
}

interface ConceptMeta {
  key: string;
  attempts: number;
  mastery: number;
  isUntried: boolean;
}

interface TodaysSetResponse {
  plan: { questionIds: string[]; conceptKeys: string[]; expectedDeltaPctHint: number };
  conceptMeta?: ConceptMeta[];
  alreadyDone: boolean;
  generated: boolean;
  warning?: string;
}

/**
 * 2026-06-01 — Bug #1, #5, #9 fix.
 * Choose the right action verb for the card title based on the user's
 * actual relationship to the concept. "Strengthen" implies prior weakness;
 * for an untouched unit, the right framing is "Try" (an invitation, not a
 * remediation). At polish-level mastery the framing should be aspirational.
 *
 * Thresholds chosen to feel honest:
 *   - isUntried (0 attempts)  → "Try"
 *   - mastery < 0.50          → "Strengthen"
 *   - mastery < 0.80          → "Sharpen"
 *   - mastery >= 0.80         → "Polish"
 */
function actionVerb(meta: ConceptMeta | null): string {
  if (!meta || meta.isUntried) return "Try";
  if (meta.mastery < 0.50) return "Strengthen";
  if (meta.mastery < 0.80) return "Sharpen";
  return "Polish";
}

interface Props {
  course: string;
}

export function TodaysSetCard({ course }: Props) {
  const router = useRouter();
  const [data, setData] = useState<TodaysSetResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/todays-set?course=${encodeURIComponent(course)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setLoading(false); } });
    return () => { cancelled = true; };
  }, [course]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-5 text-center" data-testid="todays-set-loading">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }

  if (!data || data.plan.questionIds.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-5" data-testid="todays-set-empty">
        <h3 className="font-semibold mb-1">Today&apos;s Set</h3>
        <p className="text-sm text-muted-foreground mb-3">No targeted set ready yet. Start a free practice session to build your profile.</p>
        <Button asChild variant="outline">
          <Link href="/practice">Open practice picker →</Link>
        </Button>
      </div>
    );
  }

  if (data.alreadyDone) {
    return (
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5" data-testid="todays-set-done">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Today&apos;s Set is done.</h3>
            <p className="text-sm text-muted-foreground mt-0.5 mb-3">
              Your next set is queued for tomorrow. Want more practice now?
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/practice">More practice →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const count = data.plan.questionIds.length;
  const minutes = Math.max(10, Math.round(count * 1.2)); // ~1.2 min/Q
  const concepts = data.plan.conceptKeys.length;
  const firstConceptName = data.plan.conceptKeys[0]
    ? unitDisplayName(data.plan.conceptKeys[0])
    : null;
  // 2026-06-01 — Bug #1/#5/#9 fix: pick verb from per-concept state, not
  // a hardcoded "Strengthen". Falls back to "Try" when conceptMeta missing.
  const firstMeta = data.conceptMeta?.[0] ?? null;
  const verb = actionVerb(firstMeta);
  // 2026-06-01 — Bug #7/#15 fix: if the system itself thinks the set won't
  // move the user's number (expectedDeltaPctHint < 0.5 percentage points)
  // AND the user already has data on the targeted concept, reframe as a
  // daily warmup rather than a recommendation. Avoids surfacing CTAs the
  // system has 0 confidence in.
  const lowExpectedLift = data.plan.expectedDeltaPctHint < 0.005;
  const isWarmup = lowExpectedLift && firstMeta != null && !firstMeta.isUntried && firstMeta.mastery >= 0.50;

  // 2026-05-29 — Use programmatic navigation rather than <Link> wrapping
  // the entire card. Persona walkthrough showed the Link click landed back
  // on /dashboard — likely a parent click handler intercepting. router.push
  // is unambiguous.
  // 2026-05-29 #2 — User reported: clicking Today's Set didn't drill the
  // suggested weak concept. Now pass the weakest unit as a query param so
  // the practice page filters to it. conceptKeys[0] = "unit:X" → strip
  // the prefix and forward as ?unit=X.
  function handleStart() {
    const firstConcept = data!.plan.conceptKeys[0] ?? "";
    const unit = firstConcept.startsWith("unit:") ? firstConcept.slice(5) : "";
    const params = new URLSearchParams({
      course,
      plan: "today",
      count: String(count),
      src: "todays_set",
    });
    if (unit) params.set("unit", unit);
    router.push(`/practice?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      data-testid="todays-set-cta"
      className="block group w-full text-left"
    >
      <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-5 transition-colors group-hover:from-blue-500/15 group-hover:via-blue-500/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Play className="h-6 w-6 text-blue-700 dark:text-blue-400" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-tight">
              {firstConceptName
                ? (isWarmup ? `Daily warm-up · ${firstConceptName}` : `${verb} ${firstConceptName}`)
                : "Today's Set"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {count} questions
              {concepts > 1 && ` · ${concepts - 1} more area${concepts - 1 === 1 ? "" : "s"}`}
              {" · "}~{minutes} mins
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-blue-700 dark:text-blue-400 flex-shrink-0" />
        </div>
      </div>
    </button>
  );
}
