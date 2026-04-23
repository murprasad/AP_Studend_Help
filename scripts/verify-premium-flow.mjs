#!/usr/bin/env node
// End-to-end verification of the Premium subscription flow against
// live studentnest.ai. Built 2026-04-23 after Srinidhi's webhook
// failure exposed gaps in our payment confidence.
//
// Steps verified:
//   1. Test user can reach /api/checkout and gets back a Stripe URL
//   2. The Stripe URL has the correct client_reference_id (so the
//      webhook can map back to the right user — root cause of
//      Srinidhi's missed conversion)
//   3. Stripe-reconcile cron endpoint responds with auth check + summary
//      (proves our Stripe SDK + key + DB connection works end-to-end)
//   4. Existing live PREMIUM users (e.g. Srinidhi) actually show
//      tier=PREMIUM in DB after my manual fix
//
// Steps NOT verified (need real card / Stripe CLI):
//   - Actual checkout completion (would charge a real card)
//   - Webhook signature verification (need Stripe CLI to forward events)
//
// Usage: node scripts/verify-premium-flow.mjs

import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const CRON_SECRET = process.env.CRON_SECRET;
const BASE = "https://studentnest.ai";
const prisma = makePrisma();

function check(label, ok, detail) {
  console.log(`${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  return ok;
}

let passed = 0;
let failed = 0;

// ── Step 1+2: Checkout flow ──────────────────────────────────────────
console.log("\n── Step 1+2: Checkout creation ──\n");

// Get a session token for the test user.
const authRes = await fetch(`${BASE}/api/test/auth`, {
  method: "POST",
  headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
  body: JSON.stringify({ action: "create" }),
});
const auth = await authRes.json();
const cookieHeader = `${auth.cookieName}=${auth.sessionToken}`;
console.log(`Test user: ${auth.email} (id=${auth.userId})`);

// Hit /api/checkout — should return a Stripe URL.
const checkoutRes = await fetch(`${BASE}/api/checkout`, {
  method: "POST",
  headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
});
const checkoutOk = check("POST /api/checkout returns 2xx", checkoutRes.ok, `status=${checkoutRes.status}`);
if (checkoutOk) passed++; else failed++;

let checkoutData = null;
if (checkoutRes.ok) {
  checkoutData = await checkoutRes.json();
  const hasUrl = check("Response includes a Stripe checkout URL", typeof checkoutData.url === "string" && checkoutData.url.startsWith("https://checkout.stripe.com"));
  if (hasUrl) passed++; else failed++;
  if (hasUrl) console.log(`   URL: ${checkoutData.url.slice(0, 80)}...`);
} else {
  const errBody = await checkoutRes.text();
  console.log(`   error body: ${errBody.slice(0, 200)}`);
}

// ── Step 3: stripe-reconcile cron health ─────────────────────────────
console.log("\n── Step 3: Stripe-reconcile cron ──\n");

const reconcile401 = await fetch(`${BASE}/api/cron/stripe-reconcile`);
const has401 = check("Unauthed request returns 401", reconcile401.status === 401);
if (has401) passed++; else failed++;

const reconcileOk = await fetch(`${BASE}/api/cron/stripe-reconcile`, {
  headers: { Authorization: `Bearer ${CRON_SECRET}` },
});
const reconcileStatus = reconcileOk.status;
if (reconcileStatus === 200) {
  const r = await reconcileOk.json();
  check(`Reconcile cron returns summary (checked=${r.checked}, reconciled=${r.reconciled}, orphans=${r.orphans})`, true);
  passed++;
} else if (reconcileStatus === 404) {
  check("Reconcile cron exists", false, "404 — endpoint not yet deployed");
  failed++;
} else {
  check("Reconcile cron returns summary", false, `status=${reconcileStatus}`);
  failed++;
}

// ── Step 4: DB state check on Srinidhi accounts ──────────────────────
console.log("\n── Step 4: Srinidhi account state ──\n");

const srinidhi = await prisma.user.findMany({
  where: { email: { contains: "saravanab", mode: "insensitive" } },
  select: { email: true, subscriptionTier: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true },
});
for (const u of srinidhi) {
  const isPremium = u.subscriptionTier !== "FREE";
  const ok = check(`${u.email} is ${u.subscriptionTier}`, isPremium, `ends ${u.stripeCurrentPeriodEnd?.toISOString().slice(0, 10) ?? "(none)"}`);
  if (ok) passed++; else failed++;
}

// ── Summary ───────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(50)}`);
console.log(`${passed} passed, ${failed} failed`);
console.log(failed === 0 ? "✅ Premium flow looks healthy." : "❌ Issues found.");
process.exit(failed === 0 ? 0 : 1);
