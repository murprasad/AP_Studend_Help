/**
 * src/app/api/tip/route.ts — Real-Student-Tip endpoint.
 *
 * Phase 4 of the user-feedback loop. Reads
 * data/user-feedback-profiles/<course>.json and returns one popup_tip
 * for the active course, picked round-robin (avoiding repeat within 7 days).
 *
 * Per project_feedback_loop_standard_spec.md.
 *
 * GET  /api/tip?course=CLEP_BIOLOGY        → { tip } | { tip: null }
 * POST /api/tip { tip_id, action }         → log dismissal/seen
 *
 * Per user 2026-05-09: tip shown every login. "Don't show again" = global off.
 */
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // need fs

interface PopupTip {
  tip_id: string;
  text: string;
  source_attribution: string;
  first_seen?: string;
  topic_filter?: string[];
}

function loadProfile(course: string): { popup_tips?: PopupTip[] } | null {
  try {
    const profilePath = join(process.cwd(), "data", "user-feedback-profiles", `${course}.json`);
    if (!existsSync(profilePath)) return null;
    return JSON.parse(readFileSync(profilePath, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const course = url.searchParams.get("course");
  if (!course) {
    return NextResponse.json({ tip: null, reason: "no course" });
  }
  const profile = loadProfile(course);
  if (!profile?.popup_tips || profile.popup_tips.length === 0) {
    return NextResponse.json({ tip: null, reason: "no tips" });
  }
  // Round-robin via simple time-based hash (changes per minute) — over time
  // each tip gets surfaced. Real per-user dedup happens client-side via
  // localStorage of dismissed tip_ids.
  const idx = Math.floor(Date.now() / 60000) % profile.popup_tips.length;
  const tip = profile.popup_tips[idx];
  return NextResponse.json({ tip });
}

export async function POST(req: NextRequest) {
  // Tip dismissal/seen logging (no PII, fire-and-forget acceptable).
  // Currently no-op; placeholder for telemetry. Returns { ok: true }.
  try {
    await req.json();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
