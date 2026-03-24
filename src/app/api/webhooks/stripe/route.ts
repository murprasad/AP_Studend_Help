import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getStripeConfig } from "@/lib/settings";
import { sendPremiumSignupNotification } from "@/lib/email";

// Disable body parsing so we can verify the raw webhook signature
export const dynamic = "force-dynamic";

async function getUserIdFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string | null> {
  // Try metadata first (most reliable)
  if (subscription.metadata?.userId) {
    return subscription.metadata.userId;
  }

  // Fall back to customer email lookup
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;

  const email = (customer as Stripe.Customer).email;
  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

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
        // client_reference_id may be "userId::module" (from payment links) or plain userId
        const rawRef = checkoutSession.client_reference_id || "";
        const [refUserId, refModule] = rawRef.includes("::") ? rawRef.split("::") : [rawRef, ""];
        const userId = checkoutSession.metadata?.userId || refUserId;
        if (userId && checkoutSession.mode === "subscription") {
          const module = checkoutSession.metadata?.module || checkoutSession.metadata?.track || refModule || "ap";
          // Write to ModuleSubscription table (new)
          try {
            await prisma.moduleSubscription.upsert({
              where: { userId_module: { userId, module } },
              create: { userId, module, status: "active" },
              update: { status: "active" },
            });
          } catch (e) { console.warn("[webhook] ModuleSubscription upsert failed:", e); }
          // Legacy: also update subscriptionTier on User
          const tierMap: Record<string, "AP_PREMIUM" | "SAT_PREMIUM" | "ACT_PREMIUM" | "CLEP_PREMIUM" | "DSST_PREMIUM"> = { ap: "AP_PREMIUM", sat: "SAT_PREMIUM", act: "ACT_PREMIUM", clep: "CLEP_PREMIUM", dsst: "DSST_PREMIUM" };
          const user = await prisma.user.update({
            where: { id: userId },
            data: { subscriptionTier: tierMap[module] ?? "AP_PREMIUM" },
            select: { email: true, firstName: true, lastName: true },
          });
          const amountTotal = checkoutSession.amount_total ?? 0;
          const planCycle = amountTotal >= 7000 ? "Annual ($79.99/yr)" : "Monthly ($9.99/mo)";
          const moduleNames: Record<string, string> = { ap: "AP Premium", sat: "SAT Premium", act: "ACT Premium", clep: "CLEP Premium", dsst: "DSST Premium" };
          sendPremiumSignupNotification({
            userEmail: user.email,
            userName: `${user.firstName} ${user.lastName}`.trim(),
            plan: `${moduleNames[module] || "Premium"} — ${planCycle}`,
          }).catch((err) => console.warn("[webhook] Premium notification email failed:", err));
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const isCanceling = isActive && subscription.cancel_at_period_end;
        const userId = await getUserIdFromSubscription(stripe, subscription);
        if (userId) {
          const module = subscription.metadata?.module || subscription.metadata?.track || "ap";
          const newStatus = isActive ? (isCanceling ? "canceling" : "active") : "canceled";
          // Write to ModuleSubscription
          try {
            await prisma.moduleSubscription.upsert({
              where: { userId_module: { userId, module } },
              create: { userId, module, status: newStatus, stripeSubscriptionId: subscription.id, stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000) },
              update: { status: newStatus, stripeSubscriptionId: subscription.id, stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000) },
            });
          } catch (e) { console.warn("[webhook] ModuleSubscription upsert failed:", e); }
          // Legacy: update User fields
          const tierMap2: Record<string, "AP_PREMIUM" | "SAT_PREMIUM" | "ACT_PREMIUM" | "CLEP_PREMIUM" | "DSST_PREMIUM"> = { ap: "AP_PREMIUM", sat: "SAT_PREMIUM", act: "ACT_PREMIUM", clep: "CLEP_PREMIUM", dsst: "DSST_PREMIUM" };
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: isActive ? (tierMap2[module] ?? "AP_PREMIUM") : "FREE",
              stripeSubscriptionId: subscription.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              stripeSubscriptionStatus: isCanceling ? "canceling" : subscription.status,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromSubscription(stripe, subscription);
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
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: "FREE",
              stripeSubscriptionStatus: "canceled",
              stripeCurrentPeriodEnd: null,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        // Optionally downgrade on payment failure after grace period
        // For now just log — Stripe handles retry logic
        console.warn("Payment failed for invoice:", (event.data.object as Stripe.Invoice).id);
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
