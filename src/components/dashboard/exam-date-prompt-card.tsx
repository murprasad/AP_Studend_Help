"use client";

/**
 * ExamDatePromptCard — 2026-05-01.
 *
 * Renders ExamCountdownSetter at the top of the dashboard ONLY when the
 * user hasn't set their exam date yet. Once set, this component returns
 * null and CramModeCard / DailyStudyOSCard pick up the urgency rendering.
 *
 * Why: ExamCountdownSetter exists in the codebase and is wired to a real
 * API (/api/user/exam-date), but no dashboard surface rendered it before
 * 2026-05-01. Without this entry point, every exam-aware card on the
 * dashboard (CramModeCard, DailyStudyOSCard Phase D) silently hides
 * itself because user.examDate is null. Result: students 3 days from
 * the AP exam see no urgency cues at all.
 *
 * This card is intentionally additive — it disappears the moment a date
 * is set so it never competes with CramModeCard.
 */

import { useEffect, useState } from "react";
import { ExamCountdownSetter } from "@/components/dashboard/exam-countdown-setter";
import type { ApCourse } from "@prisma/client";
import { fetchCached } from "@/lib/dashboard-cache";

interface Props {
  course: ApCourse;
}

export function ExamDatePromptCard({ course }: Props) {
  const [examDate, setExamDate] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchCached("/api/user")
      .then((d: unknown) => {
        if (cancelled) return;
        const u = (d as { user?: { examDate?: string | null } } | null)?.user;
        setExamDate(u?.examDate ?? null);
      })
      .catch(() => {
        if (!cancelled) setExamDate(null);
      });

    // Hide ourselves when ExamCountdownSetter dispatches the saved event.
    function onSaved() { setExamDate("set"); }
    window.addEventListener("exam-date-updated", onSaved);
    return () => {
      cancelled = true;
      window.removeEventListener("exam-date-updated", onSaved);
    };
  }, []);

  // Loading or already-set → render nothing. CramModeCard owns the
  // already-set state with its tiered urgency palette.
  if (examDate === undefined) return null;
  if (examDate) return null;

  return <ExamCountdownSetter course={course} />;
}
