"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { ApCourse } from "@prisma/client";
import { AP_COURSES } from "@/lib/utils";

interface Props {
  course: ApCourse;
}

export function ExamCountdownSetter({ course }: Props) {
  const router = useRouter();
  const [examDate, setExamDate] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    fetch("/api/user/exam-date")
      .then((r) => r.json())
      .then((d) => {
        if (d.examDate) {
          setExamDate(new Date(d.examDate).toISOString().split("T")[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const daysLeft = (() => {
    if (!examDate) return null;
    // Parse as local midnight to avoid timezone offset issues
    const [y, m, d] = examDate.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  async function save() {
    setSaveError(false);
    try {
      const res = await fetch("/api/user/exam-date", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: examDate || null }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh(); // refreshes server components (sidebar) without hard reload
    } catch {
      setSaveError(true);
    }
  }

  const courseName = AP_COURSES[course] || "Your Exam";

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-400" />
          Exam Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {daysLeft !== null && daysLeft > 0 ? (
          <div className={`text-center p-4 rounded-lg ${
            daysLeft <= 14
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-indigo-500/10 border border-indigo-500/20"
          }`}>
            <p className={`text-4xl font-bold ${daysLeft <= 14 ? "text-red-400" : "text-indigo-400"}`}>
              {daysLeft}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              day{daysLeft !== 1 ? "s" : ""} until {courseName.replace("AP ", "AP ")}
            </p>
          </div>
        ) : daysLeft !== null && daysLeft <= 0 ? (
          <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm font-medium text-emerald-400">Exam day has passed 🎉</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Set your exam date to track the countdown.</p>
        )}

        {!loading && (
          <div className="space-y-2">
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button size="sm" onClick={save} className="w-full" variant="outline">
              {saved ? "Saved ✓" : "Save Exam Date"}
            </Button>
            {saveError && (
              <p className="text-xs text-red-400 text-center">Failed to save. Please try again.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
