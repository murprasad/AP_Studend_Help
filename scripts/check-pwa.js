#!/usr/bin/env node
/**
 * check-pwa.js
 * Verifies PWA requirements are met before deploy.
 * Checks manifest, icons, service worker, and meta tags.
 *
 * Usage: node scripts/check-pwa.js
 * Exits 0 on pass, 1 on failure.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function ok(msg)   { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg) { console.error(`  ❌ ${msg}`); failed++; }
function section(title) { console.log(`\n── ${title} ──`); }

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { return ""; }
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ── 1. Manifest ────────────────────────────────────────────────────────────────
section("1. Web App Manifest");
const manifestPath = "public/manifest.webmanifest";
if (!exists(manifestPath)) {
  fail(`manifest.webmanifest missing at public/`);
} else {
  ok("manifest.webmanifest exists");
  try {
    const manifest = JSON.parse(read(manifestPath));
    const required = ["name", "short_name", "start_url", "display", "background_color", "theme_color", "icons"];
    for (const field of required) {
      if (manifest[field]) {
        ok(`manifest.${field} = ${JSON.stringify(manifest[field]).slice(0, 50)}`);
      } else {
        fail(`manifest.${field} is missing`);
      }
    }
    // Validate display is standalone or fullscreen
    if (!["standalone", "fullscreen", "minimal-ui"].includes(manifest.display)) {
      fail(`manifest.display "${manifest.display}" — should be standalone/fullscreen for PWA install`);
    }
    // Validate icons
    if (Array.isArray(manifest.icons)) {
      const has192 = manifest.icons.some((i) => i.sizes?.includes("192"));
      const has512 = manifest.icons.some((i) => i.sizes?.includes("512"));
      if (has192) ok("manifest has 192×192 icon");
      else fail("manifest missing 192×192 icon (required for Android)");
      if (has512) ok("manifest has 512×512 icon");
      else fail("manifest missing 512×512 icon (required for splash screen)");
      const hasMaskable = manifest.icons.some((i) => i.purpose?.includes("maskable"));
      if (hasMaskable) ok("manifest has maskable icon (adaptive icon for Android)");
      else fail("manifest missing maskable icon — add purpose: 'maskable' to one icon");
    }
  } catch (e) {
    fail(`manifest.webmanifest is invalid JSON: ${e.message}`);
  }
}

// ── 2. Icon files ──────────────────────────────────────────────────────────────
section("2. Icon files");
const ICONS = ["public/icons/icon-192.png", "public/icons/icon-512.png"];
for (const icon of ICONS) {
  if (exists(icon)) {
    const size = fs.statSync(path.join(ROOT, icon)).size;
    if (size < 100) fail(`${icon} exists but is suspiciously small (${size} bytes)`);
    else ok(`${icon} (${Math.round(size / 1024)}KB)`);
  } else {
    fail(`${icon} missing`);
  }
}

// ── 3. Service Worker ──────────────────────────────────────────────────────────
section("3. Service Worker");
const swPath = "public/sw.js";
if (!exists(swPath)) {
  fail("public/sw.js missing — PWA offline support disabled");
} else {
  const sw = read(swPath);
  ok("public/sw.js exists");
  if (sw.includes("install")) ok("SW has install event handler");
  else fail("SW missing install event handler");
  if (sw.includes("activate")) ok("SW has activate event handler");
  else fail("SW missing activate event handler");
  if (sw.includes("fetch")) ok("SW has fetch event handler");
  else fail("SW missing fetch event handler");
  if (sw.includes("/api/")) ok("SW skips caching API routes (network-first for API)");
  else fail("SW does not exclude API routes — may serve stale API responses");
  // Check cache version is set
  const cacheMatch = sw.match(/CACHE_NAME\s*=\s*["']([^"']+)["']/);
  if (cacheMatch) ok(`SW cache name: "${cacheMatch[1]}"`);
  else fail("SW missing CACHE_NAME constant — old caches may not be cleared on update");
}

// ── 4. HTML meta tags ──────────────────────────────────────────────────────────
section("4. HTML meta tags (layout.tsx)");
const layout = read("src/app/layout.tsx");
if (!layout) {
  fail("src/app/layout.tsx not found");
} else {
  if (layout.includes('rel="manifest"')) ok("manifest link tag present");
  else fail("manifest link tag missing in layout.tsx");
  if (layout.includes("serviceWorker") && layout.includes("register")) ok("Service Worker registration script present");
  else fail("Service Worker registration script missing in layout.tsx");
  if (layout.includes("apple-mobile-web-app-capable")) ok("Apple PWA meta tag present");
  else fail("apple-mobile-web-app-capable meta tag missing");
  if (layout.includes("apple-touch-icon")) ok("apple-touch-icon link present");
  else fail("apple-touch-icon link missing");
  if (layout.includes("themeColor") || layout.includes("theme_color") || layout.includes("theme-color")) ok("theme-color set");
  else fail("theme-color missing (affects browser chrome color on mobile)");
  if (layout.includes("viewportFit") || layout.includes("viewport-fit")) ok("viewport-fit=cover set (safe area support)");
  else fail("viewport-fit missing");
}

// ── 5. Live PWA check (fetch manifest from prod) ──────────────────────────────
// Only runs if --live flag passed; skip in pre-deploy static checks
if (process.argv.includes("--live")) {
  section("5. Live manifest fetch (https://studentnest.ai)");
  (async () => {
    try {
      const res = await fetch("https://studentnest.ai/manifest.webmanifest", {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("json") || ct.includes("manifest")) {
          ok(`/manifest.webmanifest served (${res.status}, content-type: ${ct})`);
        } else {
          fail(`/manifest.webmanifest wrong content-type: ${ct}`);
        }
      } else {
        fail(`/manifest.webmanifest returned HTTP ${res.status}`);
      }
    } catch (e) {
      fail(`/manifest.webmanifest fetch failed: ${e.message}`);
    }
    printSummary();
  })();
} else {
  printSummary();
}

function printSummary() {
  console.log(`\n${"─".repeat(50)}`);
  if (failed === 0) {
    console.log(`✅ All ${passed} PWA checks passed.`);
    process.exit(0);
  } else {
    console.error(`❌ ${failed} PWA check(s) failed, ${passed} passed.`);
    process.exit(1);
  }
}
