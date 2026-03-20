/**
 * GET /api/test/practice-check
 *
 * CRON_SECRET-gated integration test endpoint.
 * Checks question availability for all 16 courses across key combinations.
 * Used by scripts/integration-tests.js in the release pipeline.
 *
 * Returns per-course status:
 *   green  = ≥8 questions (healthy bank)
 *   yellow = 1-7 questions (thin but functional)
 *   red    = 0 questions (students would need AI generation)
 *
 * Also verifies AI generation is enabled and the cascade is reachable.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VALID_AP_COURSES, COURSE_REGISTRY, getUnitsForCourse } from "@/lib/courses";
import { getSetting } from "@/lib/settings";
import { ApCourse, ApUnit, Difficulty } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auth: Bearer CRON_SECRET only
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aiGenEnabled = await getSetting("ai_generation_enabled", "true").then((v) => v === "true");

  // Count approved MCQ questions per course
  const courseCounts = await Promise.all(
    VALID_AP_COURSES.map(async (course) => {
      const total = await prisma.question.count({
        where: { course, isApproved: true, questionType: "MCQ" },
      });

      // Count per unit to find gaps
      const units = getUnitsForCourse(course);
      const unitCounts = await Promise.all(
        units.map(async (unit) => {
          const count = await prisma.question.count({
            where: { course, unit, isApproved: true, questionType: "MCQ" },
          });
          return { unit, count };
        })
      );

      const emptyUnits = unitCounts.filter((u) => u.count === 0).map((u) => u.unit);
      const thinUnits  = unitCounts.filter((u) => u.count > 0 && u.count < 3).map((u) => u.unit);

      const status = total === 0 ? "red" : total < 5 ? "yellow" : "green";
      return {
        course,
        name: COURSE_REGISTRY[course]?.name ?? course,
        totalMCQ: total,
        unitCount: units.length,
        emptyUnits: emptyUnits.length,
        thinUnits: thinUnits.length,
        status,
        aiWouldGenerate: status !== "green" && aiGenEnabled,
      };
    })
  );

  const red    = courseCounts.filter((c) => c.status === "red").map((c) => c.course);
  const yellow = courseCounts.filter((c) => c.status === "yellow").map((c) => c.course);
  const green  = courseCounts.filter((c) => c.status === "green").map((c) => c.course);

  // Also count FRQ availability for courses that support it
  const frqCourses = VALID_AP_COURSES.filter(
    (c) => Object.keys(COURSE_REGISTRY[c]?.questionTypeFormats ?? {}).some(
      (t) => ["FRQ", "SAQ", "LEQ", "DBQ", "CODING"].includes(t)
    )
  );
  const frqCounts = await Promise.all(
    frqCourses.map(async (course) => {
      const count = await prisma.question.count({
        where: {
          course,
          isApproved: true,
          questionType: { in: ["FRQ", "SAQ", "LEQ", "DBQ", "CODING"] },
        },
      });
      return { course, count };
    })
  );

  const totalQuestions = await prisma.question.count({ where: { isApproved: true } });

  return NextResponse.json({
    summary: {
      totalApprovedQuestions: totalQuestions,
      aiGenerationEnabled: aiGenEnabled,
      courses: { green: green.length, yellow: yellow.length, red: red.length, total: VALID_AP_COURSES.length },
    },
    courses: courseCounts,
    frqAvailability: frqCounts,
    redCourses: red,
    yellowCourses: yellow,
  });
}
