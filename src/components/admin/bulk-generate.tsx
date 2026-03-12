"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { COURSE_UNITS, AP_COURSES } from "@/lib/utils";
import { ApUnit, ApCourse } from "@prisma/client";
import {
  Brain, Loader2, CheckCircle, Zap, AlertTriangle, RefreshCw, Database,
} from "lucide-react";

interface GeneratedResult {
  id: string;
  topic: string;
  unit: string;
  difficulty: string;
}

interface UnitCoverage {
  unit: string;
  name: string;
  count: number;
  status: "good" | "low" | "critical";
}

interface PopulateDetail {
  unit: string;
  name: string;
  needed: number;
  generated: number;
  status: "ok" | "skipped" | "failed";
  error?: string;
}

const COURSES = Object.keys(AP_COURSES) as ApCourse[];

export function AdminBulkGenerate() {
  const { toast } = useToast();

  // ── Targeted generation ────────────────────────────────────────────────────
  const [targetCourse, setTargetCourse] = useState<ApCourse>("AP_WORLD_HISTORY");
  const [unit, setUnit] = useState<string>("ALL");
  const [difficulty, setDifficulty] = useState<string>("ALL");
  const [count, setCount] = useState<string>("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);

  // ── Populate-all ────────────────────────────────────────────────────────────
  const [populateCourse, setPopulateCourse] = useState<ApCourse>("AP_WORLD_HISTORY");
  const [minPerUnit, setMinPerUnit] = useState<string>("20");
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateDetails, setPopulateDetails] = useState<PopulateDetail[]>([]);
  const [populateSummary, setPopulateSummary] = useState<{ filled: number; skipped: number; failed: number } | null>(null);

  // ── Coverage report ─────────────────────────────────────────────────────────
  const [coverage, setCoverage] = useState<Record<string, UnitCoverage[]>>({});
  const [loadingCoverage, setLoadingCoverage] = useState(false);

  const fetchCoverage = useCallback(async () => {
    setLoadingCoverage(true);
    try {
      const res = await fetch("/api/admin/populate-questions");
      const data = await res.json();
      if (res.ok) setCoverage(data.coverage ?? {});
    } catch {
      // silently ignore
    } finally {
      setLoadingCoverage(false);
    }
  }, []);

  useEffect(() => { fetchCoverage(); }, [fetchCoverage]);

  // Reset unit when course changes
  useEffect(() => { setUnit("ALL"); }, [targetCourse]);

  // ── Targeted generation handler ────────────────────────────────────────────
  async function handleGenerate() {
    setIsGenerating(true);
    setResults([]);
    try {
      const response = await fetch("/api/ai/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: parseInt(count),
          unit: unit === "ALL" ? undefined : unit,
          difficulty: difficulty === "ALL" ? undefined : difficulty,
          course: targetCourse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setResults(data.questions);
      toast({
        title: `Generated ${data.generated} questions!`,
        description: "Questions added to the question bank.",
      });
      fetchCoverage();
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Populate-all handler ────────────────────────────────────────────────────
  async function handlePopulateAll() {
    setIsPopulating(true);
    setPopulateDetails([]);
    setPopulateSummary(null);
    try {
      const response = await fetch("/api/admin/populate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: populateCourse, minPerUnit: parseInt(minPerUnit) }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setPopulateDetails(data.details ?? []);
      setPopulateSummary({ filled: data.filled, skipped: data.skipped, failed: data.failed });
      toast({
        title: `Populated! +${data.filled} questions added`,
        description: `${data.skipped} units already had enough. ${data.failed} failed.`,
      });
      fetchCoverage();
    } catch {
      toast({ title: "Population failed", variant: "destructive" });
    } finally {
      setIsPopulating(false);
    }
  }

  const courseUnits = COURSE_UNITS[targetCourse];
  const courseCoverage = coverage[populateCourse] ?? [];
  const totalCritical = courseCoverage.filter((u) => u.status === "critical").length;
  const totalLow = courseCoverage.filter((u) => u.status === "low").length;

  return (
    <div className="space-y-6">
      {/* ── Question Bank Coverage ────────────────────────────────────────── */}
      <Card className="card-glow border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5 text-yellow-400" />
              Question Bank Coverage
            </span>
            <Button variant="ghost" size="sm" onClick={fetchCoverage} disabled={loadingCoverage}>
              <RefreshCw className={`h-4 w-4 ${loadingCoverage ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Students need ≥20 unique questions per unit for meaningful practice.
            Red = critical (&lt;10), yellow = low (10–19), green = good (20+).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {COURSES.map((course) => {
            const units = coverage[course] ?? [];
            const critical = units.filter((u) => u.status === "critical").length;
            const total = units.reduce((s, u) => s + u.count, 0);
            return (
              <div key={course}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{AP_COURSES[course]}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{total} total</span>
                    {critical > 0 && (
                      <Badge variant="destructive" className="text-xs">{critical} critical</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {units.map((u) => (
                    <div
                      key={u.unit}
                      className={`text-xs p-2 rounded-lg flex items-center justify-between gap-1 ${
                        u.status === "good"
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : u.status === "low"
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : "bg-red-500/10 border border-red-500/30"
                      }`}
                    >
                      <span className="truncate text-muted-foreground" title={u.name}>
                        {u.name.replace(/Unit \d+: /, "").slice(0, 18)}
                      </span>
                      <span className={`font-bold flex-shrink-0 ${
                        u.status === "good" ? "text-emerald-400" :
                        u.status === "low" ? "text-yellow-400" : "text-red-400"
                      }`}>{u.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Populate All Units ────────────────────────────────────────────── */}
      <Card className="card-glow border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            Auto-Populate Question Bank
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Fills every unit up to the minimum question count using the AI cascade (Groq → Pollinations fallback).
            Only generates for units that are below the minimum.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(totalCritical > 0 || totalLow > 0) && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                {AP_COURSES[populateCourse]}: {totalCritical} units critical (&lt;10 questions), {totalLow} units low.
                Students will see repeated questions immediately.
              </p>
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground">Course</label>
              <Select value={populateCourse} onValueChange={(v) => setPopulateCourse(v as ApCourse)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c} value={c}>{AP_COURSES[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Min questions/unit</label>
              <Select value={minPerUnit} onValueChange={setMinPerUnit}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 (minimum)</SelectItem>
                  <SelectItem value="20">20 (recommended)</SelectItem>
                  <SelectItem value="30">30 (solid)</SelectItem>
                  <SelectItem value="50">50 (exam-ready)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handlePopulateAll}
            disabled={isPopulating}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isPopulating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating (this takes a few minutes)...</>
            ) : (
              <><Database className="h-4 w-4" /> Populate All Units — {AP_COURSES[populateCourse]}</>
            )}
          </Button>

          {isPopulating && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <p className="text-sm text-emerald-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating questions for each unit... Do not close this tab.
              </p>
              <Progress value={
                populateDetails.length > 0
                  ? (populateDetails.length / (coverage[populateCourse]?.length || 1)) * 100
                  : 0
              } className="h-1.5" indicatorClassName="bg-emerald-500" />
            </div>
          )}

          {populateSummary && (
            <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">+{populateSummary.filled}</p>
                  <p className="text-xs text-muted-foreground">Questions added</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{populateSummary.skipped}</p>
                  <p className="text-xs text-muted-foreground">Units already OK</p>
                </div>
                {populateSummary.failed > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{populateSummary.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {populateDetails.map((d) => (
                  <div key={d.unit} className="flex items-center gap-2 text-xs">
                    {d.status === "ok" && <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />}
                    {d.status === "skipped" && <span className="text-blue-400 flex-shrink-0">–</span>}
                    {d.status === "failed" && <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />}
                    <span className="flex-1 text-muted-foreground truncate">{d.name}</span>
                    <span className="text-right">
                      {d.status === "skipped"
                        ? "already had enough"
                        : d.status === "failed"
                        ? `failed: ${d.error?.slice(0, 40)}`
                        : `+${d.generated}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Targeted generation ───────────────────────────────────────────── */}
      <Card className="card-glow border-indigo-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-400" />
            Generate Specific Questions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate a targeted batch for a specific unit or difficulty level.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Course</label>
              <Select value={targetCourse} onValueChange={(v) => setTargetCourse(v as ApCourse)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c} value={c}>{AP_COURSES[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Unit</label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Units</SelectItem>
                  {(Object.keys(courseUnits) as ApUnit[]).map((u) => (
                    <SelectItem key={u} value={u}>{courseUnits[u]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Mixed</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Count</label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 questions</SelectItem>
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="10">10 questions</SelectItem>
                  <SelectItem value="20">20 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating {count} questions...</>
            ) : (
              <><Zap className="h-4 w-4" /> Generate Questions</>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {results.length} questions added to question bank
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 text-xs">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="flex-1">{r.topic}</span>
                    <Badge variant="outline" className="text-xs">{r.difficulty}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
