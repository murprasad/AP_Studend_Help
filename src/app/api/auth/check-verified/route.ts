import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // SEC-2 (2026-04-24): per-IP rate-limit. This endpoint is polled by
  // /register after signup waiting for email verification, so it must
  // stay unauthed. But without a rate-limit, an anonymous attacker can
  // enumerate which emails are registered+verified by bulk-probing — a
  // MEDIUM-severity user-enumeration vector.
  // 10/min per IP: legitimate polls are 1–3 during verify; bulk enum
  // becomes impractical.
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rl = rateLimit(`ip:${ip}`, "auth:check-verified", 10);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ verified: false });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { emailVerified: true },
  });

  return NextResponse.json({ verified: !!user?.emailVerified });
}
