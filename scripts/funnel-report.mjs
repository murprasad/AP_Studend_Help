#!/usr/bin/env node
/**
 * Dashboard → Coach Card → CTA click funnel report.
 *
 * Usage:
 *   node scripts/funnel-report.mjs              # last 24h
 *   node scripts/funnel-report.mjs --hours 48   # last 48h
 *   node scripts/funnel-report.mjs --hours 168  # last 7 days
 *
 * Answers: "after users loaded the dashboard, where did they drop?"
 *   (A) Not even loading dashboard          → no row at all
 *   (B) Dashboard loaded, coach not rendered → row with requested but not rendered
 *   (C) Coach rendered, CTA not clicked      → row with rendered but not clicked
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
const hoursIdx = args.indexOf("--hours");
const hours = hoursIdx >= 0 ? Number(args[hoursIdx + 1]) : 24;

if (!Number.isFinite(hours) || hours <= 0) {
  console.error("Invalid --hours value. Expected a positive number.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Export it or add a .env file.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

function pct(num, denom) {
  if (!denom) return "0.0";
  return ((100 * num) / denom).toFixed(1);
}

(async () => {
  // Top-line counts
  const [totals] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE coach_plan_requested_at IS NOT NULL)::int AS requested,
      COUNT(*) FILTER (WHERE coach_plan_rendered_at IS NOT NULL)::int  AS rendered,
      COUNT(*) FILTER (WHERE coach_plan_cta_clicked_at IS NOT NULL)::int AS clicked,
      COUNT(*)::int AS loaded,
      COUNT(DISTINCT user_id)::int AS unique_users
    FROM dashboard_impressions
    WHERE dashboard_loaded_at > now() - (${String(hours)} || ' hours')::interval
  `;

  // Per-ctaType breakdown (only rows that actually rendered)
  const byType = await sql`
    SELECT
      cta_type,
      COUNT(*) FILTER (WHERE coach_plan_rendered_at IS NOT NULL)::int AS rendered,
      COUNT(*) FILTER (WHERE coach_plan_cta_clicked_at IS NOT NULL)::int AS clicked
    FROM dashboard_impressions
    WHERE dashboard_loaded_at > now() - (${String(hours)} || ' hours')::interval
      AND coach_plan_rendered_at IS NOT NULL
    GROUP BY cta_type
    ORDER BY rendered DESC
  `;

  const { loaded, requested, rendered, clicked, unique_users } = totals;

  console.log(`\nDashboard Funnel — last ${hours}h`);
  console.log(`  Loaded       → ${loaded}${unique_users ? `  (${unique_users} unique user${unique_users === 1 ? "" : "s"})` : ""}`);

  if (loaded === 0) {
    console.log(`  (no impressions in window — either nobody loaded the dashboard or instrumentation isn't live yet)\n`);
    process.exit(0);
  }

  const reqMiss = loaded - requested;
  console.log(`  Coach req    → ${requested} (${pct(requested, loaded)}% of loaded)${reqMiss > 0 ? `  — ${reqMiss} loaded but never asked for coach-plan` : ""}`);
  const renderMiss = requested - rendered;
  console.log(`  Coach render → ${rendered} (${pct(rendered, requested)}% of requested)${renderMiss > 0 ? `  — ${renderMiss} coach-plan API failures or timeouts` : ""}`);
  console.log(`  CTA click    → ${clicked} (${pct(clicked, rendered)}% of rendered — message clarity signal)`);

  if (byType.length > 0) {
    console.log(`\nBy ctaType:`);
    const maxLen = byType.reduce((m, r) => Math.max(m, (r.cta_type || "(unset)").length), 0);
    for (const row of byType) {
      const name = (row.cta_type || "(unset)").padEnd(maxLen);
      const ctr = row.rendered ? pct(row.clicked, row.rendered) : "0.0";
      console.log(`  ${name} : ${row.rendered} rendered, ${row.clicked} clicked (${ctr}%)`);
    }
  }
  console.log("");
})().catch((err) => {
  console.error("Funnel report failed:", err?.message || err);
  process.exit(1);
});
