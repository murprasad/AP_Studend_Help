"use client";

import { useEffect, useState } from "react";
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
  const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
  const [accuracyTimeline, setAccuracyTimeline] = useState<AccuracyPoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [knowledgeCheckStats, setKnowledgeCheckStats] = useState<{
    totalChecks: number;
    avgComprehension: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Record<string, { targetScore: number; targetDate?: string }>>({});
  const [goalModalUnit, setGoalModalUnit] = useState<{ unit: string; unitName: string; current: number } | null>(null);
  const [goalTarget, setGoalTarget] = useState("75");
  const [goalDate, setGoalDate] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/analytics?course=${course}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      }),
      fetch(`/api/mastery-goal?course=${course}`).then((r) => r.json()).catch(() => ({ goals: [] })),
    ])
      .then(([data, goalData]) => {
        setMasteryData(data.masteryData || []);
        setAccuracyTimeline(data.accuracyTimeline || []);
        setStats(data.stats);
        setKnowledgeCheckStats(data.knowledgeCheckStats ?? null);
        const goalMap: Record<string, { targetScore: number; targetDate?: string }> = {};
        for (const g of (goalData.goals || [])) {
          goalMap[g.unit] = { targetScore: g.targetScore, targetDate: g.targetDate };
        }
        setGoals(goalMap);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [course]);

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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
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
    <div className="space-y-6">
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
              <span className="font-bold text-indigo-400">{goalTarget}%</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Target mastery (%)</label>
              <input
                type="range"
                min={Math.ceil(goalModalUnit.current) + 1}
                max={100}
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full accent-indigo-500"
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
                className="w-full rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
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

      {/* Tutor Comprehension card — only if user has taken at least one check */}
      {knowledgeCheckStats && knowledgeCheckStats.totalChecks > 0 && (
        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-400" />
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

      {/* Estimated AP Score */}
      {stats?.estimatedApScore && (
        <Card className="card-glow border-indigo-500/30 bg-indigo-500/5">
          <CardContent className="p-5 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-400">{stats.estimatedApScore}</span>
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
                    <Bar dataKey="mastery" fill="#6366f1" radius={[0, 4, 4, 0]} />
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
                          <span className="text-xs text-indigo-400">→ {Math.round(goal.targetScore)}%</span>
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
                          className="text-muted-foreground hover:text-indigo-400 transition-colors"
                          title="Set mastery goal"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Progress
                      value={unit.masteryScore}
                      className="h-2"
                      indicatorClassName={getMasteryBg(unit.masteryScore)}
                    />
                    {goal && (
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-indigo-400 rounded"
                        style={{ left: `${Math.min(goal.targetScore, 100)}%` }}
                        title={`Goal: ${Math.round(goal.targetScore)}%`}
                      />
                    )}
                  </div>
                  {goal && ptsToGo !== null && ptsToGo > 0 && (
                    <p className="text-[10px] text-indigo-400">
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
        <Card className={isClep ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5" : "border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/5"}>
          <CardContent className="p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isClep ? "bg-emerald-500/20" : "bg-indigo-500/20"}`}>
              <Sparkles className={`h-5 w-5 ${isClep ? "text-emerald-400" : "text-indigo-400"}`} />
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
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors whitespace-nowrap ${isClep ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
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
