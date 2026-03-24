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

/** Returns true if CLEP courses are enabled. Defaults to false. */
export async function isClepEnabled(): Promise<boolean> {
  const val = await getSetting("clep_enabled", "false");
  return val === "true";
}

/** Returns true if DSST courses are enabled. Defaults to false. */
export async function isDsstEnabled(): Promise<boolean> {
  const val = await getSetting("dsst_enabled", "false");
  return val === "true";
}

/** Returns true if the Analytics page is enabled. Defaults to true. */
export async function isAnalyticsEnabled(): Promise<boolean> {
  return (await getSetting("analytics_enabled", "true")) === "true";
}

/** Returns true if the Study Plan page is enabled. Defaults to true. */
export async function isStudyPlanEnabled(): Promise<boolean> {
  return (await getSetting("study_plan_enabled", "true")) === "true";
}

/**
 * Returns true if premium feature restrictions are enforced.
 * When false (default), all users have full access regardless of subscription tier.
 * Use this flag to test premium features without requiring a paid subscription.
 */
export async function isPremiumRestrictionEnabled(): Promise<boolean> {
  const val = await getSetting("premium_feature_restriction", "false");
  return val === "true";
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceId: string;
  annualPriceId: string;
  publishableKey: string;
  premiumPriceDisplay: string;
  premiumAnnualPriceDisplay: string;
  premiumName: string;
  paymentLinkMonthly: string;
  paymentLinkAnnual: string;
  // Per-module Stripe config (CLEP, SAT, ACT — AP uses the base priceId/annualPriceId)
  clepPriceId: string;
  clepAnnualPriceId: string;
  clepPaymentLinkMonthly: string;
  clepPaymentLinkAnnual: string;
  satPriceId: string;
  satAnnualPriceId: string;
  satPaymentLinkMonthly: string;
  satPaymentLinkAnnual: string;
  actPriceId: string;
  actAnnualPriceId: string;
  actPaymentLinkMonthly: string;
  actPaymentLinkAnnual: string;
  dsstPriceId: string;
  dsstAnnualPriceId: string;
  dsstPaymentLinkMonthly: string;
  dsstPaymentLinkAnnual: string;
}

/**
 * Returns Stripe configuration values.
 * Env vars take precedence over DB settings so CF Pages secrets override admin UI values.
 */
export async function getStripeConfig(): Promise<StripeConfig> {
  const [secretKey, webhookSecret, priceId, annualPriceId, publishableKey, premiumPriceDisplay, premiumAnnualPriceDisplay, premiumName, paymentLinkMonthly, paymentLinkAnnual, clepPriceId, clepAnnualPriceId, clepPaymentLinkMonthly, clepPaymentLinkAnnual, satPriceId, satAnnualPriceId, satPaymentLinkMonthly, satPaymentLinkAnnual, actPriceId, actAnnualPriceId, actPaymentLinkMonthly, actPaymentLinkAnnual, dsstPriceId, dsstAnnualPriceId, dsstPaymentLinkMonthly, dsstPaymentLinkAnnual] =
    await Promise.all([
      getSetting("stripe_secret_key", ""),
      getSetting("stripe_webhook_secret", ""),
      getSetting("stripe_premium_price_id", ""),
      getSetting("stripe_annual_price_id", ""),
      getSetting("stripe_publishable_key", ""),
      getSetting("stripe_premium_price_display", "9.99"),
      getSetting("stripe_annual_price_display", "79.99"),
      getSetting("stripe_premium_name", "Premium"),
      getSetting("stripe_payment_link_monthly", ""),
      getSetting("stripe_payment_link_annual", ""),
      getSetting("stripe_clep_premium_price_id", ""),
      getSetting("stripe_clep_annual_price_id", ""),
      getSetting("stripe_clep_payment_link_monthly", ""),
      getSetting("stripe_clep_payment_link_annual", ""),
      getSetting("stripe_sat_premium_price_id", ""),
      getSetting("stripe_sat_annual_price_id", ""),
      getSetting("stripe_sat_payment_link_monthly", ""),
      getSetting("stripe_sat_payment_link_annual", ""),
      getSetting("stripe_act_premium_price_id", ""),
      getSetting("stripe_act_annual_price_id", ""),
      getSetting("stripe_act_payment_link_monthly", ""),
      getSetting("stripe_act_payment_link_annual", ""),
      getSetting("stripe_dsst_premium_price_id", ""),
      getSetting("stripe_dsst_annual_price_id", ""),
      getSetting("stripe_dsst_payment_link_monthly", ""),
      getSetting("stripe_dsst_payment_link_annual", ""),
    ]);

  return {
    secretKey: process.env.STRIPE_SECRET_KEY || secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || webhookSecret,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || priceId,
    annualPriceId: process.env.STRIPE_ANNUAL_PRICE_ID || annualPriceId,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || publishableKey,
    premiumPriceDisplay,
    premiumAnnualPriceDisplay,
    premiumName,
    paymentLinkMonthly: process.env.STRIPE_PAYMENT_LINK_MONTHLY || paymentLinkMonthly,
    paymentLinkAnnual: process.env.STRIPE_PAYMENT_LINK_ANNUAL || paymentLinkAnnual,
    clepPriceId: process.env.STRIPE_CLEP_PREMIUM_PRICE_ID || clepPriceId,
    clepAnnualPriceId: process.env.STRIPE_CLEP_ANNUAL_PRICE_ID || clepAnnualPriceId,
    clepPaymentLinkMonthly: process.env.STRIPE_CLEP_PAYMENT_LINK_MONTHLY || clepPaymentLinkMonthly,
    clepPaymentLinkAnnual: process.env.STRIPE_CLEP_PAYMENT_LINK_ANNUAL || clepPaymentLinkAnnual,
    satPriceId: process.env.STRIPE_SAT_PREMIUM_PRICE_ID || satPriceId,
    satAnnualPriceId: process.env.STRIPE_SAT_ANNUAL_PRICE_ID || satAnnualPriceId,
    satPaymentLinkMonthly: process.env.STRIPE_SAT_PAYMENT_LINK_MONTHLY || satPaymentLinkMonthly,
    satPaymentLinkAnnual: process.env.STRIPE_SAT_PAYMENT_LINK_ANNUAL || satPaymentLinkAnnual,
    actPriceId: process.env.STRIPE_ACT_PREMIUM_PRICE_ID || actPriceId,
    actAnnualPriceId: process.env.STRIPE_ACT_ANNUAL_PRICE_ID || actAnnualPriceId,
    actPaymentLinkMonthly: process.env.STRIPE_ACT_PAYMENT_LINK_MONTHLY || actPaymentLinkMonthly,
    actPaymentLinkAnnual: process.env.STRIPE_ACT_PAYMENT_LINK_ANNUAL || actPaymentLinkAnnual,
    dsstPriceId: process.env.STRIPE_DSST_PREMIUM_PRICE_ID || dsstPriceId,
    dsstAnnualPriceId: process.env.STRIPE_DSST_ANNUAL_PRICE_ID || dsstAnnualPriceId,
    dsstPaymentLinkMonthly: process.env.STRIPE_DSST_PAYMENT_LINK_MONTHLY || dsstPaymentLinkMonthly,
    dsstPaymentLinkAnnual: process.env.STRIPE_DSST_PAYMENT_LINK_ANNUAL || dsstPaymentLinkAnnual,
  };
}

// Re-export from the pure-constants file so server code can use one import
export { FEATURE_FLAG_DEFS, type FeatureFlagKey } from "./feature-flag-defs";
