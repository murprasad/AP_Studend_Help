/**
 * Site-wide feature flags and settings stored in the database.
 * Values are cached in-process for 30 seconds to minimize DB reads.
 */
import { prisma } from "./prisma";

const CACHE = new Map<string, { value: string; exp: number }>();
const TTL_MS = 30_000;

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const cached = CACHE.get(key);
  if (cached && cached.exp > Date.now()) return cached.value;

  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    const value = row?.value ?? fallback;
    CACHE.set(key, { value, exp: Date.now() + TTL_MS });
    return value;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: string, updatedBy?: string): Promise<void> {
  CACHE.delete(key);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, updatedBy },
    update: { value, updatedBy },
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

/** Returns true if the payments/Stripe feature is enabled. Defaults to true. */
export async function isPaymentsEnabled(): Promise<boolean> {
  const val = await getSetting("payments_enabled", "true");
  return val === "true";
}

/** Returns true if the daily AI limit feature is enabled. Defaults to true. */
export async function isAiLimitEnabled(): Promise<boolean> {
  const val = await getSetting("ai_limit_enabled", "true");
  return val === "true";
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceId: string;
  publishableKey: string;
  premiumPriceDisplay: string;
  premiumName: string;
}

/**
 * Returns Stripe configuration values.
 * Env vars take precedence over DB settings so CF Pages secrets override admin UI values.
 */
export async function getStripeConfig(): Promise<StripeConfig> {
  const [secretKey, webhookSecret, priceId, publishableKey, premiumPriceDisplay, premiumName] =
    await Promise.all([
      getSetting("stripe_secret_key", ""),
      getSetting("stripe_webhook_secret", ""),
      getSetting("stripe_premium_price_id", ""),
      getSetting("stripe_publishable_key", ""),
      getSetting("stripe_premium_price_display", "9.99"),
      getSetting("stripe_premium_name", "Premium"),
    ]);

  return {
    secretKey: process.env.STRIPE_SECRET_KEY || secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || webhookSecret,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || priceId,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || publishableKey,
    premiumPriceDisplay,
    premiumName,
  };
}

// Re-export from the pure-constants file so server code can use one import
export { FEATURE_FLAG_DEFS, type FeatureFlagKey } from "./feature-flag-defs";
