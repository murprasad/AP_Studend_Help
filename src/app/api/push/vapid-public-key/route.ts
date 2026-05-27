/**
 * GET /api/push/vapid-public-key
 * Returns the VAPID public key for the browser to use with pushManager.subscribe().
 * Safe to expose — public key by design.
 */
import { NextResponse } from "next/server";
import { getPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = getPublicKey();
  if (!key) {
    return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}
