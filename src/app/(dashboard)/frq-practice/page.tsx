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
import { Loader2, ChevronRight, PenLine, BookOpen, Lock } from "lucide-react";
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
  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/limits", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setIsFreeTier(d.tier === "FREE" && d.unlimited !== true);
      })
      .catch(() => { /* fail open — assume premium, don't break the page */ })
      .finally(() => { if (!cancelled) setTierLoading(false); });
    return () => { cancelled = true; };
  }, []);

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

  // ── FREE preview — show 1 sample FRQ stem before locking submission ──
  // Updated 2026-04-27: previously full paywall, no preview. User feedback:
  // "Why would I pay if I haven't seen the hardest part yet? Khan lets me
  // explore freely." Now show free users a real DBQ/SAQ stem they can read
  // in full (with rubric exposed), but lock the submit-for-grading flow.
  // Builds credibility before asking for upgrade.
  if (isFreeTier) {
    // Show 1 sample stem from the loaded list (filter by type pref: DBQ→LEQ→SAQ→FRQ)
    const sample = (list.length > 0)
      ? (list.find((f) => f.type === "DBQ")
        ?? list.find((f) => f.type === "LEQ")
        ?? list.find((f) => f.type === "SAQ")
        ?? list[0])
      : null;
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PenLine className="h-7 w-7 text-amber-500" />
            FRQ Practice — Free Preview
          </h1>
          <p className="text-muted-foreground mt-1">
            Read one real {sample?.type ?? "FRQ"} stem with the official rubric. Submit + AI scoring is Premium.
          </p>
        </div>

        <CourseSelectorInline />

        {sample ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
                  {sample.type} · {sample.totalPoints} pts
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {sample.year} Q{sample.questionNumber}
                </Badge>
              </div>
              {sample.stimulus && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Source / Context</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{sample.stimulus.slice(0, 800)}{sample.stimulus.length > 800 ? "…" : ""}</p>
                </div>
              )}
              <div className="prose prose-sm max-w-none">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Question</p>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{sample.promptText}</p>
              </div>
              <div className="pt-3 border-t border-amber-500/20 flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">
                  Write your answer + AI rubric scoring is Premium. Upgrade to grade against the official rubric.
                </p>
                <Link href="/billing?utm_source=frq_preview&utm_campaign=frq_unlock">
                  <Button size="sm" className="rounded-full">Upgrade — $9.99/mo</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Loading sample FRQ for {AP_COURSES[course] || course}…
            </CardContent>
          </Card>
        )}

        <Card className="border-border/40">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-semibold">All you get with Premium</p>
            <ul className="text-sm text-muted-foreground space-y-1 leading-relaxed">
              <li>• Every AP FRQ from 2013 onward, all 14 courses</li>
              <li>• Type your answer → AI grades against the official CB rubric</li>
              <li>• Detailed feedback on thesis, evidence, analysis</li>
              <li>• Unlimited MCQ practice (no daily cap)</li>
              <li>• AI tutor (Sage) unlimited chats</li>
            </ul>
            <Link href="/billing?utm_source=frq_preview&utm_campaign=premium_upsell">
              <Button className="w-full mt-3 rounded-full h-10">
                Upgrade — $9.99/month
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── List view (legacy CLUSTER_A gate removed Beta 8.2) ───────────────────
  const selected = list.find((f) => f.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PenLine className="h-7 w-7 text-amber-500" />
          FRQ Practice
        </h1>
        <p className="text-muted-foreground mt-1">
          Write your answer, reveal the official rubric, and self-score. {" "}
          <span className="text-amber-500 font-medium">{AP_COURSES[course] || course}</span>
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
                          <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px]">
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
                      <div className="flex items-center justify-end mt-3 text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      )}
    </div>
  );
}
