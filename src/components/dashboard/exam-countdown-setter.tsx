"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { ApCourse } from "@prisma/client";
import { AP_COURSES } from "@/lib/utils";

interface Props {
  course: ApCourse;
  inline?: boolean;
}

export function ExamCountdownSetter({ course, inline = false }: Props) {
  const [examDate, setExamDate] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [editing, setEditing] = useState(false);

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
      if (!res.ok) {
        // Verify if the save actually went through despite the error response
        const verify = await fetch("/api/user/exam-date").then((r) => r.json()).catch(() => null);
        const savedDate = verify?.examDate ? new Date(verify.examDate).toISOString().split("T")[0] : null;
        if (savedDate === (examDate || null)) {
          // Data is confirmed saved — treat as success
          setSaved(true);
          window.dispatchEvent(new CustomEvent("exam-date-updated"));
          setTimeout(() => {
            setSaved(false);
            if (inline) setEditing(false);
          }, 2000);
          return;
        }
        throw new Error();
      }
      setSaved(true);
      window.dispatchEvent(new CustomEvent("exam-date-updated"));
      setTimeout(() => {
        setSaved(false);
        if (inline) setEditing(false);
      }, 2000);
    } catch {
      setSaveError(true);
    }
  }

  const courseName = AP_COURSES[course] || "Your Exam";

  // Inline variant: compact badge + expandable date editor
  if (inline) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {daysLeft !== null && daysLeft > 0 ? (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            daysLeft <= 14
              ? "bg-red-500/15 text-red-400 border-red-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/15"
          }`}>
            <Calendar className="h-3 w-3" />
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} until exam
          </span>
        ) : daysLeft !== null && daysLeft <= 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Exam passed 🎉
          </span>
        ) : !loading ? (
          <span className="text-xs text-muted-foreground">No exam date set</span>
        ) : null}
        {!loading && (
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {editing ? "Cancel" : daysLeft !== null ? "Change date" : "Set exam date"}
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2 w-full mt-1">
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="flex-1 rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button size="sm" onClick={save} variant="outline" className="shrink-0">
              {saved ? "Saved ✓" : "Save"}
            </Button>
          </div>
        )}
        {saveError && editing && (
          <p className="text-xs text-red-400 w-full">Failed to save. Please try again.</p>
        )}
      </div>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          Exam Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {daysLeft !== null && daysLeft > 0 ? (
          <div className={`text-center p-4 rounded-lg ${
            daysLeft <= 14
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-blue-500/10 border border-blue-500/20"
          }`}>
            <p className={`text-4xl font-bold ${daysLeft <= 14 ? "text-red-400" : "text-blue-500"}`}>
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
              className="w-full rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
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
