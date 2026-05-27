/**
 * POST /api/push/subscribe
 * Persist a Web Push subscription for the authenticated user.
 *
 * Body: { endpoint: string; keys: { p256dh: string; auth: string } }
 *
 * The browser provides this object after calling
 * `serviceWorkerRegistration.pushManager.subscribe({...})`.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Missing endpoint/keys.p256dh/keys.auth" }, { status: 400 });
  }
  const userAgent = req.headers.get("user-agent") ?? undefined;
  try {
    await saveSubscription(session.user.id, endpoint, p256dh, auth, userAgent);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "subscribe failed" }, { status: 500 });
  }
}
