#!/usr/bin/env node
// Debug helper: seed test user with spread=45 impressions, then query
// the auto-launch-check API using the test user's forged JWT. Prints
// the exact API response so we can see why shouldNudge is false.

import "dotenv/config";

const CRON_SECRET = process.env.CRON_SECRET;
const BASE = process.env.E2E_BASE_URL ?? "https://studentnest.ai";

// Step 1 — seed 2 impressions with 45-min spread.
const seedRes = await fetch(`${BASE}/api/test/auth`, {
  method: "POST",
  headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
  body: JSON.stringify({ action: "seed-dashboard-impressions", count: 2, clearFirst: true, spreadMinutes: 45, course: "AP_WORLD_HISTORY" }),
});
const seed = await seedRes.json();
console.log("SEED:", seed);

// Step 2 — get a JWT for the test user.
const authRes = await fetch(`${BASE}/api/test/auth`, {
  method: "POST",
  headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
  body: JSON.stringify({ action: "create" }),
});
const auth = await authRes.json();
console.log("\nAUTH:", { userId: auth.userId, cookieName: auth.cookieName });

// Step 3 — query /api/auto-launch-check with the forged cookie.
const checkRes = await fetch(`${BASE}/api/auto-launch-check`, {
  headers: { Cookie: `${auth.cookieName}=${auth.sessionToken}` },
});
const check = await checkRes.json();
console.log("\nAUTO-LAUNCH-CHECK:", check);
