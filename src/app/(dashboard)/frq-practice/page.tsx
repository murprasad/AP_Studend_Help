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
import { Loader2, ChevronRight, PenLine, BookOpen } from "lucide-react";

// ── Cluster A: quantitative FRQs currently supported ─────────────────────────
// Other AP courses still see the page shell + an "FRQs coming soon" note so
// the link in the sidebar never dead-ends.
const CLUSTER_A: ApCourse[] = [
  "AP_PHYSICS_1",
  "AP_CALCULUS_AB",
  "AP_CALCULUS_BC",
  "AP_BIOLOGY",
  "AP_CHEMISTRY",
  "AP_STATISTICS",
];

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
  const course = (urlCourse && CLUSTER_A.includes(urlCourse) ? urlCourse : persistedCourse) as ApCourse;

  const [list, setList] = useState<FrqListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ApUnit | "ALL">("ALL");

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

  // ── Out-of-cluster course: explain + link back ────────────────────────────
  if (!CLUSTER_A.includes(course)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">FRQ Practice</h1>
          <p className="text-muted-foreground mt-1">
            Past exam free-response questions with official rubrics and sample answers.
          </p>
        </div>
        <CourseSelectorInline />
        <Card>
          <CardContent className="py-16 text-center space-y-2">
            <p className="text-lg font-medium">
              FRQs for {AP_COURSES[course] || course} coming soon.
            </p>
            <p className="text-sm text-muted-foreground">
              We&apos;re rolling out free-response practice starting with quantitative
              courses (Physics 1, Calc AB/BC, Biology, Chemistry, Statistics).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── In-cluster: drill view or list view ───────────────────────────────────
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
              <CardContent className="py-16 text-center space-y-2">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium">No FRQs available for this unit yet.</p>
                <p className="text-sm text-muted-foreground">
                  Pick a different unit or choose &quot;All units&quot; above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((f) => (
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
