import { NextResponse } from "next/server";
import { isPremiumRestrictionEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const premiumRestrictionEnabled = await isPremiumRestrictionEnabled();
  return NextResponse.json({ premiumRestrictionEnabled });
}
