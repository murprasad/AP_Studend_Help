import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getStripeConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stripeConfig = await getStripeConfig();
    if (!stripeConfig.secretKey) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
    }

    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get user and their subscription ID from DB
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, stripeSubscriptionId: true, subscriptionTier: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.subscriptionTier !== "PREMIUM") {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    let subscriptionId = user.stripeSubscriptionId;

    // If we don't have it stored, look it up from Stripe via email
    if (!subscriptionId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "active",
          limit: 1,
        });
        if (subs.data.length > 0) {
          subscriptionId = subs.data[0].id;
        }
      }
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: "No Stripe subscription found" }, { status: 404 });
    }

    // Cancel at period end (user keeps access until billing period ends)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEnd = new Date(subscription.current_period_end * 1000);

    // Update DB immediately so UI reflects canceling state
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeCurrentPeriodEnd: periodEnd,
        stripeSubscriptionStatus: "canceling",
      },
    });

    return NextResponse.json({
      success: true,
      periodEnd: periodEnd.toISOString(),
      message: "Subscription will cancel at the end of your billing period.",
    });
  } catch (error) {
    console.error("POST /api/billing/cancel error:", error);
    return NextResponse.json({ error: "Could not cancel subscription" }, { status: 500 });
  }
}

// Also allow re-activating a canceled subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stripeConfig = await getStripeConfig();
    if (!stripeConfig.secretKey) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
    }

    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    return NextResponse.json({ success: true, message: "Subscription reactivated." });
  } catch (error) {
    console.error("DELETE /api/billing/cancel error:", error);
    return NextResponse.json({ error: "Could not reactivate subscription" }, { status: 500 });
  }
}
