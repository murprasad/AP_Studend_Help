#!/usr/bin/env node
// Diagnose Stripe webhook failures.
// Pulls our webhook endpoint config + recent events to figure out why
// deliveries are returning 500.
import "dotenv/config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Endpoints
const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
console.log(`Found ${endpoints.data.length} webhook endpoints:\n`);
for (const ep of endpoints.data) {
  console.log(`  ${ep.id}`);
  console.log(`    url:           ${ep.url}`);
  console.log(`    status:        ${ep.status}`);
  console.log(`    api_version:   ${ep.api_version || "(account default — DANGER)"}`);
  console.log(`    enabled events: ${ep.enabled_events.length} (${ep.enabled_events.slice(0, 5).join(", ")}${ep.enabled_events.length > 5 ? ", ..." : ""})`);
  console.log();
}

const ourEp = endpoints.data.find((e) => e.url.includes("studentnest"));
if (!ourEp) {
  console.log("❌ Could not find studentnest webhook endpoint.");
  process.exit(0);
}

// Recent events — show api_version for each so we can confirm which version is firing
console.log(`\n── Recent 20 events (any type, sender's API version) ──\n`);
const events = await stripe.events.list({ limit: 20 });
for (const evt of events.data) {
  console.log(`  ${new Date(evt.created * 1000).toISOString()}  ${evt.type.padEnd(36)}  api_version=${evt.api_version}  id=${evt.id}`);
}

// For one recent subscription event, dump the structure to see whether
// current_period_end is at root or moved to items.data[].
const subEvt = events.data.find(
  (e) => e.type === "customer.subscription.created" || e.type === "customer.subscription.updated",
);
if (subEvt) {
  console.log(`\n── Sample subscription event payload (api_version=${subEvt.api_version}) ──\n`);
  const sub = subEvt.data.object;
  console.log(`  id: ${sub.id}`);
  console.log(`  status: ${sub.status}`);
  console.log(`  current_period_end (ROOT): ${sub.current_period_end ?? "(undefined!)"}`);
  console.log(`  current_period_start (ROOT): ${sub.current_period_start ?? "(undefined!)"}`);
  if (sub.items?.data?.length) {
    console.log(`  items.data[0].current_period_end: ${sub.items.data[0].current_period_end ?? "(undefined)"}`);
    console.log(`  items.data[0].current_period_start: ${sub.items.data[0].current_period_start ?? "(undefined)"}`);
  }
}

// For the most recent checkout.session.completed, show api_version + key fields
const csEvt = events.data.find((e) => e.type === "checkout.session.completed");
if (csEvt) {
  console.log(`\n── Sample checkout.session.completed (api_version=${csEvt.api_version}) ──\n`);
  const cs = csEvt.data.object;
  console.log(`  id: ${cs.id}`);
  console.log(`  mode: ${cs.mode}`);
  console.log(`  client_reference_id: ${cs.client_reference_id ?? "(none)"}`);
  console.log(`  metadata: ${JSON.stringify(cs.metadata)}`);
  console.log(`  customer_email: ${cs.customer_email ?? "(none)"}`);
  console.log(`  customer_details.email: ${cs.customer_details?.email ?? "(none)"}`);
}
