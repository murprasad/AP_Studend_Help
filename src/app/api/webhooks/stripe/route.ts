import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getStripeConfig } from "@/lib/settings";
import { sendPremiumSignupNotification } from "@/lib/email";
import {
  getPeriodEndDate,
  getUserIdFromSubscription,
  parseClientReferenceId,
  TIER_FOR_MODULE,
  MODULE_DISPLAY_NAME,
  type ModuleSlug,
} from "@/lib/stripe-webhook";

// Disable body parsing so we can verify the raw webhook signature
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripeConfig = await getStripeConfig();
  const stripeKey = stripeConfig.secretKey;
  const webhookSecret = stripeConfig.webhookSecret;

  if (!stripeKey || !webhookSecret) {
    console.error("Stripe keys not configured — set via env vars or Admin → Payment Setup");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const { userId: refUserId, module: refModule } = parseClientReferenceId(
          checkoutSession.client_reference_id || "",
        );
        let userId = checkoutSession.metadata?.userId || refUserId;
        let resolvedModule = refModule;
        // EMAIL FALLBACK: Stripe Payment Links can drop client_reference_id
        // if "Allow customer to set client reference ID" isn't enabled on the
        // link. When that happens we get a checkout.session.completed event
        // with no userId at all. Fall back to looking the user up by the
        // customer email Stripe captured during checkout.
        if (!userId) {
          const fallbackEmail =
            checkoutSession.customer_details?.email || checkoutSession.customer_email;
          if (fallbackEmail) {
            const found = await prisma.user.findUnique({
              where: { email: fallbackEmail },
              select: { id: true, track: true },
            });
            if (found) {
              userId = found.id;
              if (!resolvedModule && found.track) resolvedModule = found.track;
              console.log(`[webhook] checkout.session.completed: matched user by email=${fallbackEmail} userId=${userId} (event=${event.id})`);
            } else {
              console.warn(`[webhook] checkout.session.completed: no user found for email=${fallbackEmail} (event=${event.id})`);
            }
          }
        }
        if (userId && checkoutSession.mode === "subscription") {
          const module = checkoutSession.metadata?.module || checkoutSession.metadata?.track || resolvedModule || "ap";
          // Write to ModuleSubscription table (new)
          try {
            await prisma.moduleSubscription.upsert({
              where: { userId_module: { userId, module } },
              create: { userId, module, status: "active" },
              update: { status: "active" },
            });
          } catch (e) { console.warn("[webhook] ModuleSubscription upsert failed:", e); }
          // Legacy: also update subscriptionTier on User. Wrap in try/catch
          // so a missing user (deleted account, mistyped client_reference_id,
          // test events) doesn't make Stripe retry forever.
          let user: { email: string; firstName: string | null; lastName: string | null } | null = null;
          try {
            user = await prisma.user.update({
              where: { id: userId },
              data: { subscriptionTier: TIER_FOR_MODULE[module as ModuleSlug] ?? "AP_PREMIUM" },
              select: { email: true, firstName: true, lastName: true },
            });
          } catch (e) {
            console.warn(`[webhook] checkout.session.completed: User.update failed for userId=${userId} (event=${event.id}):`, e);
          }
          if (user) {
            const amountTotal = checkoutSession.amount_total ?? 0;
            const planCycle = amountTotal >= 7000 ? "Annual ($79.99/yr)" : "Monthly ($9.99/mo)";
            const moduleName = MODULE_DISPLAY_NAME[module as ModuleSlug] || "Premium";
            sendPremiumSignupNotification({
              userEmail: user.email,
              userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
              plan: `${moduleName} — ${planCycle}`,
            }).catch((err) => console.warn("[webhook] Premium notification email failed:", err));
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const isCanceling = isActive && subscription.cancel_at_period_end;
        const userId = await getUserIdFromSubscription(stripe, subscription, prisma);
        if (userId) {
          const module = subscription.metadata?.module || subscription.metadata?.track || "ap";
          const newStatus = isActive ? (isCanceling ? "canceling" : "active") : "canceled";
          const periodEnd = getPeriodEndDate(subscription); // null-safe for API ≥ 2025-09-30
          // Write to ModuleSubscription
          try {
            await prisma.moduleSubscription.upsert({
              where: { userId_module: { userId, module } },
              create: { userId, module, status: newStatus, stripeSubscriptionId: subscription.id, stripeCurrentPeriodEnd: periodEnd },
              update: { status: newStatus, stripeSubscriptionId: subscription.id, stripeCurrentPeriodEnd: periodEnd },
            });
          } catch (e) { console.warn("[webhook] ModuleSubscription upsert failed:", e); }
          // Legacy: update User fields. Wrap so missing-user / schema mismatch
          // doesn't crash the whole webhook (Stripe would retry forever).
          try {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionTier: isActive ? (TIER_FOR_MODULE[module as ModuleSlug] ?? "AP_PREMIUM") : "FREE",
                stripeSubscriptionId: subscription.id,
                stripeCurrentPeriodEnd: periodEnd,
                stripeSubscriptionStatus: isCanceling ? "canceling" : subscription.status,
              },
            });
          } catch (e) {
            console.warn(`[webhook] subscription.${event.type.endsWith("created") ? "created" : "updated"}: User.update failed for userId=${userId} (event=${event.id}):`, e);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromSubscription(stripe, subscription, prisma);
        if (userId) {
          const module = subscription.metadata?.module || subscription.metadata?.track || "ap";
          // Update ModuleSubscription
          try {
            await prisma.moduleSubscription.upsert({
              where: { userId_module: { userId, module } },
              create: { userId, module, status: "canceled" },
              update: { status: "canceled", stripeCurrentPeriodEnd: null },
            });
          } catch (e) { console.warn("[webhook] ModuleSubscription update failed:", e); }
          // Legacy: update User
          try {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionTier: "FREE",
                stripeSubscriptionStatus: "canceled",
                stripeCurrentPeriodEnd: null,
              },
            });
          } catch (e) {
            console.warn(`[webhook] subscription.deleted: User.update failed for userId=${userId} (event=${event.id}):`, e);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        // Beta 7.3 (2026-04-25): real handler. Track attempt count via
        // invoice.attempt_count from Stripe; on the 4th failed attempt
        // (Stripe's default smart-retry exhausts after 3), downgrade
        // the user's subscription state so they don't keep accessing
        // Premium content with a dead card. Stripe still drives the
        // retry schedule; we just react to the final outcome.
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as { subscription?: string }).subscription;
        const attemptCount = invoice.attempt_count ?? 0;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        console.warn(`[webhook] invoice.payment_failed invoice=${invoice.id} attempts=${attemptCount} sub=${subId} customer=${customerId}`);
        if (attemptCount >= 4 && subId) {
          // Mark the matching ModuleSubscription as past_due so gating
          // surfaces an "update card" prompt. Don't hard-cancel — Stripe
          // will fire customer.subscription.deleted if it reaches that.
          try {
            await prisma.moduleSubscription.updateMany({
              where: { stripeSubscriptionId: subId },
              data: { status: "past_due" },
            });
          } catch (e) {
            console.warn("[webhook] payment_failed → moduleSub past_due failed:", e instanceof Error ? e.message : String(e));
          }
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    // Beta 7.3 (2026-04-25): NEVER return 500 to Stripe. Returning a
    // non-2xx tells Stripe the webhook failed and triggers retries —
    // FOR THIS EVENT. But returning 500 with a handler-internal error
    // (e.g. transient Prisma cold-start) makes Stripe retry up to 3
    // days, AND if the same error recurs on every retry, the event
    // is eventually marked permanently failed. Real revenue loss case:
    // user paid, our webhook 500'd on a transient DB hiccup, Stripe
    // gave up, the user's tier was never flipped to PREMIUM.
    //
    // Fix: log the error (Sentry will pick up the console.error in
    // production) and return 200. Stripe stops retrying, but our
    // /api/cron/stripe-reconcile hourly cron will catch any state
    // drift within 60 minutes via the `checked` → `reconciled` path.
    console.error(`[webhook] Error handling event=${event.id} type=${event.type}:`, err);
    return NextResponse.json({
      received: true,
      handled: false,
      error: err instanceof Error ? err.message : String(err),
      eventId: event.id,
    }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
