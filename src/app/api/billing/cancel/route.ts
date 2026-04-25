import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getStripeConfig } from "@/lib/settings";
import { isAnyPremium } from "@/lib/tiers";

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

    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module");

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, stripeSubscriptionId: true, subscriptionTier: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let subscriptionId: string | null = null;

    // Try ModuleSubscription first (new model)
    if (module) {
      const modSub = await prisma.moduleSubscription.findUnique({
        where: { userId_module: { userId: session.user.id, module } },
      });
      if (modSub?.stripeSubscriptionId) subscriptionId = modSub.stripeSubscriptionId;
    }

    // Fall back to legacy User.stripeSubscriptionId
    if (!subscriptionId) {
      if (!isAnyPremium(user.subscriptionTier)) {
        return NextResponse.json({ error: "No active subscription" }, { status: 400 });
      }
      subscriptionId = user.stripeSubscriptionId;
    }

    // Last resort: look up from Stripe via email
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

    // Beta 7.8 (2026-04-25): explicit error handling for DB writes after
    // Stripe succeeded. Previous code: ModuleSubscription.update was
    // wrapped in `try { ... } catch { /* ignore if not found */ }` which
    // also swallowed REAL errors, and User.update had no try/catch at
    // all — if either DB write failed silently after Stripe accepted the
    // cancellation, the user's UI stayed "active" while Stripe said
    // "canceling" → state divergence until the hourly stripe-reconcile
    // cron caught it (up to 60 min stale).
    //
    // New behavior:
    //   - ModuleSubscription.update: catch P2025 (record not found, the
    //     legitimate "ignore if not found" case) and continue. Other
    //     errors get logged + we return a 500 to the client so they
    //     know to retry. Reconcile cron is the safety net either way.
    //   - User.update: same pattern, with a Sentry-worthy log on failure.
    //   - Both updates run in parallel (Promise.allSettled) so a failure
    //     in one doesn't block the other.
    const dbWriteResults = await Promise.allSettled([
      module
        ? prisma.moduleSubscription.update({
            where: { userId_module: { userId: session.user.id, module } },
            data: { status: "canceling", stripeCurrentPeriodEnd: periodEnd },
          })
        : Promise.resolve(null),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripeCurrentPeriodEnd: periodEnd,
          stripeSubscriptionStatus: "canceling",
        },
      }),
    ]);

    const moduleSubResult = dbWriteResults[0];
    const userResult = dbWriteResults[1];

    // ModuleSubscription P2025 (not found) is non-fatal — legacy users
    // may not have a ModuleSubscription row yet. Other errors are real.
    if (moduleSubResult.status === "rejected") {
      const reason = moduleSubResult.reason as { code?: string; message?: string };
      if (reason?.code !== "P2025") {
        console.error(
          `[billing/cancel] ModuleSubscription update failed AFTER Stripe accepted cancellation. ` +
          `userId=${session.user.id} module=${module} subId=${subscriptionId} ` +
          `error=${reason?.message ?? String(moduleSubResult.reason)}`,
        );
        // Don't fail the request — User.update may have succeeded, and
        // reconcile cron will fix any drift. But surface the partial-fail
        // in the response so client can show a soft warning.
      }
    }

    if (userResult.status === "rejected") {
      const msg = userResult.reason instanceof Error
        ? userResult.reason.message
        : String(userResult.reason);
      console.error(
        `[billing/cancel] CRITICAL: User update failed AFTER Stripe accepted cancellation. ` +
        `userId=${session.user.id} subId=${subscriptionId} error=${msg}`,
      );
      // Surface as 500 so the client knows to retry. The hourly
      // stripe-reconcile cron will reconcile state within 60 min as the
      // safety net even if the client gives up.
      return NextResponse.json({
        error: "Subscription canceled with Stripe but local state failed to update. Please refresh in a minute or contact support.",
        partialSuccess: true,
        periodEnd: periodEnd.toISOString(),
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      periodEnd: periodEnd.toISOString(),
      message: "Subscription will cancel at the end of your billing period.",
      moduleSubSynced: moduleSubResult.status === "fulfilled",
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

    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module");

    let subscriptionId: string | null = null;

    // Try ModuleSubscription first if module specified
    if (module) {
      const modSub = await prisma.moduleSubscription.findUnique({
        where: { userId_module: { userId: session.user.id, module } },
      });
      if (modSub?.stripeSubscriptionId) subscriptionId = modSub.stripeSubscriptionId;
    }

    // Fall back to legacy User.stripeSubscriptionId
    if (!subscriptionId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeSubscriptionId: true },
      });
      subscriptionId = user?.stripeSubscriptionId ?? null;
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    const periodEnd = new Date(subscription.current_period_end * 1000);

    // Update ModuleSubscription if module specified
    if (module) {
      try {
        await prisma.moduleSubscription.update({
          where: { userId_module: { userId: session.user.id, module } },
          data: { status: "active", stripeCurrentPeriodEnd: periodEnd },
        });
      } catch { /* ignore if not found */ }
    }

    // Always update legacy User fields
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    return NextResponse.json({ success: true, message: "Subscription reactivated." });
  } catch (error) {
    console.error("DELETE /api/billing/cancel error:", error);
    return NextResponse.json({ error: "Could not reactivate subscription" }, { status: 500 });
  }
}
