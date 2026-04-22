import { NextResponse } from "next/server";
import {
  isPremiumRestrictionEnabled,
  isAnalyticsEnabled,
  isStudyPlanEnabled,
  isKnowledgeCheckEnabled,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const [premiumRestrictionEnabled, analyticsEnabled, studyPlanEnabled, knowledgeCheckEnabled] = await Promise.all([
    isPremiumRestrictionEnabled(),
    isAnalyticsEnabled(),
    isStudyPlanEnabled(),
    isKnowledgeCheckEnabled(),
  ]);
  return NextResponse.json({
    premiumRestrictionEnabled,
    analyticsEnabled,
    studyPlanEnabled,
    knowledgeCheckEnabled,
  });
}
