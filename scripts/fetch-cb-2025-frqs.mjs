#!/usr/bin/env node
/**
 * Fetch CB 2025 FRQ booklets for AP courses (public PDFs).
 *
 * URL list derived empirically by visiting each course's
 * apcentral.collegeboard.org/courses/<slug>/exam/past-exam-questions
 * page on 2026-04-27.
 *
 * Saves to: data/cb-frqs/<COURSE>-2025/<filename>.pdf
 *
 * Safety:
 *   - 4s pacing between requests
 *   - User-Agent identifies as research tool
 *   - Abort on 403 / 429 / 503 — assumes CB blocked us
 *   - Skips already-downloaded files (idempotent)
 *
 * Usage:
 *   node scripts/fetch-cb-2025-frqs.mjs              # all 13 AP courses
 *   node scripts/fetch-cb-2025-frqs.mjs AP_CHEMISTRY # one course
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import { join, basename } from "node:path";

const args = process.argv.slice(2);
const courseFilter = args.find((a) => a.startsWith("AP_"));

const PACE_MS = 4000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// URL lists derived from CB's public exam pages (2026-04-27).
// AP_WORLD_HISTORY skipped — already manually placed by user.
const COURSE_URLS = {
  AP_CHEMISTRY: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-chemistry.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-chemistry.pdf",
  ],
  AP_BIOLOGY: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-biology.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-biology.pdf",
  ],
  AP_PHYSICS_1: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-physics-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-physics-1.pdf",
  ],
  AP_STATISTICS: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-statistics.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-statistics.pdf",
  ],
  AP_CALCULUS_AB: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-calculus-ab.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-calculus-ab.pdf",
  ],
  AP_CALCULUS_BC: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-calculus-bc.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-calculus-bc.pdf",
  ],
  AP_PRECALCULUS: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-precalculus.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-precalculus.pdf",
  ],
  AP_US_HISTORY: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-us-history-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-us-history-set-2.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-us-history-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-us-history-set-2.pdf",
  ],
  AP_US_GOVERNMENT: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-us-gov-pol-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-us-gov-pol-set-2.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-us-gov-pol-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-us-gov-pol-set-2.pdf",
  ],
  AP_PSYCHOLOGY: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-psychology-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-psychology-set-2.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-psychology-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-psychology-set-2.pdf",
  ],
  AP_HUMAN_GEOGRAPHY: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-human-geography-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-human-geography-set-2.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-human-geography-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-human-geography-set-2.pdf",
  ],
  AP_ENVIRONMENTAL_SCIENCE: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-environmental-science-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-environmental-science-set-2.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-environmental-science-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-environmental-science-set-2.pdf",
  ],
  AP_COMPUTER_SCIENCE_PRINCIPLES: [
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-computer-science-principles-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-frq-computer-science-principles-set-2.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-computer-science-principles-set-1.pdf",
    "https://apcentral.collegeboard.org/media/pdf/ap25-sg-computer-science-principles-set-2.pdf",
  ],
};

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
    throw new Error(`HARD-STOP ${res.status} from CB — pausing all downloads`);
  }
  if (!res.ok) {
    return { status: `err-${res.status}`, size: 0 };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return { status: "ok", size: buf.length };
}

(async () => {
  console.log(`\n📥 CB 2025 FRQ fetcher\n`);
  const targets = courseFilter
    ? { [courseFilter]: COURSE_URLS[courseFilter] }
    : COURSE_URLS;
  if (!targets[Object.keys(targets)[0]]) {
    console.error(`Unknown course: ${courseFilter}`);
    process.exit(1);
  }

  let totalDownloaded = 0;
  let totalSkipped = 0;
  let totalErr = 0;
  let aborted = null;

  for (const [course, urls] of Object.entries(targets)) {
    if (!urls) continue;
    if (aborted) break;
    const dir = `data/cb-frqs/${course}-2025`;
    await mkdir(dir, { recursive: true });
    console.log(`\n=== ${course} (${urls.length} files) ===`);
    for (const url of urls) {
      const filename = basename(new URL(url).pathname);
      const dest = join(dir, filename);
      try {
        const r = await fetchOne(url, dest);
        if (r.status === "ok") {
          totalDownloaded++;
          console.log(`  ✓ ${filename} (${(r.size / 1024).toFixed(0)} KB)`);
        } else if (r.status === "exists") {
          totalSkipped++;
          console.log(`  ◯ ${filename} (already, ${(r.size / 1024).toFixed(0)} KB)`);
        } else {
          totalErr++;
          console.log(`  ✗ ${filename} (${r.status})`);
        }
      } catch (e) {
        if (e.message.startsWith("HARD-STOP")) {
          aborted = e.message;
          console.error(`\n❌ ${e.message}`);
          break;
        }
        totalErr++;
        console.log(`  ✗ ${filename} (${e.message?.slice(0, 60)})`);
      }
      await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Downloaded:  ${totalDownloaded}`);
  console.log(`  Already had: ${totalSkipped}`);
  console.log(`  Errors:      ${totalErr}`);
  if (aborted) {
    console.log(`\n⚠ Aborted: ${aborted}`);
  }
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
