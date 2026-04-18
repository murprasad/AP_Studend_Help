/**
 * GET /api/readiness — Single source of truth for exam-native scaled score.
 *
 * Mirrors PrepLion's /api/readiness (REQ-027). Every signed-in surface that
 * needs the score (dashboard hero, sidebar ring, analytics, practice summary)
 * reads it from here so the number can't drift across surfaces.
 *
 * Response shape: `UnifiedReadiness` — includes family ("AP" | "SAT" | "ACT"),
 * scaledScore (native scale), scaleMax, label, confidence, sectionBreakdown,
 * percentile, and family-specific disclaimer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import { loadReadinessSnapshot } from "@/lib/score-engine-inputs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") as ApCourse) || "AP_WORLD_HISTORY";

    if (!VALID_AP_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    const snapshot = await loadReadinessSnapshot(userId, course, prisma);

    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[/api/readiness] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
