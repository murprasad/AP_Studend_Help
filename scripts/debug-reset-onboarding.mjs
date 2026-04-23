#!/usr/bin/env node
import "dotenv/config";

const CRON_SECRET = process.env.CRON_SECRET;
const BASE = "https://studentnest.ai";

const resetRes = await fetch(`${BASE}/api/test/auth`, {
  method: "POST",
  headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
  body: JSON.stringify({ action: "reset-onboarding" }),
});
console.log("RESET STATUS:", resetRes.status);
const body = await resetRes.text();
console.log("RESET BODY:", body);
