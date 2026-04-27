#!/usr/bin/env node
/**
 * Real headless-browser render test for visual stimuli.
 *
 * Loads a static HTML harness that runs Mermaid in the browser, feeds it
 * each stimulus, and verifies an SVG element appears (i.e. Mermaid
 * successfully parsed + rendered). Stimuli that fail to render trigger
 * the renderer's error path → no SVG produced → flagged.
 *
 * This is the "actual visual test" — not just regex/syntax checks.
 *
 * Setup: writes /tmp/mermaid-test-harness.html with mermaid.js CDN.
 * Uses Playwright's chromium (already installed for E2E suite).
 *
 * Usage:
 *   node scripts/render-test-visuals.mjs           # all approved Mermaid
 *   node scripts/render-test-visuals.mjs --limit 30
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { chromium } from "@playwright/test";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

// Static HTML harness with Mermaid loaded. Page exposes window.testMermaid()
// that returns "ok" if SVG was produced, else error string.
const HARNESS_HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
</head><body>
<div id="render-target"></div>
<script>
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
window.testMermaid = async (src) => {
  try {
    const id = 'm-' + Math.random().toString(36).slice(2);
    const { svg } = await mermaid.render(id, src);
    if (svg && svg.includes('<svg')) return { ok: true };
    return { ok: false, err: 'no SVG produced' };
  } catch (e) {
    return { ok: false, err: e.message ? e.message.slice(0, 200) : String(e).slice(0, 200) };
  }
};
</script>
</body></html>`;

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const harnessPath = resolve("data/mermaid-test-harness.html");
await writeFile(harnessPath, HARNESS_HTML);

(async () => {
  console.log(`\n🎬 Real-render visual test (Mermaid via Chromium)\n`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(harnessPath).href);
  await page.waitForFunction(() => typeof window.testMermaid === "function");

  const rows = await sql`
    SELECT id, course, stimulus FROM questions
    WHERE "isApproved" = true
      AND stimulus IS NOT NULL
      AND stimulus LIKE '%\`\`\`mermaid%'
  `;
  const target = rows.slice(0, LIMIT);
  console.log(`Loaded ${target.length} stimuli with mermaid blocks (limit=${LIMIT})`);

  const failures = [];
  let ok = 0;
  for (let i = 0; i < target.length; i++) {
    const r = target[i];
    const m = r.stimulus.match(/```mermaid\s*\n([\s\S]*?)```/);
    if (!m) continue;
    const src = m[1].trim();
    const result = await page.evaluate(async (s) => await window.testMermaid(s), src);
    if (result.ok) {
      ok++;
    } else {
      failures.push({ id: r.id, course: r.course, src: src.slice(0, 100), err: result.err });
    }
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${target.length} (${failures.length} failures)`);
  }

  await browser.close();

  console.log(`\n── Summary ──`);
  console.log(`  Stimuli tested: ${target.length}`);
  console.log(`  Rendered OK:    ${ok}`);
  console.log(`  Failed render:  ${failures.length}`);

  if (failures.length > 0) {
    const byCourse = {};
    for (const f of failures) byCourse[f.course] = (byCourse[f.course] || 0) + 1;
    console.log(`\n  Failures by course:`);
    Object.entries(byCourse).sort(([,a],[,b])=>b-a).forEach(([c,n]) => console.log(`    ${c}: ${n}`));

    console.log(`\n  Sample failures:`);
    for (const f of failures.slice(0, 8)) {
      console.log(`    ${f.id.slice(0, 10)} ${f.course}`);
      console.log(`      err: ${f.err}`);
      console.log(`      src: ${f.src}`);
    }

    // Write failure CSV
    const today = new Date().toISOString().slice(0, 10);
    const lines = ["id,course,error,src", ...failures.map((f) => `${f.id},${f.course},"${f.err.replace(/"/g, '""')}","${f.src.replace(/"/g, '""')}"`)];
    await writeFile(`data/render-failures-${today}.csv`, lines.join("\n"));
    console.log(`\n  CSV: data/render-failures-${today}.csv`);
  }

  process.exit(failures.length > 0 ? 1 : 0);
})().catch((e) => { console.error("Fatal:", e); process.exit(2); });
