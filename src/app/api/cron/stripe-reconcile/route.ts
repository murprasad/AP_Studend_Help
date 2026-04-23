/**
 * GET /api/cron/stripe-reconcile
 *
 * Catches webhook failures by reconciling Stripe's source-of-truth
 * (active subscriptions) against our DB (`User.subscriptionTier`).
 * Built 2026-04-23 after a real paying user (Srinidhi Saravanan) had
 * a successful Stripe checkout but our webhook didn't fire — account
 * stayed FREE for 24+ hours until they emailed support.
 *
 * Logic per Stripe active subscription:
 *   1. Look up our user by Stripe customer email
 *   2. If user found AND user.subscriptionTier == FREE → reconcile
 *      (flip tier + upsert ModuleSubscription + send notification)
 *   3. If no user found → log (probably a different signup email)
 *
 * Bearer auth via CRON_SECRET. External scheduler (cron-job.org or
 * GH Actions) hits this hourly.
 *
 * Returns a JSON summary of what was found + reconciled.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeConfig } from "@/lib/settings";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

interface Reconciliation {
  email: string;
  userId: string;
  stripeSubscriptionId: string;
  module: string;
  action: "flipped_to_premium";
  periodEnd: string;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeConfig = await getStripeConfig();
  if (!stripeConfig.secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeConfig.secretKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const startedAt = Date.now();
  const reconciled: Reconciliation[] = [];
  const orphans: Array<{ email: string; stripeSubscriptionId: string }> = [];
  let totalChecked = 0;

  try {
    // Page through active subscriptions. Stripe paginates 100 at a time;
    // most apps have well under 1000 active subs, so 5 pages is safe.
    let startingAfter: string | undefined;
    for (let page = 0; page < 5; page++) {
      const subs = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        expand: ["data.customer"],
      });

      for (const sub of subs.data) {
        totalChecked++;
        const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer | null;
        if (!customer) continue;
        if ("deleted" in customer && customer.deleted) continue;
        const email = (customer as Stripe.Customer).email;
        if (!email) continue;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, subscriptionTier: true, track: true },
        });

        if (!user) {
          orphans.push({ email, stripeSubscriptionId: sub.id });
          continue;
        }

        if (user.subscriptionTier !== "FREE") {
          continue; // already premium — nothing to do
        }

        // Reconcile.
        const module = (sub.metadata?.module as string) || (user.track === "clep" ? "clep" : "ap");
        const tierMap: Record<string, "AP_PREMIUM" | "SAT_PREMIUM" | "ACT_PREMIUM" | "CLEP_PREMIUM" | "DSST_PREMIUM"> = {
          ap: "AP_PREMIUM", sat: "SAT_PREMIUM", act: "ACT_PREMIUM",
          clep: "CLEP_PREMIUM", dsst: "DSST_PREMIUM",
        };
        const periodEnd = new Date(sub.current_period_end * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: tierMap[module] ?? "AP_PREMIUM",
            stripeSubscriptionId: sub.id,
            stripeCurrentPeriodEnd: periodEnd,
            stripeSubscriptionStatus: sub.status,
          },
        });
        await prisma.moduleSubscription.upsert({
          where: { userId_module: { userId: user.id, module } },
          create: {
            userId: user.id, module, status: "active",
            stripeSubscriptionId: sub.id,
            stripeCurrentPeriodEnd: periodEnd,
          },
          update: {
            status: "active",
            stripeSubscriptionId: sub.id,
            stripeCurrentPeriodEnd: periodEnd,
          },
        });

        reconciled.push({
          email: user.email,
          userId: user.id,
          stripeSubscriptionId: sub.id,
          module,
          action: "flipped_to_premium",
          periodEnd: periodEnd.toISOString(),
        });
      }

      if (!subs.has_more) break;
      startingAfter = subs.data[subs.data.length - 1]?.id;
    }
  } catch (e) {
    console.error("[/api/cron/stripe-reconcile] error:", e);
    return NextResponse.json({ error: "Stripe error", message: String(e) }, { status: 500 });
  }

  // Email contact@ ONLY when something was reconciled (don't spam on
  // every successful no-op run).
  if (reconciled.length > 0) {
    const lines = [
      `Stripe reconciliation flipped ${reconciled.length} user(s) from FREE → PREMIUM:`,
      "",
      ...reconciled.map((r) => `  ${r.email} (${r.module}) — sub ${r.stripeSubscriptionId} until ${r.periodEnd.slice(0, 10)}`),
      "",
      "These were paying users whose webhook delivery failed. Investigate the webhook delivery log around their checkout time.",
    ].join("\n");
    const html = `<pre style="font-family:ui-monospace,monospace;font-size:13px;">${lines.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
    sendEmail(
      "contact@studentnest.ai",
      `[StudentNest] Stripe reconcile flipped ${reconciled.length} user(s)`,
      html,
    ).catch(() => { /* email best-effort */ });
  }

  return NextResponse.json({
    checked: totalChecked,
    reconciled: reconciled.length,
    orphans: orphans.length,
    durationMs: Date.now() - startedAt,
    detail: { reconciled, orphans },
  });
}
