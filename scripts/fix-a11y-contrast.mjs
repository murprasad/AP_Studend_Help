// One-shot bulk fix for WCAG AA contrast failures flagged on /billing + /about:
//   .text-green-500 with white-ish bg → 2.14 contrast (need 4.5)
//   .bg-emerald-600 with white text   → 3.76 contrast (need 4.5)
//
// Surgical replacements:
//   - "text-green-500"             → "text-green-700 dark:text-green-400"
//     But ONLY when NOT followed by "/" (avoids breaking text-green-500/20 alpha tokens).
//   - "bg-emerald-600 hover:bg-emerald-700" → "bg-emerald-700 hover:bg-emerald-800"
//
// Idempotent — running twice does nothing.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const exts = new Set([".tsx", ".ts"]);
let touched = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (exts.has(path.extname(f.name))) maybeFix(p);
  }
}

function maybeFix(file) {
  const orig = fs.readFileSync(file, "utf8");
  let next = orig;
  // Negative lookahead on / so we don't break alpha tokens like text-green-500/20.
  next = next.replace(/text-green-500(?!\/)/g, "text-green-700 dark:text-green-400");
  next = next.replace(/bg-emerald-600 hover:bg-emerald-700/g, "bg-emerald-700 hover:bg-emerald-800");
  if (next !== orig) {
    fs.writeFileSync(file, next, "utf8");
    touched++;
    console.log("  fixed:", path.relative(process.cwd(), file));
  }
}

walk(root);
console.log(`\nFiles modified: ${touched}`);
