import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getStripeConfig } from "@/lib/settings";

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
        const userId = checkoutSession.metadata?.userId || checkoutSession.client_reference_id;
        if (userId && checkoutSession.mode === "subscription") {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionTier: "PREMIUM" },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const userId = await getUserIdFromSubscription(stripe, subscription);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionTier: isActive ? "PREMIUM" : "FREE" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromSubscription(stripe, subscription);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionTier: "FREE" },
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
