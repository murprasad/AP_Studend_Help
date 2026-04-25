/**
 * GET /api/cross-module-nudge?course=<currentCourse>
 *
 * Powers the post-session "Try [SAT/ACT] practice next" usage-expansion
 * card surfaced on the practice summary screen. Goal: now that Beta 7.1
 * makes Premium all-access, drive Premium users to actually USE the
 * other exams they unlocked.
 *
 * Returns `shouldNudge: true` iff ALL of:
 *   1. User is Premium (any active ModuleSubscription) — free users
 *      already see other upgrade prompts; this card is for converted
 *      users we want to expand.
 *   2. User has practiced in their primary track but NOT in any other
 *      track — once they explore on their own, the nudge is redundant.
 *   3. We can pick a sensible suggestion (course exists in another
 *      track from the one they just practiced).
 *
 * Suggestion priority: AP-primary → suggest SAT, then ACT;
 *                       SAT-primary → suggest ACT, then AP_CALCULUS_AB;
 *                       ACT-primary → suggest SAT, then AP_CALCULUS_AB.
 *
 * Read-only. Cheap (one count query + a couple of distinct queries).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAnyPremium, isPremiumForTrack, type ModuleSub } from "@/lib/tiers";
import { getCourseModule } from "@/lib/courses";
import type { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

// Suggested next-exam picks per primary module. Keep these to courses that
// (a) have content seeded and (b) feel like a natural lateral move from
// their primary. AP-Calc/Bio/Chem on the AP side is overkill for an
// SAT-primary user — better to nudge them to ACT (close cousin).
const SUGGESTIONS: Record<string, { course: ApCourse; exam: "AP" | "SAT" | "ACT"; displayName: string }> = {
  ap_to_sat: { course: "SAT_MATH" as ApCourse, exam: "SAT", displayName: "SAT Math" },
  ap_to_act: { course: "ACT_MATH" as ApCourse, exam: "ACT", displayName: "ACT Math (5-choice)" },
  sat_to_act: { course: "ACT_SCIENCE" as ApCourse, exam: "ACT", displayName: "ACT Science" },
  sat_to_ap: { course: "AP_CALCULUS_AB" as ApCourse, exam: "AP", displayName: "AP Calculus AB" },
  act_to_sat: { course: "SAT_READING_WRITING" as ApCourse, exam: "SAT", displayName: "SAT Reading & Writing" },
  act_to_ap: { course: "AP_CALCULUS_AB" as ApCourse, exam: "AP", displayName: "AP Calculus AB" },
};

function pickSuggestion(primaryModule: string, exploredModules: Set<string>) {
  const order = ["ap", "sat", "act"];
  const others = order.filter((m) => m !== primaryModule && !exploredModules.has(m));
  if (others.length === 0) return null;

  // Prefer the lateral cousin: SAT↔ACT before either→AP, AP→SAT before AP→ACT.
  const targetModule = others[0];
  const key = `${primaryModule}_to_${targetModule}` as keyof typeof SUGGESTIONS;
  return SUGGESTIONS[key] ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
    const isPremium =
      hasAnyPremium(moduleSubs) ||
      isPremiumForTrack(session.user.subscriptionTier, session.user.track ?? "ap");

    if (!isPremium) {
      return NextResponse.json({ shouldNudge: false, reason: "free_tier" });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const currentCourse = searchParams.get("course") as ApCourse | null;
    const primaryModule = currentCourse ? getCourseModule(currentCourse) : "ap";

    // Find every course the user has ever answered a question in. Cheap
    // groupBy on userId+course (covered by index Question(course,...) +
    // StudentResponse(userId,...)).
    const distinctCourses = await prisma.studentResponse.findMany({
      where: { userId },
      select: { question: { select: { course: true } } },
      distinct: ["questionId"], // dedupe — we just want unique courses
      take: 200,
    });

    const exploredModules = new Set<string>(
      distinctCourses
        .map((r) => r.question?.course)
        .filter((c): c is ApCourse => !!c)
        .map((c) => getCourseModule(c)),
    );

    // If user has already explored multiple tracks, they don't need the nudge.
    const otherTrackTouched = Array.from(exploredModules).some((m) => m !== primaryModule);
    if (otherTrackTouched) {
      return NextResponse.json({
        shouldNudge: false,
        reason: "already_cross_module",
        exploredModules: Array.from(exploredModules),
      });
    }

    const suggestion = pickSuggestion(primaryModule, exploredModules);
    if (!suggestion) {
      return NextResponse.json({ shouldNudge: false, reason: "no_suggestion_available" });
    }

    return NextResponse.json({
      shouldNudge: true,
      currentModule: primaryModule,
      suggestedCourse: suggestion.course,
      suggestedExam: suggestion.exam,
      suggestedDisplayName: suggestion.displayName,
      // Pre-built href so the client just renders + links.
      href: `/practice?mode=focused&count=3&course=${suggestion.course}&src=cross_module_nudge`,
    });
  } catch (e) {
    console.error("[/api/cross-module-nudge] error:", e);
    // Fail silent — the nudge is enhancement, not core UX.
    return NextResponse.json({ shouldNudge: false, reason: "error" });
  }
}
