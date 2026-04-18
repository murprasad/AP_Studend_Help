import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { VALID_AP_COURSES } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/am-i-ready-quiz?course=AP_WORLD_HISTORY
 *
 * PUBLIC endpoint (no auth). Feeds the marketing "Am I Ready" readiness
 * assessment with 5 random approved MCQ questions for a course.
 *
 * Response shape:
 *   {
 *     questions: [{ id, questionText, options, unit, topic }],
 *     answerKey: { [id]: "A" | "B" | "C" | "D" | "E" }
 *   }
 *
 * correctAnswer is stripped from the per-question payload and returned in
 * a separate `answerKey` map the client uses to score locally. This keeps
 * a curious user from reading answers out of the Network tab without at
 * least meaning to — same light obfuscation pattern PrepLion uses.
 *
 * Rate-limited by IP (5 req/min) to frustrate question-bank scraping.
 */

// CLEP/DSST courses live on preplion.ai post-sunset — disallow here so
// someone who stumbles onto a stale URL gets a clean "invalid course"
// instead of an empty question pool or worse, a seed from PrepLion copy.
function isStudentNestCourse(course: string): boolean {
  return (
    course.startsWith("AP_") ||
    course.startsWith("SAT_") ||
    course.startsWith("ACT_")
  );
}

// Cache the approved MCQ pool per course for 1 hour. Question sets are
// stable; the per-request shuffle still randomizes what each user sees.
const getCoursePool = unstable_cache(
  async (course: ApCourse) => {
    return prisma.question.findMany({
      where: {
        course,
        questionType: "MCQ",
        isApproved: true,
      },
      select: {
        id: true,
        questionText: true,
        options: true,
        correctAnswer: true,
        unit: true,
        topic: true,
      },
      take: 50,
    });
  },
  ["am-i-ready-questions-pool"],
  { revalidate: 3600, tags: ["am-i-ready-questions"] },
);

export async function GET(req: Request) {
  // CF Workers friendly IP extraction.
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    "unknown";
  const { allowed } = rateLimit(ip, "am-i-ready:questions", 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const course = searchParams.get("course");

  if (
    !course ||
    !VALID_AP_COURSES.includes(course as ApCourse) ||
    !isStudentNestCourse(course)
  ) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  try {
    const pool = await getCoursePool(course as ApCourse);

    if (pool.length < 3) {
      return NextResponse.json(
        { error: "Not enough questions available for this course yet." },
        { status: 404 },
      );
    }

    // Shuffle pool then take 5.
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);

    const questions: Array<{
      id: string;
      questionText: string;
      options: string[];
      unit: string;
      topic: string;
    }> = [];
    const answerKey: Record<string, string> = {};

    for (const q of picked) {
      const rawOpts: string[] =
        typeof q.options === "string"
          ? JSON.parse(q.options)
          : (q.options as string[]) || [];
      if (rawOpts.length < 2) continue;

      const letters = Array.from({ length: rawOpts.length }, (_, j) =>
        String.fromCharCode(65 + j),
      );
      const origLetter = (q.correctAnswer || "").toUpperCase();
      const oldIdx = letters.indexOf(origLetter);

      let finalOpts = rawOpts;
      let finalLetter = origLetter;

      // Fisher-Yates shuffle + update correct letter — same pattern as
      // PrepLion's /api/readiness/questions.
      if (oldIdx >= 0 && rawOpts.length >= 2) {
        const shuffled = [...rawOpts];
        for (let k = shuffled.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [shuffled[k], shuffled[j]] = [shuffled[j], shuffled[k]];
        }
        const correctText = rawOpts[oldIdx];
        const newIdx = shuffled.indexOf(correctText);
        if (newIdx >= 0) {
          // Relabel each option with its post-shuffle letter.
          finalOpts = shuffled.map((opt, idx) =>
            opt.replace(/^[A-E]\)\s*/, `${letters[idx]}) `),
          );
          finalLetter = letters[newIdx];
        }
      }

      questions.push({
        id: q.id,
        questionText: q.questionText,
        options: finalOpts,
        unit: q.unit,
        topic: q.topic,
      });
      answerKey[q.id] = finalLetter;
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Could not build a valid quiz. Try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      questions,
      answerKey,
      total: questions.length,
    });
  } catch (err) {
    console.error("[am-i-ready-quiz]", err);
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 },
    );
  }
}
