"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApCourse } from "@prisma/client";

// Build list of CLEP courses from registry
const CLEP_COURSES = Object.entries(COURSE_REGISTRY)
  .filter(([k]) => k.startsWith("CLEP_"))
  .map(([k, v]) => ({ value: k, label: v.name }));

interface QualityMetrics {
  course: string;
  courseName: string;
  totalQuestions: number;
  approvedQuestions: number;
  topicCoverage: Record<string, { target: number; actual: number; questions: number }>;
  topicCoverageScore: number;
  bloomDistribution: { remember: number; apply: number; analyze: number };
  bloomTarget: { remember: number; apply: number; analyze: number };
  bloomTracked: number;
  scenarioBasedRate: number;
  calibratedQuestions: number;
  avgPValue: number;
  pValueDistribution: { tooEasy: number; good: number; tooHard: number };
  reportRate: number;
  flaggedForReview: number;
  reportedQuestions: number;
  qualityGrade: string;
}

function gradeColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (letter === "B") return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  if (letter === "C") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-red-500/20 text-red-400 border-red-500/40";
}

function gradeBgLarge(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
  if (letter === "B") return "bg-blue-500/15 border-blue-500/30 text-blue-400";
  if (letter === "C") return "bg-yellow-500/15 border-yellow-500/30 text-yellow-400";
  return "bg-red-500/15 border-red-500/30 text-red-400";
}

function statusDot(actual: number, target: number): string {
  const ratio = target > 0 ? actual / target : 0;
  if (ratio >= 0.8) return "bg-emerald-500";
  if (ratio >= 0.5) return "bg-yellow-500";
  return "bg-red-500";
}

export function AdminQualityTab() {
  const [course, setCourse] = useState<string>("CLEP_INTRO_PSYCHOLOGY");
  const [data, setData] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/quality-metrics?course=${course}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json as QualityMetrics);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [course]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading quality metrics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="card-glow">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          {error ?? "No data available."}
        </CardContent>
      </Card>
    );
  }

  const topicEntries = Object.entries(data.topicCoverage);

  return (
    <div className="space-y-6">
      {/* Top row: Grade badge + course selector + total */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className={`flex items-center justify-center w-16 h-16 rounded-xl border-2 text-3xl font-bold ${gradeBgLarge(data.qualityGrade)}`}>
          {data.qualityGrade}
        </div>
        <div className="flex-1 min-w-[200px]">
          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a CLEP course" />
            </SelectTrigger>
            <SelectContent>
              {CLEP_COURSES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {data.totalQuestions} total questions
        </Badge>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="pt-5 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">Topic Coverage</p>
            <p className="text-2xl font-bold">{data.topicCoverageScore.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="pt-5 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">Scenario-Based</p>
            <p className="text-2xl font-bold">{data.scenarioBasedRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="pt-5 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">Avg p-Value</p>
            <p className="text-2xl font-bold">{data.avgPValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="pt-5 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">Calibrated</p>
            <p className="text-2xl font-bold">{data.calibratedQuestions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bloom's Distribution */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-lg">Bloom&apos;s Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">
            {data.bloomTracked} questions tracked &middot; Bars show actual vs target
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["remember", "apply", "analyze"] as const).map((level) => {
            const actual = data.bloomDistribution[level];
            const target = data.bloomTarget[level];
            const maxVal = Math.max(actual, target, 1);
            return (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium">{level}</span>
                  <span className="text-xs text-muted-foreground">
                    {actual}% actual / {target}% target
                  </span>
                </div>
                <div className="relative h-5 rounded-full bg-secondary/50 overflow-hidden">
                  {/* Target marker */}
                  <div
                    className="absolute top-0 h-full border-r-2 border-dashed border-muted-foreground/50"
                    style={{ left: `${(target / maxVal) * 100}%` }}
                  />
                  {/* Actual bar */}
                  <div
                    className={`h-full rounded-full transition-all ${
                      level === "remember"
                        ? "bg-blue-500/70"
                        : level === "apply"
                        ? "bg-emerald-500/70"
                        : "bg-purple-500/70"
                    }`}
                    style={{ width: `${(actual / maxVal) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Topic Coverage Table */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-lg">Topic Coverage</CardTitle>
          <p className="text-xs text-muted-foreground">
            Target vs actual distribution per unit
          </p>
        </CardHeader>
        <CardContent>
          {topicEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground">No topic data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-4 font-medium">Unit Name</th>
                    <th className="text-right py-2 px-3 font-medium">Target %</th>
                    <th className="text-right py-2 px-3 font-medium">Actual %</th>
                    <th className="text-right py-2 px-3 font-medium">Questions</th>
                    <th className="text-center py-2 pl-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topicEntries.map(([unitName, info]) => (
                    <tr key={unitName} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-2 pr-4 text-xs">{unitName}</td>
                      <td className="py-2 px-3 text-right text-xs">{info.target.toFixed(0)}%</td>
                      <td className="py-2 px-3 text-right text-xs">{info.actual.toFixed(0)}%</td>
                      <td className="py-2 px-3 text-right text-xs">{info.questions}</td>
                      <td className="py-2 pl-3 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusDot(info.actual, info.target)}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* p-Value Distribution */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-lg">p-Value Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">
            Difficulty spread across calibrated questions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{data.pValueDistribution.tooEasy}</p>
              <p className="text-xs text-muted-foreground mt-1">Too Easy</p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{data.pValueDistribution.good}</p>
              <p className="text-xs text-muted-foreground mt-1">Good</p>
            </div>
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{data.pValueDistribution.tooHard}</p>
              <p className="text-xs text-muted-foreground mt-1">Too Hard</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Quality */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-lg">Process Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Report Rate</p>
              <p className="text-lg font-semibold">{data.reportRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Flagged for Review</p>
              <p className="text-lg font-semibold">{data.flaggedForReview}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reported Questions</p>
              <p className="text-lg font-semibold">{data.reportedQuestions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
