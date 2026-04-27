#!/usr/bin/env node
/**
 * Unapprove stimuli that fail real-browser Mermaid rendering.
 * Reads data/render-failures-<DATE>.csv (produced by render-test-visuals.mjs)
 * and flips isApproved=false for each id.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const today = new Date().toISOString().slice(0, 10);
const csvPath = `data/render-failures-${today}.csv`;

const csv = await readFile(csvPath, "utf8");
const lines = csv.split("\n").slice(1).filter(Boolean);
const ids = lines.map((l) => l.split(",")[0]).filter(Boolean);
console.log(`Unapproving ${ids.length} render-fail stimuli...`);

let done = 0, err = 0;
for (const id of ids) {
  try {
    await sql`UPDATE questions SET "isApproved" = false WHERE id = ${id}`;
    done++;
  } catch (e) { err++; }
}
console.log("Unapproved:", done, "Errors:", err);
