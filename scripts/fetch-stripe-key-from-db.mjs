#!/usr/bin/env node
// Fetch the Stripe secret key from the SiteSetting table (production
// stores it there). Used to enable local diagnosis of webhook failures.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const row = await prisma.siteSetting.findUnique({ where: { key: "stripe_secret_key" } });
const wh = await prisma.siteSetting.findUnique({ where: { key: "stripe_webhook_secret" } });
console.log("STRIPE_SECRET_KEY=" + (row?.value || ""));
console.log("STRIPE_WEBHOOK_SECRET=" + (wh?.value || ""));
console.log("# (paste these into a temporary export before running diagnostics)");
