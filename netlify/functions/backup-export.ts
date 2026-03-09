/**
 * Option 2 — Data Export to Netlify Blobs (Scheduled Netlify Function)
 * Runs daily at 03:00 UTC. Logic lives in src/lib/backup.ts.
 */

import type { Config } from "@netlify/functions";
import { runDataExport } from "../../src/lib/backup";

export default async function handler() {
  try {
    const result = await runDataExport();
    console.log("[Backup/Export] Scheduled run complete:", result);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Backup/Export] Scheduled run failed:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config: Config = {
  schedule: "0 3 * * *", // 03:00 UTC daily
};
