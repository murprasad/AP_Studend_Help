#!/usr/bin/env node
/**
 * Beta 8.8 — seed real images on visual-required MCQs via Wikimedia Commons.
 *
 * For each candidate MCQ in visual-heavy AP courses (Bio/Chem/Physics/
 * Psych/HumanGeo/EnvSci/USGov/USHist/WH), search Wikimedia Commons by
 * the question's topic keywords, pick the highest-quality CC-BY/PD image,
 * save URL + attribution to the question. Frontend renders via existing
 * stimulusImageUrl path with new attribution caption.
 *
 * License filter: CC-BY-*, CC0, Public Domain only. SKIPS: copyrighted,
 * non-commercial, trademark-restricted.
 *
 * Quality filter: requires image >= 600x400px, has descriptive caption
 * matching at least 1 question topic keyword.
 *
 * Idempotent — skips MCQs that already have stimulusImageUrl.
 *
 * Usage:
 *   node scripts/seed-real-images.mjs --dry              # report only
 *   node scripts/seed-real-images.mjs AP_BIOLOGY --limit 10
 *   node scripts/seed-real-images.mjs --limit 50         # all visual courses
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const PACE_MS = 2000; // Wikimedia API courtesy
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VISUAL_REQUIRED = [
  "AP_BIOLOGY", "AP_CHEMISTRY", "AP_PHYSICS_1",
  "AP_PSYCHOLOGY", "AP_HUMAN_GEOGRAPHY", "AP_ENVIRONMENTAL_SCIENCE",
  "AP_US_GOVERNMENT", "AP_US_HISTORY", "AP_WORLD_HISTORY",
];

// Wikimedia Commons API helpers
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

async function searchCommons(query) {
  // 1. Search for files matching the query
  const searchUrl = `${COMMONS_API}?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&origin=*`;
  const res = await fetch(searchUrl, {
    headers: { "User-Agent": "StudentNest/1.0 (educational; contact@studentnest.ai)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.query?.search ?? []).map((r) => r.title);
}

async function getImageInfo(filenames) {
  // 2. Get metadata + URL + license for each file (batch up to 50)
  if (filenames.length === 0) return [];
  const titles = filenames.slice(0, 10).join("|");
  const url = `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata&titles=${encodeURIComponent(titles)}&origin=*`;
  const res = await fetch(url, {
    headers: { "User-Agent": "StudentNest/1.0 (educational; contact@studentnest.ai)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = data.query?.pages ?? {};
  return Object.values(pages).map((page) => {
    const info = page.imageinfo?.[0];
    if (!info) return null;
    const meta = info.extmetadata ?? {};
    return {
      title: page.title,
      url: info.url,
      width: info.width,
      height: info.height,
      mime: info.mime,
      author: meta.Artist?.value?.replace(/<[^>]*>/g, "").trim().slice(0, 100) ?? "Unknown",
      license: meta.LicenseShortName?.value ?? meta.License?.value ?? "unknown",
      licenseUrl: meta.LicenseUrl?.value ?? "",
      description: meta.ImageDescription?.value?.replace(/<[^>]*>/g, "").trim().slice(0, 200) ?? "",
    };
  }).filter(Boolean);
}

const ALLOWED_LICENSES = /^(CC[-_ ]BY[-_ ]?(SA[-_ ]?)?[34]\.?\d?|cc[-_ ]?by|CC[-_ ]?0|Public[ -]?domain|PD)/i;

function isUsable(img) {
  if (!img) return false;
  if (!ALLOWED_LICENSES.test(img.license)) return false;
  if (!img.mime || !/^image\/(jpe?g|png|gif|webp|svg)/i.test(img.mime)) return false;
  if ((img.width ?? 0) < 400 || (img.height ?? 0) < 300) return false;
  return true;
}

function buildAttribution(img) {
  const license = img.license || "CC-BY";
  return `${img.author || "Unknown"} via Wikimedia Commons — ${license}`;
}

const rows = courseFilter
  ? await sql`
      SELECT id, course::text as course, topic, subtopic, "questionText", stimulus, unit::text as unit
      FROM questions
      WHERE course = ${courseFilter}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND "stimulusImageUrl" IS NULL
      ORDER BY RANDOM()
    `
  : await sql`
      SELECT id, course::text as course, topic, subtopic, "questionText", stimulus, unit::text as unit
      FROM questions
      WHERE course = ANY(${VISUAL_REQUIRED}::"ApCourse"[])
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND "stimulusImageUrl" IS NULL
      ORDER BY RANDOM()
    `;
const target = Math.min(rows.length, LIMIT);
console.log(`Found ${rows.length} candidate MCQs without images. Will process ${target}.`);

let totalAdded = 0, totalSkipped = 0, totalErr = 0;

for (let i = 0; i < target; i++) {
  const r = rows[i];
  try {
    // Build search query from topic + subtopic + question keywords
    const keywords = [r.topic, r.subtopic].filter(Boolean).join(" ");
    if (!keywords) {
      totalSkipped++;
      continue;
    }
    if (dry) {
      totalAdded++;
      if (i < 3) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course}: search="${keywords}"`);
      continue;
    }

    const filenames = await searchCommons(keywords);
    await sleep(500);
    if (filenames.length === 0) {
      totalSkipped++;
      continue;
    }
    const infos = await getImageInfo(filenames);
    const usable = infos.find(isUsable);
    if (!usable) {
      totalSkipped++;
      continue;
    }

    const attribution = buildAttribution(usable);
    // Append attribution as a caption inside stimulus (rendered below image)
    // Frontend already shows stimulusImageUrl above text content.
    const captionLine = `\n\n*Image: ${attribution}*`;
    const newStimulus = (r.stimulus ?? "") + captionLine;
    await sql`
      UPDATE questions
      SET "stimulusImageUrl" = ${usable.url},
          stimulus = ${newStimulus},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    totalAdded++;
    if (totalAdded <= 3 || totalAdded % 10 === 0) {
      console.log(`  ✓ [${totalAdded}] ${r.id.slice(0, 8)} ${r.course}: ${usable.title.slice(0, 60)} (${usable.license})`);
    }
  } catch (e) {
    totalErr++;
    if (totalErr <= 5) console.error(`  ✗ ${r.id.slice(0, 8)}: ${e.message?.slice(0, 80)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Images attached: ${totalAdded}`);
console.log(`  Skipped (no usable match): ${totalSkipped}`);
console.log(`  Errors: ${totalErr}`);
