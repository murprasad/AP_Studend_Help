#!/usr/bin/env node
/**
 * seed-red-courses.mjs
 * Directly seeds the 4 red courses by calling production auto-populate
 * with targeted course-aware retry logic.
 * Run: node scripts/seed-red-courses.mjs
 */

// Load .env
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = "https://studentnest.ai";
const TARGET_COURSES = ["AP_STATISTICS", "AP_CHEMISTRY", "AP_US_HISTORY", "AP_PSYCHOLOGY"];

if (!CRON_SECRET) {
  console.error("CRON_SECRET not set");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function checkStatus() {
  const res = await fetch(`${BASE_URL}/api/test/practice-check`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const data = await res.json();
  return data.courses.filter((c) => TARGET_COURSES.includes(c.course));
}

async function runPopulate() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90000);
  if (timer.unref) timer.unref();
  try {
    const res = await fetch(`${BASE_URL}/api/cron/auto-populate?limit=5`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function main() {
  console.log("\nTargeted seeding: AP Statistics, AP Chemistry, AP US History, AP Psychology\n");

  // Initial status
  let courses = await checkStatus();
  console.log("Current status:");
  for (const c of courses) {
    const icon = c.status === "green" ? "✅" : c.status === "yellow" ? "⚠️ " : "❌";
    console.log(`  ${icon} ${c.course}: ${c.totalMCQ} MCQ`);
  }
  console.log();

  let iteration = 0;
  const MAX_ITER = 100;
  let totalGenerated = 0;

  while (iteration < MAX_ITER) {
    // Re-check which courses still need work
    courses = await checkStatus();
    const stillRed = courses.filter((c) => c.status === "red");
    const stillYellow = courses.filter((c) => c.status === "yellow");

    if (stillRed.length === 0 && stillYellow.length === 0) {
      console.log("\n✅ All 4 target courses are green!");
      break;
    }

    if (stillRed.length === 0) {
      // Only yellow left - one more pass should be fine
      console.log(`\n⚠️  ${stillYellow.length} yellow course(s) remain — stopping (AI gen handles these)`);
      break;
    }

    iteration++;
    const result = await runPopulate();
    if (result && result.generated > 0) {
      totalGenerated += result.generated;
      const detail = result.details?.[0];
      console.log(`[${iteration}] +${result.generated}q | ${detail?.course ?? "?"} → total: ${totalGenerated}`);
    } else {
      process.stdout.write(".");
    }

    // 10 second delay to respect Groq rate limits
    await sleep(10000);
  }

  // Final check
  console.log("\n\nFinal status:");
  courses = await checkStatus();
  let allGreen = true;
  for (const c of courses) {
    const icon = c.status === "green" ? "✅" : c.status === "yellow" ? "⚠️ " : "❌";
    if (c.status !== "green") allGreen = false;
    console.log(`  ${icon} ${c.course}: ${c.totalMCQ} MCQ (${c.status})`);
  }
  console.log(`\nTotal generated in this run: ${totalGenerated}`);

  if (!allGreen) {
    console.log("\n⚠️  Some courses still not green. AI generation is ON — students will trigger");
    console.log("   generation on first session (~10-15s delay for first student per course).");
    console.log("   Run this script again or trigger seed-question-bank GitHub Actions workflow.");
  }
}

main().catch(console.error);
