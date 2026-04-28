"use client";

/**
 * CourseExamOverview — show students the REAL CB exam structure for their
 * current course, with one-click practice for each question type.
 *
 * Conversion fix (2026-04-27): student arrived at /practice and saw only
 * "Quick Practice (10 MCQs)" — they didn't know that AP World History has
 * 4 question types (MCQ + SAQ + DBQ + LEQ). Free users especially had no
 * visibility into the full exam shape, so they dropped off thinking we
 * only had MCQs.
 *
 * This component lists every CB-defined section with weight + time + a
 * "Practice" CTA that takes them to the right place. Premium-gated
 * sections show "Premium" badge and route to /billing if free user clicks.
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { getCBExamStructure } from "@/lib/cb-exam-structure";

interface Props {
  course: string;
  /** User's tier — controls Free/Premium gating display. */
  isFreeTier: boolean;
}

export function CourseExamOverview({ course, isFreeTier }: Props) {
  const struct = getCBExamStructure(course);
  if (!struct) return null;

  const totalQuestions = struct.sections.reduce((s, sec) => s + sec.count, 0);

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
      <CardContent className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-base font-semibold">
              Real AP exam — what you'll face
            </h3>
            <span className="text-xs text-muted-foreground">
              {totalQuestions} questions · {struct.totalMinutes} min total
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            College Board exam structure. Practice each section here.
          </p>
        </div>

        <div className="space-y-2">
          {struct.sections.map((sec, i) => {
            const locked = !sec.freeAccess && isFreeTier;
            const href = locked
              ? `/billing?utm_source=exam_overview&utm_campaign=${encodeURIComponent(sec.cbName)}`
              : sec.questionType === "MCQ"
              ? `/practice?course=${course}&type=MCQ`
              : `/frq-practice?course=${course}${sec.subtopic ? `&subtopic=${encodeURIComponent(sec.subtopic)}` : ""}`;

            return (
              <Link
                key={i}
                href={href}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{sec.cbName}</span>
                    {locked && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400">
                        <Lock className="h-2.5 w-2.5 mr-0.5" /> Premium
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {sec.count} {sec.count === 1 ? "question" : "questions"} · {sec.percentOfScore}% of score · {sec.minutes} min
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>

        {isFreeTier && struct.sections.some((s) => !s.freeAccess) && (
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-2">
              Free covers MCQ practice. Upgrade to unlock essay-format practice
              with AI-scored rubric feedback.
            </p>
            <Link href="/billing?utm_source=exam_overview_cta&utm_campaign=premium_upsell">
              <Button size="sm" className="rounded-full h-8 text-xs">
                See Premium — $9.99/mo
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
