"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { COURSE_REGISTRY, VISIBLE_AP_COURSES } from "@/lib/courses";

/**
 * Hero CTA: "Find out in 3 minutes what you'd score on [exam]" — the
 * singular product hook. One dropdown → directly to `/am-i-ready/[slug]`.
 * Ships to the calibrated readiness check (no signup required).
 *
 * Ported from PrepLion's HeroReadinessPicker with exam-family swap:
 *  CLEP/DSST/Accuplacer → AP / SAT / ACT.
 */
export function HeroReadinessPicker() {
  const router = useRouter();
  // Default to AP World History — highest-volume AP course.
  const [course, setCourse] = useState<string>("AP_WORLD_HISTORY");

  const options = useMemo(() => {
    const ap = VISIBLE_AP_COURSES
      .filter((c) => c.startsWith("AP_"))
      .map((c) => ({ value: c, label: COURSE_REGISTRY[c]?.name ?? c }));
    const sat = VISIBLE_AP_COURSES
      .filter((c) => c.startsWith("SAT_"))
      .map((c) => ({ value: c, label: COURSE_REGISTRY[c]?.name ?? c }));
    const act = VISIBLE_AP_COURSES
      .filter((c) => c.startsWith("ACT_"))
      .map((c) => ({ value: c, label: COURSE_REGISTRY[c]?.name ?? c }));
    return { ap, sat, act };
  }, []);

  const handleStart = () => {
    const slug = course.toLowerCase().replace(/_/g, "-");
    router.push(`/am-i-ready/${slug}`);
  };

  return (
    <div className="mt-6 max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl border border-primary/30 bg-primary/5 shadow-sm">
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-background border border-border/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Choose your exam"
        >
          {options.ap.length > 0 && (
            <optgroup label="AP Exams">
              {options.ap.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          )}
          {options.sat.length > 0 && (
            <optgroup label="SAT">
              {options.sat.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          )}
          {options.act.length > 0 && (
            <optgroup label="ACT">
              {options.act.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          )}
        </select>
        <Button
          size="lg"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white sm:flex-shrink-0"
          onClick={handleStart}
        >
          Check my projected score <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground text-center">
        3 minutes · No signup · Get your estimated AP/SAT/ACT score + next steps
      </p>
    </div>
  );
}
