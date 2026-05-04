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
 * `visibleCourses` is the bank-quality allowlist (added 2026-05-02).
 * When passed, the picker only surfaces courses we can actually serve
 * at College-Board grade. When undefined or null, falls back to the
 * full registry (legacy behavior).
 */
export function HeroReadinessPicker({ visibleCourses }: { visibleCourses?: string[] | null } = {}) {
  const router = useRouter();

  const options = useMemo(() => {
    const allowed = (c: string) => !visibleCourses || visibleCourses.includes(c);
    const ap = VISIBLE_AP_COURSES
      .filter((c) => c.startsWith("AP_") && allowed(c))
      .map((c) => ({ value: c, label: COURSE_REGISTRY[c]?.name ?? c }));
    const sat = VISIBLE_AP_COURSES
      .filter((c) => c.startsWith("SAT_") && allowed(c))
      .map((c) => ({ value: c, label: COURSE_REGISTRY[c]?.name ?? c }));
    const act = VISIBLE_AP_COURSES
      .filter((c) => c.startsWith("ACT_") && allowed(c))
      .map((c) => ({ value: c, label: COURSE_REGISTRY[c]?.name ?? c }));
    return { ap, sat, act };
  }, [visibleCourses]);

  // Default-select: first visible AP, else first visible SAT, else first ACT,
  // else fall back to the legacy "AP_WORLD_HISTORY" choice (only reached if
  // every group is empty, which would mean visible_courses is mis-configured).
  const defaultCourse =
    options.ap[0]?.value ?? options.sat[0]?.value ?? options.act[0]?.value ?? "AP_WORLD_HISTORY";
  const [course, setCourse] = useState<string>(defaultCourse);

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
          Find my weak areas <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground text-center">
        3-min diagnostic · No signup · See exactly which units you'd fail
      </p>
    </div>
  );
}
