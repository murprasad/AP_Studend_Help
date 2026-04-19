const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@studentnest.ai";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
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
      <h1 style="color: #1865F2;">Welcome to StudentNest, ${firstName}!</h1>
      <p>Please verify your email address to get started — your study prep platform is ready.</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
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
      <a href="${adminUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 8px;">
        View Admin Dashboard
      </a>
    </div>
    `
  );
}

/**
 * Onboarding-bounce re-engagement email.
 *
 * Target: users who completed onboarding in the last 14 days but never
 * answered a single question (zero StudentResponse rows). Canonical example:
 * Adithya Narayana, 2026-04-18 — signed up, breezed through onboarding in
 * 17 seconds, started the diagnostic, answered nothing, never returned.
 *
 * The email is warm, short, direct: "your rough score is ready" + one-tap
 * CTA into /dashboard where the Coach Card picks it up from there. We only
 * ever send this once per user (dedup via TrialReengagement row with
 * emailType="onboarding_bounce").
 */
export async function sendOnboardingBounceEmail(opts: {
  email: string;
  firstName: string;
  courseName: string;
}): Promise<void> {
  const { email, firstName, courseName } = opts;
  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";
  const subject = `Your rough ${courseName} score is ready`;
  const dashboardUrl = `${baseUrl}/dashboard?src=onboarding-bounce`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin: 0 0 12px 0; font-size: 22px;">Hi ${firstName},</h1>
      <p style="color: #334155; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
        You set up a ${courseName} plan but haven&apos;t answered a question yet. We&apos;ve still got a rough projected score for you based on your track &mdash; come see it. Takes 60 seconds to answer one question and sharpen it.
      </p>
      <a href="${dashboardUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0 24px 0;">
        See my rough score
      </a>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px;">
        We only email once; unsubscribe anytime by replying.
      </p>
    </div>
  `.trim();
  await sendEmail(email, subject, html);
}

/**
 * Registration-stall re-engagement email.
 *
 * Target: users who registered and verified their email but never completed
 * onboarding (no course picked). Sibling of sendOnboardingBounceEmail — but
 * fires one stage earlier in the funnel, so the copy asks the user to
 * "finish setup" instead of "come see your rough score" (they have no
 * score yet — they never even picked a course).
 *
 * Dedup via TrialReengagement row with emailType="registration_stall".
 * No course resolution needed since these users never picked one.
 */
export async function sendRegistrationStallEmail(opts: {
  email: string;
  firstName: string;
}): Promise<void> {
  const { email, firstName } = opts;
  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";
  const subject = `You're 30 seconds from a personalized plan`;
  const onboardingUrl = `${baseUrl}/onboarding?src=registration-stall`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin: 0 0 12px 0; font-size: 22px;">Hi ${firstName},</h1>
      <p style="color: #334155; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
        You created an account but haven&apos;t picked a course yet. Takes 30 seconds to finish setup and see your personalized plan. Come back anytime &mdash; your account is ready when you are.
      </p>
      <a href="${onboardingUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0 24px 0;">
        Finish setup &rarr;
      </a>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px;">
        One-time email. Unsubscribe by replying.
      </p>
    </div>
  `.trim();
  await sendEmail(email, subject, html);
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
      <h1 style="color: #1865F2;">Password Reset</h1>
      <p>Hi ${firstName}, we received a request to reset your password.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #666;">This link expires in 1 hour.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    `
  );
}
