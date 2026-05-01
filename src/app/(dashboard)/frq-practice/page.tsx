"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCourse } from "@/hooks/use-course";
import { COURSE_REGISTRY } from "@/lib/courses";
import { AP_COURSES } from "@/lib/utils";
import { CourseSelectorInline } from "@/components/layout/course-selector-inline";
import { FrqPracticeCard } from "@/components/practice/frq-practice-card";
import { ApCourse, ApUnit } from "@prisma/client";
import { Loader2, ChevronRight, PenLine, BookOpen, Lock, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LOCK_COPY } from "@/lib/tier-limits";

// Beta 8.2 (2026-04-26): removed CLUSTER_A hardcoded gate. Now ALL AP
// courses are served — the page checks the FRQ list at runtime via
// /api/frq/list and shows "no FRQs yet" only if the DB returns empty.
// This was hiding the 523 official FRQs we ingested today across 14
// courses (incl. World History which user's son specifically asked for).
// Originally added when only Bio/Calc/Chem/Physics/Stats had FRQs and
// other courses' empty-state was confusing. Now that we have official
// CB FRQs across most AP courses, the list itself is the source of truth.
const CLUSTER_A: ApCourse[] = [];

interface FrqListItem {
  id: string;
  course: ApCourse;
  unit: ApUnit | null;
  year: number;
  questionNumber: number;
  type: string;
  sourceUrl: string;
  promptText: string;
  stimulus?: string | null;
  totalPoints: number;
}

export default function FrqPracticePage() {
  const searchParams = useSearchParams();
  const [persistedCourse] = useCourse();
  // URL override — useful for deep-links into a specific course's FRQs
  const urlCourse = searchParams.get("course") as ApCourse | null;
  // Beta 8.2: removed CLUSTER_A gate — accept any AP course from URL,
  // fall through to persisted course otherwise.
  const course = (urlCourse ?? persistedCourse) as ApCourse;

  const [list, setList] = useState<FrqListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ApUnit | "ALL">("ALL");
  // Beta 8.7.x — subtype tabs (SAQ/DBQ/LEQ/etc.) added 2026-04-27 so
  // students can practice by CB-defined exam type instead of one flat list.
  const [selectedType, setSelectedType] = useState<string>("ALL");
  // Tier gate — fetched from /api/user/limits. Option B spec hard-locks
  // FRQ for FREE users (frqAccess: false). Gate the whole page so free
  // users see a paywall, not a list they can't actually use.
  const [tierLoading, setTierLoading] = useState(true);
  const [isFreeTier, setIsFreeTier] = useState(false);
  // Beta 9.1.3 — track free-FRQ attempts used so we can show graceful
  // upgrade-locked card when user has used their 1 free attempt for this
  // course. Without this, they keep clicking FRQs and bouncing off 403.
  const [freeAttemptsUsed, setFreeAttemptsUsed] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/user/limits", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/practice/frq-attempts-count?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([limits, count]: [{ tier?: string; unlimited?: boolean } | null, { count?: number } | null]) => {
      if (cancelled) return;
      const free = limits?.tier === "FREE" && limits.unlimited !== true;
      setIsFreeTier(free);
      setFreeAttemptsUsed(count?.count ?? 0);
    }).finally(() => {
      if (!cancelled) setTierLoading(false);
    });
    return () => { cancelled = true; };
  }, [course]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ course, limit: "25" });
      if (selectedUnit !== "ALL") params.set("unit", selectedUnit);
      const res = await fetch(`/api/frq?${params.toString()}`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { frqs: FrqListItem[] };
      setList(data.frqs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load FRQs");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [course, selectedUnit]);

  useEffect(() => {
    setSelectedId(null);
    fetchList();
  }, [fetchList]);

  // 2026-05-01 — auto-pick path for guided users. When ?first_taste=1
  // (entry from journey/post-session next-step) OR ?guided=1 is set,
  // fetch ONE recommended FRQ and auto-select it instead of rendering
  // the 25-item grid. Kills choice paralysis for first-timers. Power
  // users override with ?browse=1.
  const isGuided =
    (searchParams.get("first_taste") === "1" || searchParams.get("guided") === "1") &&
    searchParams.get("browse") !== "1";
  const [autoPickAttempted, setAutoPickAttempted] = useState(false);
  useEffect(() => {
    if (!isGuided || autoPickAttempted || tierLoading) return;
    setAutoPickAttempted(true);
    fetch(`/api/frq?course=${course}&recommended=1`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { frqs?: FrqListItem[] } | null) => {
        const picked = d?.frqs?.[0];
        if (picked) setSelectedId(picked.id);
      })
      .catch(() => { /* fall through to grid */ });
  }, [isGuided, autoPickAttempted, course, tierLoading]);

  const unitMeta = COURSE_REGISTRY[course]?.units ?? {};
  const unitOptions = Object.entries(unitMeta) as [ApUnit, { name: string }][];

  // ── Loading tier ──────────────────────────────────────────────────────────
  if (tierLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  // ── FREE preview block REMOVED 2026-04-29 (Beta 8.13) ──
  // The hard page-level paywall here was killing conversion: students
  // couldn't evaluate DBQ/LEQ quality before paying, so they didn't pay.
  // Replaced by server-side per-type per-course caps (1 DBQ + 1 LEQ +
  // 1 SAQ free lifetime per course) enforced in POST /api/practice.
  // Detailed line-by-line coaching stays Premium-only at the grading step.
  // See FREE_LIMITS.{dbq,leq,saq,frq}FreeAttemptsPerCourse in tier-limits.ts.

  // ── List view (legacy CLUSTER_A gate removed Beta 8.2) ───────────────────
  const selected = list.find((f) => f.id === selectedId) ?? null;

  // Beta 8.13.3 — first_taste=1 query lands users here from the
  // FrqTasteNudge after their first MCQ session. Show a confidence banner
  // explaining what's about to happen so they don't bounce.
  const isFirstTaste = searchParams.get("first_taste") === "1";

  // Beta 9.1.3 — graceful free-cap UX. Free user with attempts used >= 1
  // gets an amber card at the top explaining they've used their free
  // attempt + an Upgrade CTA. Doesn't hide the list (they can still
  // re-view what they've done) but sets clear expectations so they don't
  // click a new FRQ → 403 → confusion.
  const showFrqCapCard = isFreeTier && freeAttemptsUsed >= 1;

  return (
    <div className="space-y-6">
      {showFrqCapCard && (
        <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-transparent p-4 sm:p-5 flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-[15px] font-semibold leading-tight">
                You&apos;ve used your free FRQ attempt for this course
              </p>
              <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                Premium unlocks <strong>unlimited FRQ attempts</strong> + line-by-line coaching that tells you exactly which rubric points you&apos;re missing and how to earn them.
              </p>
            </div>
            <Link href="/billing?utm_source=frq_list_cap&utm_campaign=frq_cap">
              <Button size="sm" className="rounded-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                Upgrade — $9.99/mo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {isFirstTaste && !showFrqCapCard && (
        <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-blue-500/5 p-4 sm:p-5">
          <p className="text-[15px] font-semibold mb-1">Your first free FRQ — see how the AP rubric grades you</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Pick any question below. Read the prompt, write a 1-2 paragraph answer, and we&apos;ll score it against the official College Board rubric. No card, no upgrade — just see how it works.
          </p>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PenLine className="h-7 w-7 text-amber-500" />
          FRQ Practice
        </h1>
        <p className="text-muted-foreground mt-1">
          Write your answer, reveal the official rubric, and self-score. {" "}
          <span className="text-amber-700 dark:text-amber-400 font-medium">{AP_COURSES[course] || course}</span>
        </p>
      </div>

      <CourseSelectorInline />

      {!selected && (
        <>
          {/* Subtype tabs — group FRQs by CB-defined question type so
              students see "Practice DBQs" / "Practice LEQs" as distinct
              options instead of one flat mixed list. */}
          {(() => {
            const typeCounts: Record<string, number> = { ALL: list.length };
            for (const f of list) typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
            const types = Array.from(new Set(list.map((f) => f.type))).sort();
            if (types.length <= 1) return null;
            return (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Type:</span>
                <Button
                  size="sm"
                  variant={selectedType === "ALL" ? "default" : "outline"}
                  onClick={() => setSelectedType("ALL")}
                >
                  All ({typeCounts.ALL})
                </Button>
                {types.map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={selectedType === t ? "default" : "outline"}
                    onClick={() => setSelectedType(t)}
                    className="text-xs"
                  >
                    {t} ({typeCounts[t]})
                  </Button>
                ))}
              </div>
            );
          })()}

          {/* Unit filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Unit:</span>
            <Button
              size="sm"
              variant={selectedUnit === "ALL" ? "default" : "outline"}
              onClick={() => setSelectedUnit("ALL")}
            >
              All units
            </Button>
            {unitOptions.map(([unit, meta]) => (
              <Button
                key={unit}
                size="sm"
                variant={selectedUnit === unit ? "default" : "outline"}
                onClick={() => setSelectedUnit(unit)}
                className="text-xs"
              >
                {meta.name}
              </Button>
            ))}
          </div>

          {/* List or empty */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-10 text-center space-y-2">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" onClick={fetchList}>Retry</Button>
              </CardContent>
            </Card>
          ) : list.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">No officially-sourced FRQs for this unit yet</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    We&apos;re still building the official FRQ library for this course.
                    In the meantime, Sage can generate an FRQ on this exact topic with
                    AI-scored rubric feedback — same difficulty, same scoring style.
                  </p>
                </div>
                {/* Beta 7.4 (2026-04-25): escape-hatch out of the previously
                    dead-end empty state. Premium users paid for FRQ practice;
                    redirecting them to /practice with the AI-generated FRQ
                    flow (which works for every course) closes the support
                    thread "I'm Premium and AP Bio shows no FRQs". */}
                <div className="pt-2">
                  <Link href={`/practice?course=${encodeURIComponent(course)}&type=FRQ${selectedUnit && selectedUnit !== "ALL" ? `&unit=${encodeURIComponent(selectedUnit)}` : ""}`}>
                    <Button size="default" className="gap-2">
                      Generate FRQ with Sage
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground/70 pt-1">
                  Or pick a different unit above to find seeded content.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.filter((f) => selectedType === "ALL" || f.type === selectedType).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className="text-left group"
                >
                  <Card className="h-full transition-colors hover:border-amber-500/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          {f.year} Q{f.questionNumber}
                        </CardTitle>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px]">
                            {f.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{f.totalPoints} pts</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {f.promptText.split("\n")[0]}
                      </p>
                      {f.unit && unitMeta[f.unit] && (
                        <p className="text-[11px] text-muted-foreground/70 mt-2">
                          {unitMeta[f.unit]?.name}
                        </p>
                      )}
                      <div className="flex items-center justify-end mt-3 text-xs text-amber-700 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Start <ChevronRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
            ← Back to FRQ list
          </Button>
          <FrqPracticeCard
            frqId={selected.id}
            onNext={() => setSelectedId(null)}
          />

          {/* Beta 9.1.5 — post-FRQ "what's next" guidance for free users
              who just used their free attempt. Without this, they finish
              the FRQ reveal and have no clear direction (user reported:
              'After completing 1st FRQ as free user, it stays in FRQ
              page with no direction'). Maps to JourneyHero's
              frq-done-pre-diag state. */}
          {showFrqCapCard && (
            <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      You&apos;ve unlocked your score
                    </p>
                    <p className="text-base font-semibold leading-snug">
                      Want your projected AP score?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      10 minutes, then you&apos;ll see exactly where you stand on a 1–5 scale + which units to fix first.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link href={`/diagnostic?course=${course}&src=post_frq`}>
                        <Button size="sm" className="rounded-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                          Take 10-min Diagnostic
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/dashboard">
                        <Button size="sm" variant="outline" className="rounded-full gap-2">
                          Back to Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
