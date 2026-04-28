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
  // Negative lookahead on / preserves alpha tokens like text-green-500/20.
  // The 400-shade colors used inside dark UIs fail WCAG AA when shown on
  // light-mode backgrounds — pair them with a dark-mode override that
  // restores the original look.
  const lightDarkPairs = [
    { from: /\btext-green-500(?!\/)/g,   to: "text-green-700 dark:text-green-400" },
    { from: /\btext-red-400(?!\/)/g,     to: "text-red-700 dark:text-red-400" },
    { from: /\btext-yellow-400(?!\/)/g,  to: "text-yellow-700 dark:text-yellow-400" },
    { from: /\btext-blue-400(?!\/)/g,    to: "text-blue-700 dark:text-blue-400" },
    { from: /\btext-amber-400(?!\/)/g,   to: "text-amber-700 dark:text-amber-400" },
    { from: /\btext-amber-600(?!\/)/g,   to: "text-amber-700 dark:text-amber-400" },
    { from: /\btext-emerald-400(?!\/)/g, to: "text-emerald-700 dark:text-emerald-400" },
    { from: /\btext-purple-400(?!\/)/g,  to: "text-purple-700 dark:text-purple-400" },
    { from: /\btext-rose-400(?!\/)/g,    to: "text-rose-700 dark:text-rose-400" },
    { from: /\btext-orange-400(?!\/)/g,  to: "text-orange-700 dark:text-orange-400" },
    { from: /\btext-indigo-400(?!\/)/g,  to: "text-indigo-700 dark:text-indigo-400" },
    { from: /\btext-violet-400(?!\/)/g,  to: "text-violet-700 dark:text-violet-400" },
    { from: /\btext-muted-foreground\/60(?!\/)/g, to: "text-muted-foreground" },
  ];
  for (const p of lightDarkPairs) next = next.replace(p.from, p.to);
  next = next.replace(/bg-emerald-600 hover:bg-emerald-700/g, "bg-emerald-700 hover:bg-emerald-800");
  if (next !== orig) {
    fs.writeFileSync(file, next, "utf8");
    touched++;
    console.log("  fixed:", path.relative(process.cwd(), file));
  }
}

walk(root);
console.log(`\nFiles modified: ${touched}`);
