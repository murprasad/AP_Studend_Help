/**
 * POST /api/cron/auto-populate
 *
 * Secure endpoint that runs the auto-populate job on demand.
 * Accepts two forms of authorization:
 *   1. Bearer token matching CRON_SECRET env var — for external cron services
 *   2. Admin session — for the "Run Now" button in the admin UI
 *
 * Reads thresholds from SiteSettings; stores last-run timestamp + result.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import { runAutoPopulate } from "@/lib/auto-populate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Auth: accept Bearer CRON_SECRET OR admin session
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let authorized = false;
  if (cronSecret && bearerToken === cronSecret) {
    authorized = true;
  } else {
    const session = await getServerSession(authOptions);
    if (session?.user?.role === "ADMIN") authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if auto-populate is enabled
  const enabled = await getSetting("auto_populate_enabled", "false");
  if (enabled !== "true") {
    return NextResponse.json({ status: "disabled" });
  }

  const threshold = parseInt(await getSetting("auto_populate_threshold", "10"), 10);
  const target = parseInt(await getSetting("auto_populate_target", "20"), 10);

  let result;
  try {
    result = await runAutoPopulate(
      isNaN(threshold) ? 10 : threshold,
      isNaN(target) ? 20 : target,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/auto-populate] runAutoPopulate threw:", msg);
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }

  try {
    const now = new Date().toISOString();
    await setSetting("auto_populate_last_run", now);
    await setSetting("auto_populate_last_result", JSON.stringify({
      generated: result.generated,
      failed: result.failed,
      processed: result.processed,
      details: result.details,
    }));
  } catch (err) {
    console.warn("[cron/auto-populate] Failed to save last-run metadata:", err instanceof Error ? err.message : err);
    // Don't fail the whole request — the populate itself succeeded
  }

  return NextResponse.json({ status: "ok", ...result });
}
