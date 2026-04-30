"use client";

/**
 * PostJourneyHero — Beta 9.7 (2026-04-30).
 *
 * Renders for the first 3 days after a user completes the journey rail.
 * Per user direction: "Based on Diagnostic you took, show them ONE step
 * / action. Currently it shows too many actions."
 *
 * Single hero card:
 *   - Eyebrow: "Day N of your plan" (anchors progression)
 *   - Title: "Today: 10 questions in {weakestUnitName}"
 *   - Subtitle: "Closes the biggest gap to your projected score."
 *   - One START button → /practice?mode=focused&unit=X&count=10
 *
 * Plus 3 small "tools" tiles below — visual continuity with Step 5
 * "What to do next" hub:
 *   - Flashcards · Sage Tutor · Mock Exam
 *
 * After Day 3 the hook returns postJourney.active=false and the
 * dashboard graduates to its standard "mature" buffet.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, BookOpen, Sparkles, FileText } from "lucide-react";
import { COURSE_REGISTRY } from "@/lib/courses";
import type { ApCourse } from "@prisma/client";

interface Props {
  course: string;
  weakestUnit: string | null;
  daysSinceCompleted: number;
}

export function PostJourneyHero({ course, weakestUnit, daysSinceCompleted }: Props) {
  const courseConfig = COURSE_REGISTRY[course as ApCourse] ?? null;
  const unitName = (() => {
    if (!weakestUnit || !courseConfig) return null;
    const meta = courseConfig.units?.[weakestUnit as keyof typeof courseConfig.units];
    return meta?.name ?? weakestUnit;
  })();

  const dayLabel = daysSinceCompleted === 0
    ? "Today"
    : daysSinceCompleted === 1
    ? "Day 2 of your plan"
    : daysSinceCompleted === 2
    ? "Day 3 of your plan"
    : "Day 4 of your plan";

  const practiceHref = weakestUnit
    ? `/practice?mode=focused&unit=${encodeURIComponent(weakestUnit)}&course=${course}&count=10&src=post_journey_hero`
    : `/practice?course=${course}&count=10&src=post_journey_hero`;

  return (
    <div className="space-y-3">
      {/* Single hero — diagnostic-derived next step */}
      <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Target className="h-6 w-6 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              {dayLabel}
            </p>
            <p className="text-base font-semibold leading-snug">
              {unitName ? `Today: 10 questions in ${unitName}` : "Today: 10 quick questions"}
            </p>
            <p className="text-xs text-muted-foreground">
              {unitName
                ? "Closes the biggest gap to your projected score."
                : "Daily practice keeps your projected score climbing."}
            </p>
            <Button asChild size="sm" className="rounded-full mt-1 gap-2">
              <Link href={practiceHref}>
                Start today&apos;s 10
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Three small tools — visual continuity with Step 5 hub */}
      <div className="grid grid-cols-3 gap-2">
        <ToolTile
          icon={<BookOpen className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />}
          label="Flashcards"
          href="/flashcards"
        />
        <ToolTile
          icon={<Sparkles className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />}
          label="Sage"
          href="/ai-tutor"
        />
        <ToolTile
          icon={<FileText className="h-4 w-4 text-purple-700 dark:text-purple-400" />}
          label="Mock Exam"
          href={`/mock-exam?course=${course}`}
        />
      </div>
    </div>
  );
}

function ToolTile({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto py-2 px-3 flex flex-col items-center gap-1 border-border/40 hover:bg-accent"
    >
      <Link href={href}>
        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[11px] font-medium">{label}</span>
      </Link>
    </Button>
  );
}
