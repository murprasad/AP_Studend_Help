import { COURSE_REGISTRY, VISIBLE_AP_COURSES } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight, CheckCircle } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Am I Ready? — Free AP, SAT & ACT Readiness Check",
  description:
    "Take a free 3-minute readiness check for any AP, SAT, or ACT exam. Get your estimated score and confidence level — no account required.",
  alternates: { canonical: "https://studentnest.ai/am-i-ready" },
  openGraph: {
    title: "Am I Ready? — Free AP, SAT & ACT Readiness Check",
    description:
      "Free readiness assessment for AP, SAT, and ACT exams. No signup needed.",
    url: "https://studentnest.ai/am-i-ready",
  },
};

// StudentNest post-sunset: only AP/SAT/ACT live here. CLEP/DSST moved
// to preplion.ai but still exist in the ApCourse enum — filter them out.
const apCourses = VISIBLE_AP_COURSES.filter((c) => c.startsWith("AP_"));
const satCourses = VISIBLE_AP_COURSES.filter((c) => c.startsWith("SAT_"));
const actCourses = VISIBLE_AP_COURSES.filter((c) => c.startsWith("ACT_"));

function courseSlug(course: ApCourse): string {
  return course.toLowerCase().replace(/_/g, "-");
}

interface FamilySectionProps {
  label: string;
  badgeClass: string;
  iconClass: string;
  hoverBorderClass: string;
  hoverBgClass: string;
  hoverIconClass: string;
  courses: ApCourse[];
}

function FamilySection({
  label,
  badgeClass,
  iconClass,
  hoverBorderClass,
  hoverBgClass,
  hoverIconClass,
  courses,
}: FamilySectionProps) {
  if (courses.length === 0) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className={`${badgeClass} text-xs font-semibold`}>{label}</Badge>
        <h2 className="text-lg font-bold">{courses.length} Exams</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {courses.map((course) => {
          const config = COURSE_REGISTRY[course];
          return (
            <Link
              key={course}
              href={`/am-i-ready/${courseSlug(course)}`}
              className={`flex items-center justify-between p-3 rounded-xl border border-border/40 ${hoverBorderClass} ${hoverBgClass} transition-all group`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Target className={`h-4 w-4 ${iconClass} flex-shrink-0`} />
                <span className="text-sm font-medium truncate">
                  {config.name}
                </span>
              </div>
              <ArrowRight
                className={`h-4 w-4 text-muted-foreground/40 ${hoverIconClass} transition-colors flex-shrink-0`}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function AmIReadyIndexPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4">
        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
          Free Readiness Check
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold">Am I Ready?</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Pick your exam, answer 5 questions, and get an honest read on where
          you stand — estimated score, confidence level, and next steps. No
          account required.
        </p>
      </div>

      {/* What you get */}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {[
          "Estimated score",
          "Confidence signal",
          "Personalized next steps",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-700 dark:text-emerald-400" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* AP Courses */}
      <FamilySection
        label="AP"
        badgeClass="bg-blue-500/20 text-blue-600 dark:text-blue-700 dark:text-blue-400 border-blue-500/30"
        iconClass="text-blue-600 dark:text-blue-700 dark:text-blue-400"
        hoverBorderClass="hover:border-blue-500/40"
        hoverBgClass="hover:bg-blue-500/5"
        hoverIconClass="group-hover:text-blue-500"
        courses={apCourses}
      />

      {/* SAT Courses */}
      <FamilySection
        label="SAT"
        badgeClass="bg-emerald-500/20 text-emerald-600 dark:text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
        iconClass="text-emerald-600 dark:text-emerald-700 dark:text-emerald-400"
        hoverBorderClass="hover:border-emerald-500/40"
        hoverBgClass="hover:bg-emerald-500/5"
        hoverIconClass="group-hover:text-emerald-500"
        courses={satCourses}
      />

      {/* ACT Courses */}
      <FamilySection
        label="ACT"
        badgeClass="bg-amber-500/20 text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400 border-amber-500/30"
        iconClass="text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400"
        hoverBorderClass="hover:border-amber-500/40"
        hoverBgClass="hover:bg-amber-500/5"
        hoverIconClass="group-hover:text-amber-500"
        courses={actCourses}
      />

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground/70 text-center leading-relaxed max-w-2xl mx-auto">
        This assessment gives an estimated readiness based on your inputs and
        quiz performance. It is not an official score prediction. AP&reg; and
        SAT&reg; are trademarks of the College Board. ACT&reg; is a registered
        trademark of ACT Inc. StudentNest is not affiliated with or endorsed
        by the College Board or ACT Inc.
      </p>
    </div>
  );
}
