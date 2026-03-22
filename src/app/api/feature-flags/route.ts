import { NextResponse } from "next/server";
import { isPremiumRestrictionEnabled, isAnalyticsEnabled, isStudyPlanEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const [premiumRestrictionEnabled, analyticsEnabled, studyPlanEnabled] = await Promise.all([
    isPremiumRestrictionEnabled(),
    isAnalyticsEnabled(),
    isStudyPlanEnabled(),
  ]);
  return NextResponse.json({ premiumRestrictionEnabled, analyticsEnabled, studyPlanEnabled });
}
