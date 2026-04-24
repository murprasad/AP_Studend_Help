/**
 * Stripe webhook event handling — extracted from the route file so it
 * can be unit-tested in isolation. The bugs we shipped today (webhook
 * 500s from API version mismatch, silent skip from missing
 * client_reference_id, etc.) would have been caught by tests against
 * `handleStripeEvent` if it had existed as a pure function.
 *
 * Design: every dependency (Prisma, Stripe SDK, email sender) is passed
 * in via the `deps` object so tests can mock each independently.
 */
import type Stripe from "stripe";
import type { PrismaClient } from "@prisma/client";

export type ModuleSlug = "ap" | "sat" | "act" | "clep" | "dsst";

export const TIER_FOR_MODULE: Record<
  ModuleSlug,
  "AP_PREMIUM" | "SAT_PREMIUM" | "ACT_PREMIUM" | "CLEP_PREMIUM" | "DSST_PREMIUM"
> = {
  ap: "AP_PREMIUM",
  sat: "SAT_PREMIUM",
  act: "ACT_PREMIUM",
  clep: "CLEP_PREMIUM",
  dsst: "DSST_PREMIUM",
};

export const MODULE_DISPLAY_NAME: Record<ModuleSlug, string> = {
  ap: "AP Premium",
  sat: "SAT Premium",
  act: "ACT Premium",
  clep: "CLEP Premium",
  dsst: "DSST Premium",
};

/**
 * Parses Stripe's `client_reference_id` which we set in two formats from
 * /api/checkout:
 *   - "userId::module" (Payment Link path — encoded since links can't
 *     carry custom metadata)
 *   - "userId" (full Checkout Session path — module is in metadata)
 */
export function parseClientReferenceId(
  rawRef: string,
): { userId: string; module: string } {
  if (rawRef.includes("::")) {
    const [userId, module] = rawRef.split("::");
    return { userId, module: module ?? "" };
  }
  return { userId: rawRef, module: "" };
}

/**
 * Reads `current_period_end` from a Stripe Subscription regardless of
 * API version. Stripe API >= 2025-09-30 moved this field from the
 * Subscription root onto each SubscriptionItem.
 *
 * Returns null if neither location has the field — callers should
 * write null rather than `new Date(NaN)` (which Prisma rejects with a
 * 500 error — that was today's webhook bug).
 */
export function getPeriodEndDate(
  subscription: Stripe.Subscription,
): Date | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (subscription as any).current_period_end as number | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemEnd = (subscription.items?.data?.[0] as any)?.current_period_end as
    | number
    | null
    | undefined;
  const ts = root ?? itemEnd;
  if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
  return new Date(ts * 1000);
}

/**
 * Resolves the StudentNest user ID for a given Stripe Subscription,
 * trying metadata.userId first then falling back to customer email
 * lookup (covers Payment Links that drop client_reference_id).
 */
export async function getUserIdFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  prisma: Pick<PrismaClient, "user">,
): Promise<string | null> {
  if (subscription.metadata?.userId) {
    return subscription.metadata.userId;
  }
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  let email: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return null;
    email = (customer as Stripe.Customer).email;
  } catch (e) {
    console.warn(`[stripe-webhook] customer.retrieve failed for ${customerId}:`, e);
    return null;
  }
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}
