import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ verified: false });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { emailVerified: true },
  });

  return NextResponse.json({ verified: !!user?.emailVerified });
}
