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
  const verifyUrl = `${process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai"}/verify-email?token=${token}`;

  await sendEmail(
    email,
    "Verify your StudentNest account",
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Welcome to StudentNest, ${firstName}!</h1>
      <p>Please verify your email address to get started — your study prep platform is ready.</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #666;">This link expires in 24 hours.</p>
      <p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
    `
  );
}

export async function sendPremiumSignupNotification(opts: {
  userEmail: string;
  userName: string;
  plan: string;
}): Promise<void> {
  const { userEmail, userName, plan } = opts;
  const adminUrl = "https://studentnest.ai/admin";
  const now = new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" });

  await sendEmail(
    "contact@studentnest.ai",
    `🎉 New Premium Member: ${userName}`,
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; padding: 24px; border-radius: 12px;">
      <h1 style="color: #818cf8; margin-top: 0;">New Premium Signup</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${userName}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Email</td><td style="padding: 8px 0;">${userEmail}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Plan</td><td style="padding: 8px 0; color: #34d399; font-weight: 600;">${plan}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Time</td><td style="padding: 8px 0;">${now} UTC</td></tr>
      </table>
      <a href="${adminUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 8px;">
        View Admin Dashboard
      </a>
    </div>
    `
  );
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai"}/reset-password?token=${token}`;

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
