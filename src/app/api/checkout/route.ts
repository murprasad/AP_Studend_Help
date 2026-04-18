import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { isPaymentsEnabled, getStripeConfig, type StripeConfig } from "@/lib/settings";

/** Get Stripe payment link and price ID for a given module. */
function getModuleStripeConfig(cfg: StripeConfig, module: string, plan: string) {
  const isAnnual = plan === "annual";
  switch (module) {
    case "sat":
      return {
        paymentLink: isAnnual ? cfg.satPaymentLinkAnnual : cfg.satPaymentLinkMonthly,
        priceId: isAnnual ? (cfg.satAnnualPriceId || cfg.satPriceId) : cfg.satPriceId,
      };
    case "act":
      return {
        paymentLink: isAnnual ? cfg.actPaymentLinkAnnual : cfg.actPaymentLinkMonthly,
        priceId: isAnnual ? (cfg.actAnnualPriceId || cfg.actPriceId) : cfg.actPriceId,
      };
    case "clep":
      return {
        paymentLink: isAnnual ? cfg.clepPaymentLinkAnnual : cfg.clepPaymentLinkMonthly,
        priceId: isAnnual ? (cfg.clepAnnualPriceId || cfg.clepPriceId) : cfg.clepPriceId,
      };
    case "dsst":
      return {
        paymentLink: isAnnual ? cfg.dsstPaymentLinkAnnual : cfg.dsstPaymentLinkMonthly,
        priceId: isAnnual ? (cfg.dsstAnnualPriceId || cfg.dsstPriceId) : cfg.dsstPriceId,
      };
    default: // "ap"
      return {
        paymentLink: isAnnual ? cfg.paymentLinkAnnual : cfg.paymentLinkMonthly,
        priceId: isAnnual ? (cfg.annualPriceId || cfg.priceId) : cfg.priceId,
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.redirect(new URL("/register?next=/pricing", req.url));
    }

    if (!(await isPaymentsEnabled())) {
      return NextResponse.redirect(new URL("/pricing?error=payments_disabled", req.url));
    }

    const stripeConfig = await getStripeConfig();

    if (!stripeConfig.secretKey) {
      console.error("Stripe secret key not configured");
      return NextResponse.redirect(new URL("/pricing?error=payment_unavailable", req.url));
    }

    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan") || "monthly";
    // Support both ?module= (new) and ?track= (legacy)
    const module = searchParams.get("module") || searchParams.get("track") || (session.user.track ?? "ap");

    const { paymentLink, priceId } = getModuleStripeConfig(stripeConfig, module, plan);

    // Payment Link path (preferred — avoids CF Workers issues)
    // Encode module into client_reference_id since payment links don't support custom metadata via URL.
    // Format: "userId::module" — webhook parses this to extract both.
    if (paymentLink) {
      const url = new URL(paymentLink);
      url.searchParams.set("client_reference_id", `${session.user.id}::${module}`);
      if (session.user.email) url.searchParams.set("prefilled_email", session.user.email);
      return NextResponse.redirect(url.toString(), { status: 303 });
    }

    // Fallback: server-side checkout session
    if (!priceId) {
      console.error(`Stripe price ID not configured for ${module} module`);
      return NextResponse.redirect(new URL("/pricing?error=payment_unavailable", req.url));
    }

    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        module: module,
        // Legacy compat
        track: module,
      },
      success_url: `${origin}/billing?success=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId: session.user.id,
          module: module,
          track: module,
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.redirect(new URL("/pricing?error=checkout_failed", req.url));
    }

    return NextResponse.redirect(checkoutSession.url, { status: 303 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/checkout error:", errMsg, error);
    // Don't leak internal error text into URL query.
    return NextResponse.redirect(new URL("/pricing?error=checkout_failed", req.url));
  }
}
