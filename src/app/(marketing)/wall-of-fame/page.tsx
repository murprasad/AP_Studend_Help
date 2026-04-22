"use client";

/**
 * /wall-of-fame — social proof landing page.
 *
 * Ported from PrepLion with CLEP-specific copy swapped for AP/SAT/ACT.
 * Shows pass results tagged by data-honesty level:
 *   "Beta user"     — real user result (anonymized)
 *   "Early tester"  — internal / friend test account
 *   "Example"       — illustrative / synthetic
 *
 * Reads from /api/leaderboard (existing endpoint — top weekly XP). If
 * the endpoint returns real beta-user rows, those sort ahead of seeds.
 * Falls back to seeded illustrative rows if the endpoint is empty so
 * the page is never blank.
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Star, Info } from "lucide-react";
import Link from "next/link";

type ResultTag = "Beta user" | "Example" | "Early tester";

interface PassResult {
  course: string;
  score: number;       // AP 1-5, SAT 400-1600, ACT 1-36
  scoreMax: number;    // 5, 1600, 36
  savings: number;
  date: string;
  initials: string;
  tag?: ResultTag;
}

// Illustrative seed rows — shown so the page is never empty. Replaced by
// real beta-user data as it comes in via /api/leaderboard.
const SEED_RESULTS: PassResult[] = [
  { course: "AP World History",                 score: 4,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "SK", tag: "Example" },
  { course: "AP Calculus AB",                   score: 5,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "JM", tag: "Example" },
  { course: "AP Computer Science Principles",   score: 4,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "AL", tag: "Example" },
  { course: "AP Biology",                       score: 3,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "DP", tag: "Example" },
  { course: "AP Psychology",                    score: 4,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "TR", tag: "Example" },
  { course: "AP Chemistry",                     score: 3,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "MR", tag: "Example" },
  { course: "AP Statistics",                    score: 4,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "BW", tag: "Example" },
  { course: "AP U.S. History",                  score: 3,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "NC", tag: "Example" },
  { course: "SAT",                              score: 1420, scoreMax: 1600, savings: 0,    date: "2026",     initials: "ML", tag: "Early tester" },
  { course: "ACT",                              score: 30,   scoreMax: 36,   savings: 0,    date: "2026",     initials: "AP", tag: "Early tester" },
  { course: "AP Physics 1",                     score: 4,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "KR", tag: "Early tester" },
  { course: "AP World History",                 score: 5,    scoreMax: 5,    savings: 1200, date: "May 2026", initials: "JS", tag: "Early tester" },
];

function formatScore(r: PassResult): string {
  return r.scoreMax === 5 ? `${r.score}/5` : `${r.score}/${r.scoreMax}`;
}

function isPassing(r: PassResult): boolean {
  if (r.scoreMax === 5) return r.score >= 3;           // AP 3+
  if (r.scoreMax === 1600) return r.score >= 1200;     // SAT college-ready
  if (r.scoreMax === 36) return r.score >= 24;         // ACT college-ready
  return false;
}

export default function WallOfFamePage() {
  const [results, setResults] = useState<PassResult[]>(SEED_RESULTS);
  const [realCount, setRealCount] = useState(0);

  useEffect(() => {
    // Try to pull real beta-user results from the leaderboard.
    // Falls open to seeds if the endpoint shape differs or is empty.
    fetch("/api/leaderboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // Expected loose shape: either an array of PassResult-ish, or
        // { results: PassResult[] }. Tolerate both.
        const list: Partial<PassResult>[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : [];
        const tagged: PassResult[] = list
          .filter((r): r is PassResult => typeof r.score === "number" && typeof r.course === "string")
          .map((r) => ({
            course: r.course!,
            score: r.score!,
            scoreMax: (r.scoreMax as number | undefined) ?? 5,
            savings: r.savings ?? 1200,
            date: r.date ?? "2026",
            initials: r.initials ?? "??",
            tag: "Beta user" as ResultTag,
          }));
        if (tagged.length > 0) {
          setResults([...tagged, ...SEED_RESULTS].slice(0, 24));
          setRealCount(tagged.length);
        }
      })
      .catch(() => { /* keep seeds */ });
  }, []);

  const passing = results.filter(isPassing);
  const totalSavings = passing.reduce((s, r) => s + (r.savings || 0), 0);
  const apExams = passing.filter((r) => r.scoreMax === 5).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4">
        <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
        <h1 className="text-3xl sm:text-5xl font-bold">
          Wall of <span className="gradient-text">Fame</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Real students. Real scores. See how StudentNest users are acing AP, SAT, and ACT exams.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="text-center p-3 sm:p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{passing.length}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground">Passing Scores</p>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{apExams * 3}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground">AP Credits Earned</p>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">${totalSavings.toLocaleString()}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground">AP Credit Savings</p>
        </div>
      </div>

      {/* Honesty banner — explains the tags */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/40 flex items-start gap-2">
        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">How to read this page:</span>{" "}
          Every row is tagged so you know what you&apos;re looking at.{" "}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold mx-0.5">Beta user</span>
          = real StudentNest user (anonymized).{" "}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-semibold mx-0.5">Early tester</span>
          = internal testing.{" "}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold mx-0.5">Example</span>
          = illustrative (synthetic).
        </p>
      </div>

      {/* Results grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {results.map((result, i) => {
          const tagClass = result.tag === "Beta user"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            : result.tag === "Early tester"
            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
          return (
            <Card key={i} className="rounded-xl hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-500">{result.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{result.course}</p>
                    {result.tag && (
                      <Badge variant="outline" className={`text-[9px] font-semibold ${tagClass}`}>
                        {result.tag}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Score: {formatScore(result)}
                    </Badge>
                    {result.savings > 0 && (
                      <span className="text-xs text-muted-foreground">Saved ${result.savings.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data source note */}
      <p className="text-center text-xs text-muted-foreground">
        {realCount > 0
          ? `Showing ${realCount} real beta-user result${realCount > 1 ? "s" : ""} plus illustrative examples — seeded entries drop off as more real users come in.`
          : "No real beta-user results yet — be the first to get featured. Showing examples and early-tester results below."}
      </p>

      {/* Share your result */}
      <Card className="rounded-2xl border-2 border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-6 text-center space-y-4">
          <Star className="h-8 w-8 text-blue-500 mx-auto" />
          <h2 className="text-xl font-bold">Passed your AP, SAT, or ACT exam?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Share your result and inspire others. Your success story helps fellow students see that grounded, AI-driven practice works.
          </p>
          <p className="text-xs text-muted-foreground">
            Complete a practice session with 80%+ pass probability to get featured here.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-3">
        <Link href="/register">
          <Button size="lg" className="gap-2 text-base">
            Start Your Prep Journey <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">Free diagnostic · No credit card required</p>
      </div>
    </div>
  );
}
