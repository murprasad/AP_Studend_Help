import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcrypt-ts";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  gradeLevel: z.string(),
  school: z.string().optional(),
  track: z.enum(["ap", "sat", "act", "clep", "dsst"]).default("ap"),
});

export async function POST(req: NextRequest) {
  try {
    const regEnabled = await getSetting("registration_enabled", "true");
    if (regEnabled !== "true") {
      return NextResponse.json({ error: "Registration is currently disabled." }, { status: 403 });
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = hashSync(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        gradeLevel: data.gradeLevel,
        school: data.school || null,
        track: data.track ?? "ap",
      },
    });

    // Create email verification token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    if (process.env.NODE_ENV === "development") {
      // Local dev only: auto-verify so developers can log in immediately
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
      console.log(`[DEV] Auto-verified email for ${user.email}. Token: ${token}`);
    } else {
      // Production: send real verification email via Resend
      await sendVerificationEmail(user.email, user.firstName, token);
    }

    return NextResponse.json({ success: true, message: "Account created. Please check your email." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
