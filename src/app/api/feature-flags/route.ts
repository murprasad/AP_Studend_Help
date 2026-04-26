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
  // Belt-and-suspenders: outer try/catch in case import-time errors or
  // runtime aborts crash the route. Beta 8.0 deploy26 still showed 500s
  // here despite per-flag safeFlag wrapping, suggesting either an
  // unhandled rejection in Promise.all or a synchronous import failure
  // when the isolate cold-starts. Returning safe defaults is always
  // better than 500 — the dashboard renders, all flags assumed enabled.
  try {
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
  } catch (e) {
    console.error("[/api/feature-flags] outer fallback:", e instanceof Error ? e.message : String(e));
    return NextResponse.json({
      premiumRestrictionEnabled: true,
      analyticsEnabled: true,
      studyPlanEnabled: true,
      knowledgeCheckEnabled: false,
      _degraded: true,
    });
  }
}
