import { NextResponse } from "next/server";
import {
  isPremiumRestrictionEnabled,
  isAnalyticsEnabled,
  isStudyPlanEnabled,
  isKnowledgeCheckEnabled,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

// Safe-default for any flag whose lookup throws. Each lookup hits Neon HTTP
// — on cold-start or transient blip a single throw used to 500 the whole
// route, which broke /dashboard's first paint (deploy13 surfaced this when
// /api/feature-flags 500'd 4 times during one /dashboard load 2026-04-25).
async function safeFlag(p: () => Promise<boolean>, fallback: boolean): Promise<boolean> {
  try {
    return await p();
  } catch {
    return fallback;
  }
}

export async function GET() {
  const [premiumRestrictionEnabled, analyticsEnabled, studyPlanEnabled, knowledgeCheckEnabled] = await Promise.all([
    safeFlag(isPremiumRestrictionEnabled, true),  // default ON — safer for revenue
    safeFlag(isAnalyticsEnabled, true),
    safeFlag(isStudyPlanEnabled, true),
    safeFlag(isKnowledgeCheckEnabled, false),     // OFF unless explicitly enabled
  ]);
  return NextResponse.json({
    premiumRestrictionEnabled,
    analyticsEnabled,
    studyPlanEnabled,
    knowledgeCheckEnabled,
  });
}
