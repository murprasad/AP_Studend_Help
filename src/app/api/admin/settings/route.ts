import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setSetting, getAllSettings, FEATURE_FLAG_DEFS } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const stored = await getAllSettings();

  // Merge with defaults so all known flags appear even if not yet in DB
  const settings = Object.fromEntries(
    FEATURE_FLAG_DEFS.map((f) => [f.key, stored[f.key] ?? f.default])
  );

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const { key, value } = body as { key?: string; value?: string };

  if (!key || typeof value !== "string") {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  const validKeys = FEATURE_FLAG_DEFS.map((f) => f.key as string);
  if (!validKeys.includes(key)) {
    return NextResponse.json({ error: "Unknown setting key" }, { status: 400 });
  }

  await setSetting(key, value, session!.user.id);
  return NextResponse.json({ success: true, key, value });
}
