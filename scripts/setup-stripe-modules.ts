/**
 * Setup Stripe products and prices for per-module subscriptions.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/setup-stripe-modules.ts
 *
 * This script creates 4 products (AP, SAT, ACT, CLEP) with monthly + annual prices each.
 * It outputs the env vars you need to set in Cloudflare Pages.
 *
 * Safe to run multiple times — it checks for existing products by name first.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("Error: Set STRIPE_SECRET_KEY env var first.");
  console.error("  STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/setup-stripe-modules.ts");
  process.exit(1);
}

const BASE_URL = "https://api.stripe.com/v1";

async function stripeRequest(endpoint: string, body?: Record<string, string>) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe API error: ${res.status} ${err}`);
  }
  return res.json();
}

interface Module {
  key: string;
  name: string;
  description: string;
  monthlyEnv: string;
  annualEnv: string;
}

const MODULES: Module[] = [
  {
    key: "ap",
    name: "AP Premium",
    description: "StudentNest AI — AP exam prep with unlimited AI tutoring, FRQ scoring, and personalized study plans.",
    monthlyEnv: "STRIPE_PREMIUM_PRICE_ID",
    annualEnv: "STRIPE_ANNUAL_PRICE_ID",
  },
  {
    key: "sat",
    name: "SAT Premium",
    description: "StudentNest AI — SAT prep with unlimited AI tutoring, weak-area targeting, and score tracking.",
    monthlyEnv: "STRIPE_SAT_PREMIUM_PRICE_ID",
    annualEnv: "STRIPE_SAT_ANNUAL_PRICE_ID",
  },
  {
    key: "act",
    name: "ACT Premium",
    description: "StudentNest AI — ACT prep for all 4 sections with unlimited AI tutoring and composite tracking.",
    monthlyEnv: "STRIPE_ACT_PREMIUM_PRICE_ID",
    annualEnv: "STRIPE_ACT_ANNUAL_PRICE_ID",
  },
  {
    key: "clep",
    name: "CLEP Premium",
    description: "StudentNest AI — CLEP exam prep for 6 exams. Earn college credit and save $1,200+ per exam.",
    monthlyEnv: "STRIPE_CLEP_PREMIUM_PRICE_ID",
    annualEnv: "STRIPE_CLEP_ANNUAL_PRICE_ID",
  },
];

async function findExistingProduct(name: string): Promise<string | null> {
  const data = await stripeRequest(`/products/search?query=name:'${encodeURIComponent(name)}'`);
  if (data.data?.length > 0) return data.data[0].id;
  return null;
}

async function createProduct(mod: Module): Promise<string> {
  const existing = await findExistingProduct(mod.name);
  if (existing) {
    console.log(`  ✓ Product "${mod.name}" already exists: ${existing}`);
    return existing;
  }

  const product = await stripeRequest("/products", {
    name: mod.name,
    description: mod.description,
    "metadata[module]": mod.key,
  });
  console.log(`  + Created product "${mod.name}": ${product.id}`);
  return product.id;
}

async function findExistingPrice(productId: string, intervalMonth: boolean): Promise<string | null> {
  const interval = intervalMonth ? "month" : "year";
  const data = await stripeRequest(`/prices?product=${productId}&active=true&limit=10`);
  for (const price of data.data || []) {
    if (price.recurring?.interval === interval) return price.id;
  }
  return null;
}

async function createPrice(productId: string, amount: number, interval: "month" | "year"): Promise<string> {
  const existing = await findExistingPrice(productId, interval === "month");
  if (existing) {
    console.log(`  ✓ ${interval}ly price already exists: ${existing}`);
    return existing;
  }

  const price = await stripeRequest("/prices", {
    product: productId,
    unit_amount: String(amount),
    currency: "usd",
    "recurring[interval]": interval,
  });
  console.log(`  + Created ${interval}ly price: ${price.id} ($${(amount / 100).toFixed(2)}/${interval})`);
  return price.id;
}

async function main() {
  console.log("Setting up Stripe products for StudentNest AI per-module subscriptions...\n");

  const envVars: Record<string, string> = {};

  for (const mod of MODULES) {
    console.log(`\n${mod.name} (${mod.key}):`);

    const productId = await createProduct(mod);
    const monthlyPriceId = await createPrice(productId, 999, "month");   // $9.99
    const annualPriceId = await createPrice(productId, 7999, "year");    // $79.99

    envVars[mod.monthlyEnv] = monthlyPriceId;
    envVars[mod.annualEnv] = annualPriceId;
  }

  console.log("\n" + "=".repeat(60));
  console.log("DONE! Set these env vars in Cloudflare Pages secrets:\n");
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`${key}=${value}`);
  }
  console.log("\n" + "=".repeat(60));
  console.log("\nAlso ensure these are set:");
  console.log("  STRIPE_SECRET_KEY=sk_live_...");
  console.log("  STRIPE_WEBHOOK_SECRET=whsec_...");
  console.log("  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
