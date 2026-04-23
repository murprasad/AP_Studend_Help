#!/usr/bin/env node
// Synthetic Stripe webhook event test.
// Fires properly-signed fake events at the live /api/webhooks/stripe
// endpoint and asserts our handler returns 200 + (when relevant) updates
// the test user's DB record.
//
// Why: the user paid $19.98 in real money to discover this bug. This test
// would have caught it without any real money changing hands.
//
// Requires: STRIPE_WEBHOOK_SECRET in env (or fetched from SiteSetting).
// Usage: node scripts/test-webhook-synthetic.mjs
import "dotenv/config";
import Stripe from "stripe";
import { makePrisma } from "./_prisma-http.mjs";

const BASE = process.env.SMOKE_BASE_URL || "https://studentnest.ai";
const prisma = makePrisma();

// Pull webhook secret from SiteSetting (where production stores it)
const wh = await prisma.siteSetting.findUnique({ where: { key: "stripe_webhook_secret" } });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || wh?.value;
if (!WEBHOOK_SECRET) {
  console.error("❌ No STRIPE_WEBHOOK_SECRET in env or SiteSetting. Aborting.");
  process.exit(1);
}

// Stripe SDK only used for signature generation — no live API calls
const stripe = new Stripe("sk_test_dummy", { apiVersion: "2024-06-20" });

// ── Test fixture user ────────────────────────────────────────────────
// Use the existing E2E test user for isolation.
const TEST_EMAIL = "murprasad+webhook-synthetic@gmail.com";
const TEST_USER_ID = "synthetic_test_user_" + Date.now();

// Create or upsert (idempotent)
const before = await prisma.user.upsert({
  where: { email: TEST_EMAIL },
  update: { subscriptionTier: "FREE", stripeSubscriptionId: null, stripeCurrentPeriodEnd: null, stripeSubscriptionStatus: null },
  create: {
    email: TEST_EMAIL,
    firstName: "Webhook",
    lastName: "SyntheticTest",
    passwordHash: "$2a$12$dummy",
    emailVerified: new Date(),
    role: "STUDENT",
    subscriptionTier: "FREE",
    track: "ap",
    gradeLevel: "11",
  },
  select: { id: true, subscriptionTier: true },
});
console.log(`✓ Reset fixture user: ${TEST_EMAIL} (id=${before.id}, tier=${before.subscriptionTier})`);
// Clean any existing module subs
await prisma.moduleSubscription.deleteMany({ where: { userId: before.id } });

let passed = 0;
let failed = 0;

function check(label, ok, detail) {
  console.log(`${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  if (ok) passed++; else failed++;
  return ok;
}

async function fireEvent(name, payloadObject) {
  const eventBody = JSON.stringify(payloadObject);
  const sig = stripe.webhooks.generateTestHeaderString({
    payload: eventBody,
    secret: WEBHOOK_SECRET,
  });
  const res = await fetch(`${BASE}/api/webhooks/stripe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body: eventBody,
  });
  const body = await res.text().catch(() => "");
  return { status: res.status, body, name };
}

// ── TEST 1: checkout.session.completed with client_reference_id ──────
console.log("\n── Test 1: checkout.session.completed (with client_reference_id) ──");
const t1 = await fireEvent("checkout.session.completed", {
  id: "evt_synth_t1_" + Date.now(),
  type: "checkout.session.completed",
  api_version: "2026-02-22",
  data: {
    object: {
      id: "cs_synth_t1",
      mode: "subscription",
      client_reference_id: `${before.id}::ap`,
      customer: "cus_synth_t1",
      customer_email: TEST_EMAIL,
      customer_details: { email: TEST_EMAIL },
      amount_total: 999,
      metadata: {},
    },
  },
});
check(`POST returns 200 (got ${t1.status})`, t1.status === 200, t1.body.slice(0, 100));
const after1 = await prisma.user.findUnique({ where: { id: before.id }, select: { subscriptionTier: true } });
check(`User flipped to PREMIUM (got ${after1?.subscriptionTier})`, after1?.subscriptionTier !== "FREE");

// Reset for next test
await prisma.user.update({ where: { id: before.id }, data: { subscriptionTier: "FREE" } });
await prisma.moduleSubscription.deleteMany({ where: { userId: before.id } });

// ── TEST 2: checkout.session.completed WITHOUT client_reference_id ──
//    (Email fallback path — the actual bug we're shipping a fix for)
console.log("\n── Test 2: checkout.session.completed (NO client_reference_id, email fallback) ──");
const t2 = await fireEvent("checkout.session.completed", {
  id: "evt_synth_t2_" + Date.now(),
  type: "checkout.session.completed",
  api_version: "2026-02-22",
  data: {
    object: {
      id: "cs_synth_t2",
      mode: "subscription",
      client_reference_id: null, // <-- this is the failure mode that bit us
      customer: "cus_synth_t2",
      customer_email: TEST_EMAIL,
      customer_details: { email: TEST_EMAIL },
      amount_total: 999,
      metadata: {},
    },
  },
});
check(`POST returns 200 (got ${t2.status})`, t2.status === 200, t2.body.slice(0, 100));
const after2 = await prisma.user.findUnique({ where: { id: before.id }, select: { subscriptionTier: true } });
check(`User flipped to PREMIUM via email fallback (got ${after2?.subscriptionTier})`, after2?.subscriptionTier !== "FREE");

// Reset
await prisma.user.update({ where: { id: before.id }, data: { subscriptionTier: "FREE" } });
await prisma.moduleSubscription.deleteMany({ where: { userId: before.id } });

// ── TEST 3: customer.subscription.updated with NEW API field shape ──
//    (current_period_end on items.data[], not root)
console.log("\n── Test 3: customer.subscription.updated (API ≥ 2025-09-30 shape) ──");
const futureTs = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
const t3 = await fireEvent("customer.subscription.updated", {
  id: "evt_synth_t3_" + Date.now(),
  type: "customer.subscription.updated",
  api_version: "2026-02-22",
  data: {
    object: {
      id: "sub_synth_t3",
      status: "active",
      cancel_at_period_end: false,
      customer: "cus_synth_t3",
      // current_period_end MISSING from root (new API behavior)
      items: {
        data: [{ id: "si_synth_t3", current_period_end: futureTs }],
      },
      metadata: { userId: before.id, module: "ap" },
    },
  },
});
check(`POST returns 200 (got ${t3.status})`, t3.status === 200, t3.body.slice(0, 100));
const after3 = await prisma.user.findUnique({
  where: { id: before.id },
  select: { subscriptionTier: true, stripeCurrentPeriodEnd: true },
});
check(`User flipped to PREMIUM (got ${after3?.subscriptionTier})`, after3?.subscriptionTier !== "FREE");
check(
  `stripeCurrentPeriodEnd populated from items.data[0] (got ${after3?.stripeCurrentPeriodEnd?.toISOString() ?? "null"})`,
  after3?.stripeCurrentPeriodEnd !== null && after3?.stripeCurrentPeriodEnd !== undefined,
);

// Reset
await prisma.user.update({ where: { id: before.id }, data: { subscriptionTier: "FREE", stripeCurrentPeriodEnd: null } });
await prisma.moduleSubscription.deleteMany({ where: { userId: before.id } });

// ── TEST 4: Bad signature should be rejected ─────────────────────────
console.log("\n── Test 4: Bad signature returns 400 ──");
const badRes = await fetch(`${BASE}/api/webhooks/stripe`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "stripe-signature": "t=1,v1=fake" },
  body: JSON.stringify({ type: "checkout.session.completed" }),
});
check(`Bad sig returns 400 (got ${badRes.status})`, badRes.status === 400);

// ── TEST 5: customer.subscription.deleted downgrades to FREE ─────────
console.log("\n── Test 5: customer.subscription.deleted downgrades user ──");
// First flip to premium
await prisma.user.update({
  where: { id: before.id },
  data: { subscriptionTier: "AP_PREMIUM", stripeSubscriptionId: "sub_synth_t5", stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
});
const t5 = await fireEvent("customer.subscription.deleted", {
  id: "evt_synth_t5_" + Date.now(),
  type: "customer.subscription.deleted",
  api_version: "2026-02-22",
  data: {
    object: {
      id: "sub_synth_t5",
      status: "canceled",
      customer: "cus_synth_t5",
      items: { data: [{ current_period_end: futureTs }] },
      metadata: { userId: before.id, module: "ap" },
    },
  },
});
check(`POST returns 200 (got ${t5.status})`, t5.status === 200);
const after5 = await prisma.user.findUnique({ where: { id: before.id }, select: { subscriptionTier: true } });
check(`User downgraded to FREE (got ${after5?.subscriptionTier})`, after5?.subscriptionTier === "FREE");

// ── Cleanup fixture ──────────────────────────────────────────────────
await prisma.moduleSubscription.deleteMany({ where: { userId: before.id } });
await prisma.user.delete({ where: { id: before.id } });
console.log(`\n✓ Cleaned up fixture user`);

console.log(`\n${"═".repeat(50)}`);
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
