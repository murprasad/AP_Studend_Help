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
} from "lucide-react";

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
  const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
  const [accuracyTimeline, setAccuracyTimeline] = useState<AccuracyPoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?course=${course}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      })
      .then((data) => {
        setMasteryData(data.masteryData || []);
        setAccuracyTimeline(data.accuracyTimeline || []);
        setStats(data.stats);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [course]);

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
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your progress and identify growth areas</p>
      </div>

      {/* Course indicator */}
      <Card className="card-glow border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-indigo-400" />
          <p className="text-sm font-medium">{AP_COURSES[course]}</p>
          <p className="text-xs text-muted-foreground ml-2">— Switch course from the sidebar</p>
        </CardContent>
      </Card>

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
          <CardTitle className="text-lg">Unit-by-Unit Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {masteryData.map((unit) => (
              <div key={unit.unit} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium">{unit.unitName}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getMasteryColor(unit.masteryScore)}`}
                    >
                      {getMasteryLabel(unit.masteryScore)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{Math.round(unit.masteryScore)}%</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({unit.totalAttempts} questions)
                    </span>
                  </div>
                </div>
                <Progress
                  value={unit.masteryScore}
                  className="h-2"
                  indicatorClassName={getMasteryBg(unit.masteryScore)}
                />
              </div>
            ))}
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
    </div>
  );
}
