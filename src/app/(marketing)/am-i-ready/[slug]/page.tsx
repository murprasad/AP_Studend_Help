import { COURSE_REGISTRY, VISIBLE_AP_COURSES } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { examFamilyOf } from "@/lib/score-predictors";
import { ReadinessAssessment } from "./readiness-assessment";

// StudentNest only — CLEP/DSST still in the enum but sunset here.
function isStudentNestCourse(course: string): boolean {
  return (
    course.startsWith("AP_") ||
    course.startsWith("SAT_") ||
    course.startsWith("ACT_")
  );
}

export function generateStaticParams() {
  return VISIBLE_AP_COURSES.filter(isStudentNestCourse).map((course) => ({
    slug: course.toLowerCase().replace(/_/g, "-"),
  }));
}

function courseFromSlug(slug: string): ApCourse | null {
  const enumValue = slug.toUpperCase().replace(/-/g, "_");
  if (
    VISIBLE_AP_COURSES.includes(enumValue as ApCourse) &&
    isStudentNestCourse(enumValue)
  ) {
    return enumValue as ApCourse;
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = courseFromSlug(params.slug);
  if (!course) return {};
  const config = COURSE_REGISTRY[course];
  const family = examFamilyOf(course);
  return {
    title: `Am I Ready for ${config.name}? — Free Assessment`,
    description: `Free ${family} ${config.name} readiness check. Answer 5 questions and get an estimated score, confidence level, and next steps — no account required.`,
    alternates: {
      canonical: `https://studentnest.ai/am-i-ready/${params.slug}`,
    },
    openGraph: {
      title: `Am I Ready for ${family} ${config.name}?`,
      description: `Free readiness assessment for ${family} ${config.name}. Estimated score and confidence in under 5 minutes.`,
      url: `https://studentnest.ai/am-i-ready/${params.slug}`,
    },
  };
}

export default function AmIReadyPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = courseFromSlug(params.slug);
  if (!course) notFound();

  const config = COURSE_REGISTRY[course];
  const family = examFamilyOf(course);
  const unitCount = Object.keys(config.units).length;

  return (
    <ReadinessAssessment
      course={course}
      courseName={config.name}
      family={family}
      unitCount={unitCount}
    />
  );
}
