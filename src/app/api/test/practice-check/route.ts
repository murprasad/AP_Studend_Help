/**
 * GET /api/test/practice-check
 *
 * CRON_SECRET-gated integration test endpoint.
 * Checks question availability for all courses using efficient groupBy queries.
 * Used by scripts/integration-tests.js in the release pipeline.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VALID_AP_COURSES, COURSE_REGISTRY, getUnitsForCourse } from "@/lib/courses";
import { getSetting } from "@/lib/settings";
import { ApCourse, QuestionType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const aiGenEnabled = await getSetting("ai_generation_enabled", "true").then((v) => v === "true");

    // Single groupBy query: course × unit × questionType counts
    const grouped = await prisma.question.groupBy({
      by: ["course", "unit", "questionType"],
      where: { isApproved: true },
      _count: { id: true },
    });

    const totalQuestions = grouped.reduce((sum, g) => sum + g._count.id, 0);

    // Build per-course summary
    const courseCounts = VALID_AP_COURSES.map((course) => {
      const courseRows = grouped.filter((g) => g.course === course);
      const mcqRows = courseRows.filter((g) => g.questionType === QuestionType.MCQ);
      const totalMCQ = mcqRows.reduce((sum, g) => sum + g._count.id, 0);

      const units = getUnitsForCourse(course);
      const unitCountMap = new Map<string, number>();
      for (const row of mcqRows) unitCountMap.set(row.unit, row._count.id);

      const emptyUnits = units.filter((u) => !unitCountMap.has(u)).length;
      const thinUnits  = units.filter((u) => (unitCountMap.get(u) ?? 0) > 0 && (unitCountMap.get(u) ?? 0) < 3).length;

      const status = totalMCQ === 0 ? "red" : totalMCQ < 5 ? "yellow" : "green";
      return {
        course,
        name: COURSE_REGISTRY[course]?.name ?? course,
        totalMCQ,
        unitCount: units.length,
        emptyUnits,
        thinUnits,
        status,
        aiWouldGenerate: status !== "green" && aiGenEnabled,
      };
    });

    const red    = courseCounts.filter((c) => c.status === "red").map((c) => c.course);
    const yellow = courseCounts.filter((c) => c.status === "yellow").map((c) => c.course);
    const green  = courseCounts.filter((c) => c.status === "green").map((c) => c.course);

    // FRQ availability per course
    const frqTypeSet = new Set<string>(["FRQ","SAQ","LEQ","DBQ","CODING"]);
    const frqAvailability = VALID_AP_COURSES.map((course) => {
      const count = grouped
        .filter((g) => g.course === course && frqTypeSet.has(g.questionType))
        .reduce((sum, g) => sum + g._count.id, 0);
      return { course, count };
    }).filter((c) => c.count > 0 || Object.keys(COURSE_REGISTRY[c.course]?.questionTypeFormats ?? {})
      .some((t) => frqTypeSet.has(t)));

    return NextResponse.json({
      summary: {
        totalApprovedQuestions: totalQuestions,
        aiGenerationEnabled: aiGenEnabled,
        courses: { green: green.length, yellow: yellow.length, red: red.length, total: VALID_AP_COURSES.length },
      },
      courses: courseCounts,
      frqAvailability,
      redCourses: red,
      yellowCourses: yellow,
    });
  } catch (err) {
    console.error("[practice-check] error:", err);
    return NextResponse.json(
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
