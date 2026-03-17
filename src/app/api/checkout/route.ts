import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { isPaymentsEnabled, getStripeConfig } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      // Not logged in — redirect to register with pricing intent
      return NextResponse.redirect(new URL("/register?next=/pricing", req.url));
    }

    if (!(await isPaymentsEnabled())) {
      return NextResponse.redirect(new URL("/pricing?error=payments_disabled", req.url));
    }

    const stripeConfig = await getStripeConfig();

    if (!stripeConfig.secretKey) {
      console.error("Stripe secret key not configured (set STRIPE_SECRET_KEY env var or configure in Admin → Payment Setup)");
      return NextResponse.redirect(new URL("/pricing?error=payment_unavailable", req.url));
    }

    if (!stripeConfig.priceId) {
      console.error("Stripe price ID not configured (set STRIPE_PREMIUM_PRICE_ID env var or configure in Admin → Payment Setup)");
      return NextResponse.redirect(new URL("/pricing?error=payment_unavailable", req.url));
    }

    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan") || "monthly";
    const priceId = plan === "annual" && stripeConfig.annualPriceId
      ? stripeConfig.annualPriceId
      : stripeConfig.priceId;

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
      },
      success_url: `${origin}/billing?success=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.redirect(new URL("/pricing?error=checkout_failed", req.url));
    }

    return NextResponse.redirect(checkoutSession.url, { status: 303 });
  } catch (error) {
    console.error("POST /api/checkout error:", error);
    return NextResponse.redirect(new URL("/pricing?error=checkout_failed", req.url));
  }
}
