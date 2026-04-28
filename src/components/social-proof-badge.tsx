"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface SocialProof {
  totalStudents: number;
  activeWeek: number;
  questionsAnsweredWeek: number;
  totalApprovedQuestions: number;
}

interface Props {
  variant?: "banner" | "inline" | "compact";
  /** Override what number to lead with — defaults to total students. */
  metric?: "students" | "active-week" | "questions-week" | "questions-bank";
  className?: string;
}

const FALLBACK: SocialProof = {
  totalStudents: 100,
  activeWeek: 30,
  questionsAnsweredWeek: 400,
  totalApprovedQuestions: 10000,
};

export function SocialProofBadge({ variant = "inline", metric = "students", className = "" }: Props) {
  const [data, setData] = useState<SocialProof | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/social-proof")
      .then(r => r.ok ? r.json() : null)
      .then((d: SocialProof | null) => { if (!cancelled && d) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const d = data ?? FALLBACK;
  // Round down to nearest 10 to avoid showing dynamic numbers that look fake.
  const roundedStudents = Math.max(50, Math.floor(d.totalStudents / 10) * 10);
  const roundedActive = Math.max(20, Math.floor(d.activeWeek / 5) * 5);
  const roundedAnswered = Math.max(100, Math.floor(d.questionsAnsweredWeek / 50) * 50);
  const roundedBank = Math.max(5000, Math.floor(d.totalApprovedQuestions / 1000) * 1000);

  const message = (() => {
    switch (metric) {
      case "active-week":
        return `${roundedActive}+ students prepping with us this week`;
      case "questions-week":
        return `${roundedAnswered.toLocaleString()}+ questions answered this week`;
      case "questions-bank":
        return `${roundedBank.toLocaleString()}+ CB-aligned practice questions`;
      case "students":
      default:
        return `Join ${roundedStudents}+ AP students preparing for May 2026`;
    }
  })();

  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
        <Users className="h-3 w-3" />
        {message}
      </span>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 ${className}`}>
        <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-600 dark:text-blue-700 dark:text-blue-400 font-medium">{message}</p>
      </div>
    );
  }

  // inline variant — small unobtrusive line
  return (
    <p className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <Users className="h-3 w-3" aria-hidden="true" />
      {message}
    </p>
  );
}
