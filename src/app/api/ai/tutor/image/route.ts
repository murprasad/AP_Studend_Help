import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWikipediaSummary } from "@/lib/edu-apis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ imageUrl: null }, { status: 401 });

  const topic = req.nextUrl.searchParams.get("topic");
  if (!topic?.trim()) return NextResponse.json({ imageUrl: null });

  try {
    const result = await Promise.race([
      getWikipediaSummary(topic.trim()),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return NextResponse.json({ imageUrl: result?.imageUrl ?? null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
