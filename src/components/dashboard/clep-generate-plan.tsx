"use client";

import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { AP_COURSES } from "@/lib/utils";
import { ApCourse } from "@prisma/client";
import { CLEPDayCard } from "./clep-day-card";

interface CLEPGeneratePlanProps {
  course: string;
}

export function CLEPGeneratePlan({ course }: CLEPGeneratePlanProps) {
  const [loading, setLoading] = useState(false);
  const [planData, setPlanData] = useState<any>(null);

  if (planData) {
    return (
      <CLEPDayCard
        planData={planData}
        generatedAt={new Date().toISOString()}
        course={course}
      />
    );
  }

  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03]">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <GraduationCap className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Ready to pass {AP_COURSES[course as ApCourse] || course.replace(/_/g, " ")} in 7 days?</p>
        <p className="text-xs text-muted-foreground mt-0.5">Sage builds a day-by-day study plan tailored to your exam.</p>
      </div>
      <button
        disabled={loading}
        onClick={() => {
          setLoading(true);
          fetch("/api/study-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course, mode: "7day" }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.plan) setPlanData(data.plan);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        }}
        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-medium transition-colors flex-shrink-0 flex items-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Generate Plan
      </button>
    </div>
  );
}
