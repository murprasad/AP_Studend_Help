export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "If that email is registered, a reset link was sent." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to avoid revealing whether an account exists
    if (!user) {
      return NextResponse.json({ message: "If that email is registered, a reset link was sent." });
    }

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new token (expires in 1 hour)
    const token = crypto.randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 3_600_000),
      },
    });

    // Send email (don't block on SMTP failures)
    try {
      await sendPasswordResetEmail(email.toLowerCase(), user.firstName, token);
    } catch (emailErr) {
      console.error("Password reset email failed:", emailErr);
    }

    return NextResponse.json({ message: "If that email is registered, a reset link was sent." });
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ message: "If that email is registered, a reset link was sent." });
  }
}
