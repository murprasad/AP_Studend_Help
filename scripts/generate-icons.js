#!/usr/bin/env node
/**
 * One-time icon generator for StudentNest PWA.
 * Run: node scripts/generate-icons.js
 * Produces: public/icons/icon-192.png and public/icons/icon-512.png
 *
 * Requires sharp (bundled with Next.js — no install needed).
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SIZES = [192, 512];
const OUT_DIR = path.join(__dirname, "../public/icons");

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

async function generateIcon(size) {
  const radius = Math.round(size * 0.45);
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = Math.round(size * 0.28);

  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark background -->
  <rect width="${size}" height="${size}" fill="#111827"/>
  <!-- Indigo circle -->
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#1865F2"/>
  <!-- White "SN" initials -->
  <text
    x="${cx}"
    y="${cy}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="white"
    letter-spacing="-2"
  >SN</text>
</svg>`.trim();

  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ Generated ${outPath}`);
}

(async () => {
  for (const size of SIZES) {
    await generateIcon(size);
  }
  console.log("Done. PWA icons ready in public/icons/");
})();
