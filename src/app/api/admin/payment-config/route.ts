import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSetting, setSetting, getStripeConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized", status: 401 };
  if (session.user.role !== "ADMIN") return { error: "Forbidden", status: 403 };
  return { session };
}

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••••••" + value.slice(-4);
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const config = await getStripeConfig();
  const paymentsEnabled = (await getSetting("payments_enabled", "true")) === "true";

  // Return masked secrets so the UI can show "configured" status without leaking values
  return NextResponse.json({
    paymentsEnabled,
    stripeConfig: {
      secretKey: !!config.secretKey,
      webhookSecret: !!config.webhookSecret,
      priceId: !!config.priceId,
      annualPriceId: !!config.annualPriceId,
      publishableKey: !!config.publishableKey,
    },
    // Masked previews for the form placeholders
    masked: {
      secretKey: maskSecret(config.secretKey),
      webhookSecret: maskSecret(config.webhookSecret),
      priceId: maskSecret(config.priceId),
      annualPriceId: maskSecret(config.annualPriceId),
      publishableKey: maskSecret(config.publishableKey),
    },
    pricing: {
      premiumPriceDisplay: config.premiumPriceDisplay,
      premiumAnnualPriceDisplay: config.premiumAnnualPriceDisplay,
      premiumName: config.premiumName,
    },
    // Let the UI know if the value comes from env (read-only in admin UI)
    fromEnv: {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      priceId: !!process.env.STRIPE_PREMIUM_PRICE_ID,
      annualPriceId: !!process.env.STRIPE_ANNUAL_PRICE_ID,
      publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json() as {
    secretKey?: string;
    webhookSecret?: string;
    priceId?: string;
    annualPriceId?: string;
    publishableKey?: string;
    premiumPriceDisplay?: string;
    premiumAnnualPriceDisplay?: string;
    premiumName?: string;
  };

  const adminId = auth.session!.user.id;
  const updates: Promise<void>[] = [];

  if (body.secretKey !== undefined && body.secretKey !== "") {
    updates.push(setSetting("stripe_secret_key", body.secretKey, adminId));
  }
  if (body.webhookSecret !== undefined && body.webhookSecret !== "") {
    updates.push(setSetting("stripe_webhook_secret", body.webhookSecret, adminId));
  }
  if (body.priceId !== undefined && body.priceId !== "") {
    updates.push(setSetting("stripe_premium_price_id", body.priceId, adminId));
  }
  if (body.annualPriceId !== undefined && body.annualPriceId !== "") {
    updates.push(setSetting("stripe_annual_price_id", body.annualPriceId, adminId));
  }
  if (body.publishableKey !== undefined && body.publishableKey !== "") {
    updates.push(setSetting("stripe_publishable_key", body.publishableKey, adminId));
  }
  if (body.premiumPriceDisplay !== undefined) {
    updates.push(setSetting("stripe_premium_price_display", body.premiumPriceDisplay, adminId));
  }
  if (body.premiumAnnualPriceDisplay !== undefined) {
    updates.push(setSetting("stripe_annual_price_display", body.premiumAnnualPriceDisplay, adminId));
  }
  if (body.premiumName !== undefined && body.premiumName.trim() !== "") {
    updates.push(setSetting("stripe_premium_name", body.premiumName.trim(), adminId));
  }

  await Promise.all(updates);

  return NextResponse.json({ ok: true, updated: updates.length });
}
