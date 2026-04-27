#!/usr/bin/env node
/**
 * Fetch SAT + ACT practice test PDFs.
 *
 * SAT: digital since March 2024. Paper-format practice still available via
 * collegeboard.org/media/pdf/. Bluebook app holds the official tests but
 * the printable PDFs cover the same content for grounding.
 *
 * ACT: free practice tests at act.org/content/dam/act/unsecured/.
 *
 * Saves to:
 *   data/cb-frqs/SAT_2025/<filename>.pdf
 *   data/cb-frqs/ACT_2025/<filename>.pdf
 *
 * Same safety rails as fetch-cb-2025-frqs.mjs (pacing, abort on 4xx).
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import { join, basename } from "node:path";

const PACE_MS = 4000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SAT_URLS = [
  "https://satsuite.collegeboard.org/media/pdf/sat-student-guide.pdf",
  "https://satsuite.collegeboard.org/media/pdf/sat-school-day-student-guide.pdf",
  "https://www.collegeboard.org/media/pdf/sat-student-guide.pdf",
  "https://www.collegeboard.org/media/pdf/sat-school-day-student-guide.pdf",
  "https://apcentral.collegeboard.org/media/pdf/sat-student-guide.pdf",
];

const ACT_URLS = [
  "https://www.act.org/content/dam/act/unsecured/documents/Preparing-for-the-ACT.pdf",
  "https://www.act.org/content/dam/act/unsecured/documents/ACT-Test-Prep-ACT-Practice-Test-2-Form.pdf",
];

async function fetchOne(url, dest) {
  try {
    const s = await stat(dest);
    if (s.size > 0) return { status: "exists", size: s.size };
  } catch { /* not present */ }
  const res = await fetch(url, {
    headers: {
      "user-agent": "StudentNest research/1.0 (educational gap analysis; contact@studentnest.ai)",
      "accept": "application/pdf,*/*",
    },
    signal: AbortSignal.timeout(60_000),
  });
  if (res.status === 403 || res.status === 429 || res.status === 503) {
    throw new Error(`HARD-STOP ${res.status}`);
  }
  if (!res.ok) return { status: `err-${res.status}`, size: 0 };
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return { status: "ok", size: buf.length };
}

(async () => {
  console.log(`\n📥 SAT + ACT fetcher\n`);
  for (const [family, urls] of [["SAT", SAT_URLS], ["ACT", ACT_URLS]]) {
    const dir = `data/cb-frqs/${family}_2025`;
    await mkdir(dir, { recursive: true });
    console.log(`\n=== ${family} (${urls.length} files) ===`);
    for (const url of urls) {
      const filename = basename(new URL(url).pathname);
      const dest = join(dir, filename);
      try {
        const r = await fetchOne(url, dest);
        if (r.status === "ok") console.log(`  ✓ ${filename} (${(r.size / 1024).toFixed(0)} KB)`);
        else if (r.status === "exists") console.log(`  ◯ ${filename} (already)`);
        else console.log(`  ✗ ${filename} (${r.status})`);
      } catch (e) {
        console.log(`  ✗ ${filename} (${e.message?.slice(0, 60)})`);
      }
      await sleep(PACE_MS);
    }
  }
  console.log(`\n✅ Done.`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
