"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/use-course";
import { useExamMode } from "@/hooks/use-exam-mode";
import { AP_COURSES } from "@/lib/utils";
import {
  BookOpen,
  Target,
  Clock,
  RefreshCw,
  Loader2,
  Lightbulb,
  Trophy,
  ChevronRight,
  Zap,
  GraduationCap,
} from "lucide-react";
import { CourseSelectorInline } from "@/components/layout/course-selector-inline";
import Link from "next/link";

interface StudyPlan {
  weeklyGoal: string;
  dailyMinutes: number;
  focusAreas: Array<{
    unit: string;
    priority: "high" | "medium" | "low";
    reason: string;
    mcqCount: number;
    saqCount: number;
    estimatedMinutes: number;
    resources?: string[];
  }>;
  strengths: string[];
  tips: string[];
  dailySchedule?: Record<string, string>;
}

interface CLEP7DayPlan {
  planType: "7day";
  courseName: string;
  isStatic?: boolean;
  days: Array<{
    day: number;
    theme: string;
    units: string[];
    tasks: string[];
    estimatedMinutes: number;
    milestone: string;
  }>;
  readinessThreshold: number;
  examTip: string;
}

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-500/30 bg-red-500/10",
  medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  low: "text-blue-400 border-blue-500/30 bg-blue-500/10",
};

export default function StudyPlanPage() {
  const { toast } = useToast();
  const [course] = useCourse();

  // Full-screen mode â€” sidebar hidden for wider plan tables.
  const { enterExamMode, exitExamMode } = useExamMode();
  useEffect(() => { enterExamMode(); return () => exitExamMode(); }, [enterExamMode, exitExamMode]);

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [stale, setStale] = useState(false);
  const [cachedCourse, setCachedCourse] = useState<string>("");
  const [planMode, setPlanMode] = useState<"weekly" | "7day">("weekly");
  const [sevenDayPlan, setSevenDayPlan] = useState<CLEP7DayPlan | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [readinessScore, setReadinessScore] = useState(0);
  const isCLEP = course.startsWith("CLEP_");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`clep_7day_${course}`);
      if (saved) setCheckedTasks(JSON.parse(saved));
    } catch {}
    // Fetch readiness score for CLEP courses
    if (course.startsWith("CLEP_")) {
      fetch(`/api/analytics?course=${course}`, { signal: AbortSignal.timeout(10000) })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.clepReadiness) setReadinessScore(data.clepReadiness.score); })
        .catch(() => {});
    }
  }, [course]);

  function toggleTask(dayNum: number, taskIdx: number) {
    const key = `d${dayNum}_t${taskIdx}`;
    setCheckedTasks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(`clep_7day_${course}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    const hasData = plan !== null && cachedCourse === course;
    setLoading(!hasData);
    setStale(false);
    setFeatureDisabled(false);
    fetch(`/api/study-plan?course=${course}`, { signal: AbortSignal.timeout(40000) })
      .then((r) => {
        if (r.status === 503) { setFeatureDisabled(true); throw new Error("under-maintenance"); }
        if (!r.ok) throw new Error("Failed to load study plan");
        return r.json();
      })
      .then((data) => { setPlan(data.plan); setCachedCourse(course); setStale(false); })
      .catch((e) => {
        if (e.message === "under-maintenance") return;
        if (hasData) {
          setStale(true);
        } else {
          toast({ title: "Failed to load study plan", variant: "destructive" });
        }
      })
      .finally(() => setLoading(false));
  }, [course]); // eslint-disable-line react-hooks/exhaustive-deps

  async function generatePlan() {
    setGenerating(true);
    try {
      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to generate plan", variant: "destructive" });
        return;
      }
      if (data.plan) {
        setPlan(data.plan);
        toast({ title: "Study plan updated!", variant: "default" });
      }
    } catch {
      toast({ title: "Failed to generate plan. Check your connection.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function generate7DayPlan() {
    setGenerating(true);
    try {
      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, mode: "7day" }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to generate 7-day plan", variant: "destructive" });
        return;
      }
      if (data.plan) {
        setSevenDayPlan(data.plan as CLEP7DayPlan);
        toast({ title: "7-Day Pass Plan generated!", variant: "default" });
      }
    } catch {
      toast({ title: "Failed to generate plan. Check your connection.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  if (featureDisabled) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Under Maintenance</h2>
          <p className="text-muted-foreground">Study Plan is temporarily being improved. Check back soon for an even better experience.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {stale && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Couldn&apos;t refresh &mdash; showing your last loaded study plan.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Plan</h1>
          <p className="text-muted-foreground mt-1">
            AI-personalized plan based on your performance
          </p>
        </div>
        <Button onClick={generatePlan} disabled={generating} variant="outline" className="gap-2">
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> Regenerate</>
          )}
        </Button>
      </div>

      <CourseSelectorInline />

      {isCLEP && (
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border/40 w-fit">
          <button
            onClick={() => setPlanMode("weekly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              planMode === "weekly" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Weekly Plan
          </button>
          <button
            onClick={() => { setPlanMode("7day"); if (!sevenDayPlan) generate7DayPlan(); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              planMode === "7day" ? "bg-emerald-500/15 text-emerald-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            7-Day Pass Plan
          </button>
        </div>
      )}

      {planMode === "7day" && isCLEP ? (
        <div className="space-y-4">
          {!sevenDayPlan ? (
            <Card className="card-glow">
              <CardContent className="p-10 text-center">
                <GraduationCap className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Build Your 7-Day Pass Plan</h2>
                <p className="text-muted-foreground mb-6">
                  Sage creates a day-by-day plan to get you exam-ready in one week.
                </p>
                <Button onClick={generate7DayPlan} disabled={generating} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
                  {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Building Plan...</> : <><Zap className="h-4 w-4" /> Generate 7-Day Plan</>}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Readiness bar */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-emerald-400">CLEP Readiness</span>
                  <span className="text-xs text-muted-foreground">Target: {sevenDayPlan.readinessThreshold}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${readinessScore}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Complete practice sessions to fill your readiness bar</p>
              </div>

              {/* Day cards */}
              <div className="space-y-3">
                {sevenDayPlan.days.map((day) => (
                  <Card key={day.day} className="card-glow overflow-hidden">
                    <div className="flex">
                      {/* Day indicator */}
                      <div className="w-16 flex-shrink-0 bg-emerald-500/10 flex flex-col items-center justify-center border-r border-border/40 py-4">
                        <span className="text-xs text-emerald-400 font-medium">DAY</span>
                        <span className="text-2xl font-bold text-emerald-400">{day.day}</span>
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-sm">{day.theme}</p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {day.estimatedMinutes} min
                          </span>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          {day.tasks.map((task, ti) => {
                            const taskKey = `d${day.day}_t${ti}`;
                            const checked = checkedTasks[taskKey] || false;
                            return (
                              <label key={ti} className="flex items-start gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTask(day.day, ti)}
                                  className="mt-0.5 rounded border-border accent-emerald-500"
                                />
                                <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>{task}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Target className="h-3 w-3 text-emerald-400" />
                          <span>{day.milestone}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Day 8 CTA */}
              <Card className="card-glow border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-5 text-center space-y-3">
                  <GraduationCap className="h-8 w-8 text-emerald-400 mx-auto" />
                  <p className="font-bold">Day 8: Schedule Your Exam</p>
                  <p className="text-sm text-muted-foreground">Hit 70% mastery? You&apos;re ready. Book your $93 exam at any test center.</p>
                  <a href="https://clep.collegeboard.org/clep-search" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                      Find a Test Center <ChevronRight className="h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Exam tip */}
              {sevenDayPlan.examTip && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Exam Day Tip</p>
                    <p className="text-sm text-muted-foreground">{sevenDayPlan.examTip}</p>
                  </div>
                </div>
              )}

              {/* Regenerate */}
              <div className="text-center">
                <Button onClick={generate7DayPlan} disabled={generating} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate Plan
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
      <>
      {!plan ? (
        <Card className="card-glow">
          <CardContent className="p-10 text-center">
            <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No study plan yet</h2>
            <p className="text-muted-foreground mb-6">
              Generate your personalized {AP_COURSES[course]} study plan based on your practice history.
            </p>
            <Button onClick={generatePlan} disabled={generating} className="gap-2">
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Zap className="h-4 w-4" /> Generate My Plan</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Weekly goal */}
          <Card className="card-glow border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-blue-400 mb-1">This Week&apos;s Goal</p>
                <p className="text-base">{plan.weeklyGoal}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {plan.dailyMinutes} minutes/day recommended
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-lg">Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.focusAreas.map((area, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/40 bg-secondary/30">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="font-medium">{area.unit}</p>
                    <Badge
                      className={`text-xs flex-shrink-0 ${PRIORITY_COLORS[area.priority]}`}
                    >
                      {area.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{area.reason}</p>
                  <div className="flex flex-wrap gap-3 mb-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {area.mcqCount} MCQ
                    </div>
                    {area.saqCount > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        {area.saqCount} SAQ
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      ~{area.estimatedMinutes} min
                    </div>
                  </div>
                  {area.resources && area.resources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {area.resources.map((r, j) => (
                        <span key={j} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Link href="/practice?mode=focused">
                <Button className="w-full gap-2 mt-2">
                  Start Focused Study <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Daily Schedule */}
          {plan.dailySchedule && Object.keys(plan.dailySchedule).length > 0 && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(plan.dailySchedule).map(([day, desc]) => (
                    <div key={day} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm font-semibold text-blue-500 w-20 flex-shrink-0">{day}</span>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {plan.strengths && plan.strengths.length > 0 && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.strengths.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Study Tips */}
          {plan.tips && plan.tips.length > 0 && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                      <span className="text-blue-500 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                      <p className="text-sm">{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}
