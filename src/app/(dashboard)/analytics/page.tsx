"use client";

import { useEffect, useState } from "react";
import { useExamMode } from "@/hooks/use-exam-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { getMasteryLabel, getMasteryColor, getMasteryBg, formatTime, AP_COURSES } from "@/lib/utils";
import { useCourse } from "@/hooks/use-course";
import {
  BarChart3,
  Target,
  Clock,
  Flame,
  Star,
  TrendingUp,
  Loader2,
  GraduationCap,
  Crown,
  Sparkles,
  Flag,
  X,
} from "lucide-react";
import { CourseSelectorInline } from "@/components/layout/course-selector-inline";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ApCourse, ApUnit } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

interface MasteryData {
  unit: string;
  unitName: string;
  masteryScore: number;
  accuracy: number;
  totalAttempts: number;
}

interface AccuracyPoint {
  date: string;
  accuracy: number;
  questions: number;
}

interface Stats {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  avgTimeSecs: number;
  totalSessions: number;
  streakDays: number;
  totalXp: number;
  level: number;
  estimatedApScore: number | null;
}

export default function AnalyticsPage() {
  const [course] = useCourse();
  const { data: session } = useSession();
  const { toast } = useToast();

  // Full-screen mode — hide sidebar + SageChat + bottom nav for chart
  // breathing room. Slim top bar with "← Dashboard" still available.
  const { enterExamMode, exitExamMode } = useExamMode();
  useEffect(() => { enterExamMode(); return () => exitExamMode(); }, [enterExamMode, exitExamMode]);
  const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
  const [accuracyTimeline, setAccuracyTimeline] = useState<AccuracyPoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [knowledgeCheckStats, setKnowledgeCheckStats] = useState<{
    totalChecks: number;
    avgComprehension: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Record<string, { targetScore: number; targetDate?: string }>>({});
  const [goalModalUnit, setGoalModalUnit] = useState<{ unit: string; unitName: string; current: number } | null>(null);
  const [goalTarget, setGoalTarget] = useState("75");
  const [goalDate, setGoalDate] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);
  const [clepReadiness, setClepReadiness] = useState<{ score: number; label: string; threshold: number } | null>(null);
  // Early-stage predicted score for users who haven't completed a mock exam yet
  // (estimatedApScore stays null until then). Sourced from /api/readiness so the
  // first-answer reward modal's "see my predicted score" CTA actually delivers
  // something visible from question 1, not a blank page.
  const [earlyReadiness, setEarlyReadiness] = useState<{
    showScore: boolean;
    scaledScore: number | null;
    scaleMax: number;
    label: string;
    family: "AP" | "SAT" | "ACT";
    confidence: "very_low" | "low" | "medium" | "high";
  } | null>(null);
  const isCLEP = course.startsWith("CLEP_");
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [stale, setStale] = useState(false);
  const [cachedCourse, setCachedCourse] = useState<string>("");

  useEffect(() => {
    const hasData = stats !== null && cachedCourse === course;
    setLoading(!hasData); // only show spinner if no cached data for THIS course
    setRefreshing(hasData); // show subtle banner if we have cached data for THIS course
    setError(null);
    setStale(false);
    setFeatureDisabled(false);
    // Use allSettled so one failing fetch doesn't block the other
    Promise.allSettled([
      fetch(`/api/analytics?course=${course}`, { signal: AbortSignal.timeout(40000) }).then((r) => {
        if (r.status === 503) { setFeatureDisabled(true); throw new Error("under-maintenance"); }
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      }),
      fetch(`/api/mastery-goal?course=${course}`, { signal: AbortSignal.timeout(40000) }).then((r) => r.json()).catch(() => ({ goals: [] })),
    ])
      .then(([analyticsResult, goalResult]) => {
        const goalData = goalResult.status === "fulfilled" ? goalResult.value : { goals: [] };
        if (analyticsResult.status === "fulfilled") {
          const data = analyticsResult.value;
          setMasteryData(data.masteryData || []);
          setAccuracyTimeline(data.accuracyTimeline || []);
          setStats(data.stats);
          setKnowledgeCheckStats(data.knowledgeCheckStats ?? null);
          setClepReadiness(data.clepReadiness ?? null);
          setCachedCourse(course);
          setStale(false);
          setError(null);
        } else {
          // Analytics fetch failed — show stale data or error
          if (hasData) {
            setStale(true);
          } else {
            const reason = analyticsResult.reason;
            if (reason?.message === "under-maintenance") return;
            setError("Failed to load analytics — check your connection and try again.");
          }
        }
        const goalMap: Record<string, { targetScore: number; targetDate?: string }> = {};
        for (const g of (goalData.goals || [])) {
          goalMap[g.unit] = { targetScore: g.targetScore, targetDate: g.targetDate };
        }
        setGoals(goalMap);
      })
      .finally(() => { setLoading(false); setRefreshing(false); });

    // Fire-and-forget readiness fetch for the early-stage predicted-score
    // panel. Silently swallowed on failure — the panel just won't render.
    fetch(`/api/readiness?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.scaledScore !== "undefined") {
          setEarlyReadiness({
            showScore: !!d.showScore,
            scaledScore: d.scaledScore ?? null,
            scaleMax: d.scaleMax ?? 5,
            label: d.label ?? "",
            family: d.family ?? "AP",
            confidence: d.confidence ?? "very_low",
          });
        }
      })
      .catch(() => { /* silent — early-estimate panel just hides */ });
  }, [course]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveGoal() {
    if (!goalModalUnit) return;
    setGoalSaving(true);
    try {
      const res = await fetch("/api/mastery-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course,
          unit: goalModalUnit.unit,
          targetScore: parseFloat(goalTarget),
          targetDate: goalDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setGoals((prev) => ({
        ...prev,
        [goalModalUnit.unit]: { targetScore: parseFloat(goalTarget), targetDate: goalDate || undefined },
      }));
      setGoalModalUnit(null);
    } catch {
      toast({ title: "Error", description: "Failed to save goal. Please try again.", variant: "destructive" });
    } finally {
      setGoalSaving(false);
    }
  }

  async function deleteGoal(unit: string) {
    const res = await fetch(`/api/mastery-goal?unit=${encodeURIComponent(unit)}&course=${encodeURIComponent(course)}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setGoals((prev) => {
        const next = { ...prev };
        delete next[unit];
        return next;
      });
    } else {
      toast({ title: "Error", description: "Failed to remove goal.", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-8 w-48 bg-secondary/60 rounded-lg animate-pulse" /><div className="h-4 w-72 bg-secondary/40 rounded mt-2 animate-pulse" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-border/40 bg-card/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/40 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-16 bg-secondary/60 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-secondary/40 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl border border-border/40 bg-card/50 animate-pulse" />
          <div className="h-64 rounded-xl border border-border/40 bg-card/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (featureDisabled) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Under Maintenance</h2>
          <p className="text-muted-foreground">Analytics is temporarily being improved. Check back soon for an even better experience.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">Failed to load analytics</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const chartData = masteryData.map((d) => ({
    name: d.unitName.replace(/Unit \d+: /, "").slice(0, 14),
    mastery: Math.round(d.masteryScore),
    accuracy: Math.round(d.accuracy),
  }));

  return (
    // Beta 8.1.1: Analytics breaks out of dashboard layout's max-w-7xl
    // container so charts have full screen width. Negative margins reclaim
    // the gutter; w-screen + lg:w-auto keeps it wide on desktop without
    // breaking mobile. Back-to-dashboard link added per user request so the
    // page has a clear escape (other screens have it via sidebar).
    <div className="-mx-4 sm:-mx-6 -my-4 sm:-my-6 px-4 sm:px-6 py-4 sm:py-6 min-h-screen bg-background space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      {(stale || refreshing) && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {stale ? "Couldn\u2019t refresh \u2014 showing your last loaded analytics." : "Refreshing analytics..."}
        </div>
      )}
      {/* Goal-setting modal */}
      {goalModalUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border/40 rounded-xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Set Mastery Goal</h3>
              <button onClick={() => setGoalModalUnit(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{goalModalUnit.unitName}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-bold">{Math.round(goalModalUnit.current)}%</span>
              <span className="text-muted-foreground ml-2">Target:</span>
              <span className="font-bold text-blue-500">{goalTarget}%</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Target mastery (%)</label>
              <input
                type="range"
                min={Math.ceil(goalModalUnit.current) + 1}
                max={100}
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.ceil(goalModalUnit.current) + 1}%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Target date (optional)</label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="w-full rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setGoalModalUnit(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border/40 text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveGoal}
                disabled={goalSaving}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {goalSaving ? "Saving…" : "Set Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your progress and identify growth areas</p>
      </div>

      <CourseSelectorInline />

      {/* CLEP Readiness Score */}
      {isCLEP && clepReadiness && (
        <Card className="card-glow border-emerald-500/20 bg-emerald-500/[0.03]">
          <CardContent className="p-5">
            <div className="flex items-center gap-6">
              {/* SVG Gauge */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={clepReadiness.score >= 70 ? "#10b981" : clepReadiness.score >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(clepReadiness.score / 100) * 264} 264`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{clepReadiness.score}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-400 text-sm mb-1">CLEP Readiness</p>
                <p className="text-lg font-bold">{clepReadiness.label}</p>
                <p className="text-xs text-muted-foreground mt-1">Target: {clepReadiness.threshold}% mastery across all units</p>
                {clepReadiness.score >= 70 && (
                  <a href="https://clep.collegeboard.org/clep-search" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2 font-medium">
                    Find a test center →
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.overallAccuracy || 0}%</p>
                <p className="text-xs text-muted-foreground">Overall Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalAnswered || 0}</p>
                <p className="text-xs text-muted-foreground">Questions Answered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.streakDays || 0}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalXp || 0}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Narrative insight */}
      {stats && stats.totalAnswered > 0 && (
        <div className="rounded-lg border border-border/40 bg-card/50 px-4 py-3 flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            {stats.overallAccuracy >= 80
              ? `You're doing great — ${stats.overallAccuracy}% accuracy across ${stats.totalAnswered} questions. Keep pushing toward 90%+!`
              : stats.overallAccuracy >= 60
              ? `Solid progress — ${stats.overallAccuracy}% accuracy. Focus on your weakest units to break through to 80%+.`
              : `You're building momentum — ${stats.totalAnswered} questions answered. Keep practicing daily and watch your accuracy climb.`}
            {masteryData.length > 0 && (() => {
              const mastered = masteryData.filter((u) => u.masteryScore >= 70).length;
              const total = masteryData.length;
              return mastered > 0 ? ` ${mastered}/${total} units at mastery.` : "";
            })()}
          </p>
        </div>
      )}

      {/* Tutor Comprehension card — only if user has taken at least one check */}
      {knowledgeCheckStats && knowledgeCheckStats.totalChecks > 0 && (
        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {knowledgeCheckStats.avgComprehension !== null
                    ? `${knowledgeCheckStats.avgComprehension}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tutor Comprehension ({knowledgeCheckStats.totalChecks}{" "}
                  {knowledgeCheckStats.totalChecks === 1 ? "check" : "checks"} taken)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Early-stage predicted-score panel — renders for users who have ≥1
          answer but no mock-exam-derived estimatedApScore yet. Catches the
          first-answer-reward-modal cohort so the "see my predicted score"
          CTA actually delivers something visible. The /api/readiness route
          returns a tentative scaledScore + a confidence label; we surface
          both honestly so users know it sharpens with practice. */}
      {!stats?.estimatedApScore && stats && stats.totalAnswered > 0 && earlyReadiness && (
        <Card className="card-glow border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-5 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              {earlyReadiness.showScore && earlyReadiness.scaledScore !== null ? (
                <span className="text-2xl font-bold text-blue-500">
                  {earlyReadiness.family === "AP"
                    ? earlyReadiness.scaledScore
                    : earlyReadiness.scaledScore.toLocaleString()}
                </span>
              ) : (
                <Sparkles className="h-7 w-7 text-blue-500" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {earlyReadiness.showScore && earlyReadiness.scaledScore !== null
                  ? `Predicted ${earlyReadiness.family} Score: ${earlyReadiness.scaledScore}${earlyReadiness.family === "AP" ? "/5" : `/${earlyReadiness.scaleMax}`}`
                  : "Building your predicted score…"}
              </p>
              <p className="text-sm text-muted-foreground">
                {earlyReadiness.showScore
                  ? `Based on ${stats.totalAnswered} ${stats.totalAnswered === 1 ? "answer" : "answers"} so far. Confidence: ${earlyReadiness.confidence.replace("_", " ")}. Take a mock exam for a more accurate score.`
                  : `You've answered ${stats.totalAnswered}. Predicted score sharpens with each question — most students see a stable estimate around 10 answers in.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estimated AP Score (mock-exam-derived — shown once user has a real mock result) */}
      {stats?.estimatedApScore && (
        <Card className="card-glow border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-5 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-blue-500">{stats.estimatedApScore}</span>
            </div>
            <div>
              <p className="font-semibold text-lg">Estimated AP Score: {stats.estimatedApScore}/5</p>
              <p className="text-sm text-muted-foreground">
                Based on your most recent mock exam performance.{" "}
                {stats.estimatedApScore >= 4
                  ? "You're on track to pass!"
                  : "Keep practicing to improve your score."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unit Mastery Bar Chart */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg">Mastery by Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(v: number) => [`${v}%`, "Mastery"]}
                    />
                    <Bar dataKey="mastery" fill="#1865F2" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No mastery data yet — start practicing!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Timeline */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Accuracy Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {accuracyTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyTimeline}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(v: number) => [`${v}%`, "Accuracy"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Complete practice sessions to see your progress over time
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed unit breakdown */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Unit-by-Unit Breakdown
            <span className="text-xs font-normal text-muted-foreground">Click a unit to set a mastery goal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {masteryData.map((unit) => {
              const goal = goals[unit.unit];
              const ptsToGo = goal ? Math.max(0, goal.targetScore - unit.masteryScore) : null;
              return (
                <div key={unit.unit} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{unit.unitName}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${getMasteryColor(unit.masteryScore)}`}
                      >
                        {getMasteryLabel(unit.masteryScore)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold">{Math.round(unit.masteryScore)}%</span>
                      {goal ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-500">→ {Math.round(goal.targetScore)}%</span>
                          <button
                            onClick={() => deleteGoal(unit.unit)}
                            className="text-muted-foreground hover:text-red-400 transition-colors"
                            title="Remove goal"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setGoalModalUnit({ unit: unit.unit, unitName: unit.unitName, current: unit.masteryScore });
                            setGoalTarget(String(Math.min(100, Math.ceil(unit.masteryScore) + 15)));
                            setGoalDate("");
                          }}
                          className="text-muted-foreground hover:text-blue-500 transition-colors"
                          title="Set mastery goal"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    {/* Beta 7.5 (2026-04-25): added aria-label so screen readers
                        announce "<unitName> mastery: 67 percent" instead of an
                        unlabelled progressbar. Caught by axe in deploy22 Playwright
                        a11y-scan (rule: aria-progressbar-name, severity: serious). */}
                    <Progress
                      value={unit.masteryScore}
                      className="h-2"
                      indicatorClassName={getMasteryBg(unit.masteryScore)}
                      aria-label={`${unit.unitName ?? unit.unit} mastery: ${Math.round(unit.masteryScore)}%`}
                    />
                    {goal && (
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-blue-500 rounded"
                        style={{ left: `${Math.min(goal.targetScore, 100)}%` }}
                        title={`Goal: ${Math.round(goal.targetScore)}%`}
                        aria-label={`Goal target: ${Math.round(goal.targetScore)}%`}
                      />
                    )}
                  </div>
                  {goal && ptsToGo !== null && ptsToGo > 0 && (
                    <p className="text-[10px] text-blue-500">
                      {Math.round(ptsToGo)} pts to goal
                      {goal.targetDate ? ` · by ${new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                    </p>
                  )}
                  {goal && ptsToGo === 0 && (
                    <p className="text-[10px] text-emerald-400">Goal reached! 🎉</p>
                  )}
                  <p className="text-xs text-muted-foreground">({unit.totalAttempts} questions)</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Avg time */}
      {stats && (
        <Card className="card-glow">
          <CardContent className="p-5 flex items-center gap-4">
            <Clock className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Average time per question</p>
              <p className="text-2xl font-bold">{formatTime(stats.avgTimeSecs)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Total sessions (last 14 days)</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium upgrade CTA — shown to free users */}
      {session?.user?.subscriptionTier !== "PREMIUM" && session?.user?.subscriptionTier !== "AP_PREMIUM" && session?.user?.subscriptionTier !== "CLEP_PREMIUM" && (() => {
        const analyticsTrack = (session?.user as { track?: string })?.track ?? "ap";
        const isClep = analyticsTrack === "clep";
        return (
        <Card className={isClep ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5" : "border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/5"}>
          <CardContent className="p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isClep ? "bg-emerald-500/20" : "bg-blue-500/20"}`}>
              <Sparkles className={`h-5 w-5 ${isClep ? "text-emerald-400" : "text-blue-500"}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Unlock advanced analytics with {isClep ? "CLEP Premium" : "AP Premium"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isClep
                  ? "See detailed weak-area breakdowns, time-per-question trends, and know exactly which units to focus on before your CLEP exam."
                  : `See detailed weak-area breakdowns, time-per-question trends, and an AI-generated action plan to push your estimated score from ${stats?.estimatedApScore || "?"} to a 5.`}
              </p>
            </div>
            <Link href="/billing">
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors whitespace-nowrap ${isClep ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                <Crown className="h-3.5 w-3.5" />
                Upgrade
              </button>
            </Link>
          </CardContent>
        </Card>);
      })()}
    </div>
  );
}
