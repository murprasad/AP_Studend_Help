const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@studentnest.ai";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured. Add it to your environment variables.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error ${res.status}: ${err}`);
  }
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await sendEmail(
    email,
    "Verify your StudentNest account",
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Welcome to StudentNest, ${firstName}!</h1>
      <p>Please verify your email address to get started — your AI study partner is ready.</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #666;">This link expires in 24 hours.</p>
      <p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
    `
  );
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendEmail(
    email,
    "Reset your StudentNest password",
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Password Reset</h1>
      <p>Hi ${firstName}, we received a request to reset your password.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #666;">This link expires in 1 hour.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    `
  );
}
