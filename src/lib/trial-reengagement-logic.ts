/**
 * REQ-028 — Pure decision logic for the trial re-engagement cron.
 *
 * Lives outside the route file because Next.js App Router rejects
 * non-HTTP exports on route.ts. Unit tests import from here; the
 * route imports from here.
 */

const HOURS = 3600 * 1000;

export const CADENCE: Array<{ dormantHours: number; emailType: string }> = [
  { dormantHours: 24, emailType: "first_nudge" },
  { dormantHours: 72, emailType: "urgency" },
  { dormantHours: 144, emailType: "last_chance" },
];

export const MAX_EMAILS_PER_TRIAL = 3;
export const MIN_HOURS_BETWEEN_EMAILS = 36;

export function decideEmail(input: {
  now: Date;
  lastActiveDate: Date | null;
  freeTrialExpiresAt: Date;
  previousEmails: Array<{ sentAt: Date; emailType: string }>;
}): { shouldSend: boolean; emailType: string | null; reason: string } {
  const { now, lastActiveDate, freeTrialExpiresAt, previousEmails } = input;

  if (freeTrialExpiresAt.getTime() <= now.getTime()) {
    return { shouldSend: false, emailType: null, reason: "trial expired" };
  }
  if (previousEmails.length >= MAX_EMAILS_PER_TRIAL) {
    return { shouldSend: false, emailType: null, reason: "max emails reached" };
  }
  // last_chance is terminal — no further emails of any type after it.
  if (previousEmails.some((e) => e.emailType === "last_chance")) {
    return { shouldSend: false, emailType: null, reason: "last_chance already sent — terminal" };
  }
  const mostRecent = previousEmails.length > 0
    ? previousEmails.reduce((a, b) => (a.sentAt > b.sentAt ? a : b))
    : null;
  if (mostRecent) {
    const hoursSinceLast = (now.getTime() - mostRecent.sentAt.getTime()) / HOURS;
    if (hoursSinceLast < MIN_HOURS_BETWEEN_EMAILS) {
      return { shouldSend: false, emailType: null, reason: "min interval not elapsed" };
    }
  }

  const hoursDormant = lastActiveDate
    ? (now.getTime() - lastActiveDate.getTime()) / HOURS
    : Infinity;

  if (hoursDormant < CADENCE[0].dormantHours) {
    return { shouldSend: false, emailType: null, reason: "user recently active" };
  }

  const alreadySentTypes = new Set(previousEmails.map((e) => e.emailType));
  const hoursUntilExpiry = (freeTrialExpiresAt.getTime() - now.getTime()) / HOURS;

  if (hoursUntilExpiry < 48 && !alreadySentTypes.has("last_chance")) {
    return { shouldSend: true, emailType: "last_chance", reason: "trial <48h" };
  }

  for (const step of CADENCE) {
    if (hoursDormant >= step.dormantHours && !alreadySentTypes.has(step.emailType)) {
      return { shouldSend: true, emailType: step.emailType, reason: `dormant ${Math.round(hoursDormant)}h → ${step.emailType}` };
    }
  }

  return { shouldSend: false, emailType: null, reason: "no matching step" };
}
