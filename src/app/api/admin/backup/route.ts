/**
 * Admin Backup API
 *
 * GET  /api/admin/backup                     — config health + list exports
 * GET  /api/admin/backup?download=YYYY-MM-DD — download a specific export JSON
 * POST /api/admin/backup?type=neon-branch    — trigger Neon branch snapshot
 * POST /api/admin/backup?type=export         — trigger data export to Blobs
 * POST /api/admin/backup?type=all            — trigger both (default)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createNeonBranch,
  runDataExport,
  getBackupStatus,
  downloadExport,
} from "@/lib/backup";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download");

  if (download) {
    const data = await downloadExport(download).catch(() => null);
    if (!data) return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${download}.json"`,
      },
    });
  }

  const status = await getBackupStatus();
  return NextResponse.json(status);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";

  const results: Record<string, unknown> = {};

  if (type === "neon-branch" || type === "all") {
    try {
      results.neonBranch = await createNeonBranch();
    } catch (err) {
      results.neonBranch = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (type === "export" || type === "all") {
    try {
      results.export = await runDataExport();
    } catch (err) {
      results.export = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  const allOk = Object.values(results).every(
    (r) => !(r as Record<string, unknown>).error
  );

  return NextResponse.json(
    { ok: allOk, triggeredAt: new Date().toISOString(), results },
    { status: allOk ? 200 : 207 }
  );
}
