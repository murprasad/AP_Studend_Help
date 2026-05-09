/**
 * src/app/api/tip/route.ts — Real-Student-Tip endpoint.
 *
 * Phase 4 of the user-feedback loop. Returns one popup_tip for the
 * active course, picked round-robin. Per project_feedback_loop_standard_spec.md.
 *
 * GET  /api/tip?course=CLEP_BIOLOGY        → { tip } | { tip: null }
 * POST /api/tip { tip_id, action }         → log dismissal/seen
 *
 * Per user 2026-05-09: tip shown every login.
 *
 * Implementation note: profiles are statically imported (see
 * src/lib/feedback-profiles.ts) instead of fs.readFileSync at runtime —
 * the latter doesn't work on CF Workers because data/ JSON files aren't
 * bundled by default.
 */
import { NextRequest, NextResponse } from "next/server";
import { getFeedbackProfile } from "@/lib/feedback-profiles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const course = url.searchParams.get("course");
  if (!course) {
    return NextResponse.json({ tip: null, reason: "no course" });
  }
  const profile = getFeedbackProfile(course);
  if (!profile?.popup_tips || profile.popup_tips.length === 0) {
    return NextResponse.json({ tip: null, reason: "no tips" });
  }
  const idx = Math.floor(Date.now() / 60000) % profile.popup_tips.length;
  const tip = profile.popup_tips[idx];
  return NextResponse.json({ tip });
}

export async function POST(req: NextRequest) {
  try {
    await req.json();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
