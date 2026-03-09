"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/use-course";
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

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-500/30 bg-red-500/10",
  medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  low: "text-blue-400 border-blue-500/30 bg-blue-500/10",
};

export default function StudyPlanPage() {
  const { toast } = useToast();
  const [course] = useCourse();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPlan(null);
    fetch(`/api/study-plan?course=${course}`)
      .then((r) => r.json())
      .then((data) => setPlan(data.plan))
      .catch(() => toast({ title: "Failed to load study plan", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [course]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
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

      {/* Course indicator */}
      <Card className="card-glow border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-indigo-400" />
          <p className="text-sm font-medium">{AP_COURSES[course]}</p>
          <p className="text-xs text-muted-foreground ml-2">— Switch course from the sidebar</p>
        </CardContent>
      </Card>

      {!plan ? (
        <Card className="card-glow">
          <CardContent className="p-10 text-center">
            <BookOpen className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
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
          <Card className="card-glow border-indigo-500/30 bg-indigo-500/5">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-indigo-300 mb-1">This Week&apos;s Goal</p>
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
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
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
                      <span className="text-sm font-semibold text-indigo-400 w-20 flex-shrink-0">{day}</span>
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
                      <span className="text-indigo-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                      <p className="text-sm">{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
