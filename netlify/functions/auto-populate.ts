/**
 * Scheduled Netlify Function — Auto-Populate Question Bank
 *
 * Runs every 6 hours. For each unit across all courses, if the approved
 * question count is below AUTO_POPULATE_TARGET (50), generates questions
 * to fill the gap using the AI cascade (Groq → Pollinations fallback).
 *
 * Processes up to MAX_UNITS_PER_RUN (10) units per run, sorted by count
 * ascending so the most critical units are always served first.
 *
 * No admin action required — fully automatic.
 */

import type { Config } from "@netlify/functions";
import { runAutoPopulate } from "../../src/lib/auto-populate";

export default async function handler() {
  try {
    const result = await runAutoPopulate();
    console.log("[AutoPopulate] Scheduled run complete:", result);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AutoPopulate] Scheduled run failed:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config: Config = {
  schedule: "0 */6 * * *", // every 6 hours
};
