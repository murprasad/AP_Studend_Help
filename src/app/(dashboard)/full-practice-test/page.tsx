"use client";

// /full-practice-test — CB-style entry point for Digital SAT full-length
// practice tests. Surfaces what the student sees on CB's own Bluebook:
// "Take a full-length practice test."
//
// V1 (this commit): 3 test sets listed; Test 1 available, Tests 2/3 marked
// "Coming soon". Click on Test 1 routes to /mock-exam where the existing
// 2-module SAT/PSAT adaptive flow runs.
//
// V2 (next): each test deals from a specific bank slice (CB corpus) instead
// of the random pool, so Test 1 / Test 2 / Test 3 are deterministic.

import Link from "next/link";
import { useCourse } from "@/hooks/use-course";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Lock, Trophy } from "lucide-react";

interface FullTest {
  id: number;
  label: string;
  status: "available" | "coming-soon";
  description: string;
}

const SAT_TESTS: FullTest[] = [
  {
    id: 1,
    label: "Full Practice Test 1",
    status: "available",
    description:
      "98 questions across two adaptive sections (R&W + Math). Module 1 difficulty determines Module 2 routing, matching the official CB Digital SAT.",
  },
  {
    id: 2,
    label: "Full Practice Test 2",
    status: "coming-soon",
    description: "Releases next week. Same adaptive 2-module structure, fresh question bank.",
  },
  {
    id: 3,
    label: "Full Practice Test 3",
    status: "coming-soon",
    description: "Releases two weeks from launch. Same adaptive structure with new items.",
  },
];

export default function FullPracticeTestPage() {
  const [course] = useCourse();
  const isSatTrack = course === "SAT_MATH" || course === "SAT_READING_WRITING" || course === "PSAT_MATH" || course === "PSAT_READING_WRITING";

  if (!isSatTrack) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mb-3">Full Practice Test</h1>
        <p className="text-muted-foreground">
          Full-length practice tests are available for SAT and PSAT courses. Switch your course (sidebar → course selector) to SAT or PSAT to access this section.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const isSat = course?.startsWith("SAT_");
  const moduleTime = isSat ? (course === "SAT_MATH" ? "35 min" : "32 min") : "32 min";
  const totalTime = isSat ? (course === "SAT_MATH" ? "70 min" : "64 min") : "64 min";
  const qCount = isSat ? (course === "SAT_MATH" ? "44" : "54") : "54";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Hero — CB-style */}
      <div className="mb-8 pb-6 border-b border-border/40">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-7 w-7 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Full Practice Test</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Full-length, two-module {isSat ? "SAT" : "PSAT"} mock — adaptive Module 2 routing, official timing, Desmos calculator, official scoring.
            </p>
          </div>
        </div>

        {/* Stats row — matches CB's spec page */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="rounded-lg border border-border/40 bg-card p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Questions</p>
            <p className="text-xl font-semibold mt-0.5">{qCount}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Time</p>
            <p className="text-xl font-semibold mt-0.5">{totalTime}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Per Module</p>
            <p className="text-xl font-semibold mt-0.5">{moduleTime}</p>
          </div>
        </div>
      </div>

      {/* Test list */}
      <div className="space-y-3">
        {SAT_TESTS.map((t) => {
          const isAvailable = t.status === "available";
          return (
            <Card key={t.id} className={`${isAvailable ? "" : "opacity-60"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isAvailable ? "bg-blue-500/10" : "bg-muted"}`}>
                      {isAvailable ? <FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-base font-semibold">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                  </div>
                  {isAvailable ? (
                    <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Available</Badge>
                  ) : (
                    <Badge variant="outline">Coming soon</Badge>
                  )}
                </div>
              </CardHeader>
              {isAvailable && (
                <CardContent className="pt-0 pl-[3.25rem]">
                  <div className="flex items-center gap-3">
                    <Button asChild>
                      <Link href={`/mock-exam?test=${t.id}`}>
                        Start Test {t.id} →
                      </Link>
                    </Button>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Allow {totalTime} of uninterrupted time
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-border/40 bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">What to expect</p>
        <ul className="text-sm text-foreground/80 space-y-1.5">
          <li>• Two modules per section, separated by a 10-minute break (CB-spec)</li>
          <li>• Module 1 performance determines Module 2 difficulty (adaptive routing)</li>
          <li>• Built-in Desmos graphing calculator (Math only, available on every question)</li>
          <li>• Official 200–800 scaled score on completion</li>
          <li>• Per-question time, no early submit on Module 1</li>
        </ul>
      </div>
    </div>
  );
}
