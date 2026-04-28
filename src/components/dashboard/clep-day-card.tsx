"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Target, ChevronRight, Clock, CheckCircle2, Calendar } from "lucide-react";
import Link from "next/link";

interface DayData {
  day: number;
  theme: string;
  units: string[];
  tasks: string[];
  estimatedMinutes: number;
  milestone: string;
}

interface CLEP7DayPlanData {
  planType: "7day";
  courseName: string;
  days: DayData[];
  readinessThreshold: number;
  examTip: string;
  isStatic?: boolean;
}

interface CLEPDayCardProps {
  planData: CLEP7DayPlanData;
  generatedAt: string;
  course: string;
}

export function CLEPDayCard({ planData, generatedAt, course }: CLEPDayCardProps) {
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Load checked tasks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`clep_7day_${course}`);
      if (saved) setCheckedTasks(JSON.parse(saved));
    } catch {}
  }, [course]);

  // Calculate current day (1-7, based on days since plan was generated)
  const daysSinceGenerated = Math.floor((Date.now() - new Date(generatedAt).getTime()) / 86400000);
  const currentDay = Math.min(7, Math.max(1, daysSinceGenerated + 1));
  const planComplete = currentDay >= 7 && daysSinceGenerated >= 7;

  const todayData = planData.days?.find(d => d.day === currentDay) || planData.days?.[0];
  if (!todayData) return null;

  // Calculate overall progress
  const totalTasks = planData.days.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = Object.values(checkedTasks).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function toggleTask(dayNum: number, taskIdx: number) {
    const key = `d${dayNum}_t${taskIdx}`;
    setCheckedTasks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(`clep_7day_${course}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  if (planComplete) {
    return (
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-400">7-Day Plan Complete!</p>
              <p className="text-sm text-muted-foreground">You&apos;ve finished your prep plan. Ready to schedule your exam?</p>
            </div>
            <a href="https://clep.collegeboard.org/clep-search" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800">
                Find Test Center <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Day indicator */}
          <div className="w-20 flex-shrink-0 bg-emerald-500/10 flex flex-col items-center justify-center border-r border-emerald-500/10 py-4">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Day</span>
            <span className="text-3xl font-bold text-emerald-400">{currentDay}</span>
            <span className="text-[10px] text-muted-foreground">of 7</span>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-sm">{todayData.theme}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {todayData.estimatedMinutes} min
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3 text-emerald-400" /> {todayData.milestone}
                  </span>
                </div>
              </div>
              <Link href="/study-plan">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-400 hover:text-emerald-300 h-auto py-1 px-2">
                  Full plan <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>

            {/* Task checklist */}
            <div className="space-y-1.5 mb-3">
              {todayData.tasks.map((task, ti) => {
                const taskKey = `d${currentDay}_t${ti}`;
                const checked = checkedTasks[taskKey] || false;
                return (
                  <label key={ti} className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTask(currentDay, ti)}
                      className="mt-0.5 rounded border-border accent-emerald-500"
                    />
                    <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>{task}</span>
                  </label>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
