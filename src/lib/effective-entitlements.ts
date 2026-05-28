/**
 * 2026-05-27 — Stale-JWT mitigation for premium gates.
 *
 * Design audit P0 finding: JWT only refreshes once per browser session.
 * Stripe webhook flips subscriptionTier in DB but JWT keeps old value
 * for up to 30 days. Paid users hit paywalls on premium-gated routes
 * until they log out + log back in.
 *
 * Interim fix until a proper JWT-versioning model lands:
 *   - JWT says premium? Trust it — no extra DB hit.
 *   - JWT says free? Fall back to a fresh DB read — covers the
 *     paid-but-JWT-stale case at the cost of one query per gated
 *     request from genuinely-free users.
 *
 * Routes should import and call `isEffectivelyPremium(session, userId, track)`
 * instead of reading session.user.subscriptionTier directly.
 */

import { prisma } from "@/lib/prisma";
import { hasAnyPremium, isPremiumForTrack } from "@/lib/tiers";

interface SessionShape {
  user?: {
    id?: string;
    role?: string | null;
    subscriptionTier?: string | null;
    moduleSubs?: Array<{ status?: string | null }> | null;
  };
}

export async function isEffectivelyPremium(
  session: SessionShape | null,
  userId: string,
  track: string | null | undefined,
): Promise<boolean> {
  if (!session?.user) return false;
  if (session.user.role === "ADMIN") return true;

  const jwtSays =
    hasAnyPremium((session.user.moduleSubs ?? []) as never) ||
    isPremiumForTrack(session.user.subscriptionTier ?? "", track ?? "");
  if (jwtSays) return true;

  try {
    const fresh = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        moduleSubscriptions: {
          where: { status: { in: ["active", "canceling"] } },
          select: { status: true },
        },
      },
    });
    if (!fresh) return false;
    if (hasAnyPremium(fresh.moduleSubscriptions as never)) return true;
    if (isPremiumForTrack(fresh.subscriptionTier ?? "", track ?? "")) return true;
  } catch {
    return false;
  }
  return false;
}
