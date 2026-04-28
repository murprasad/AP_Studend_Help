// PowerShell's Set-Content -Encoding utf8 (in PS 5.1) converted UTF-8
// em-dashes "—" (E2 80 94) to mojibake "â€"" (C3 A2 E2 82 AC E2 80 9D when
// re-encoded). Restore by replacing the most common mojibake patterns.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const exts = new Set([".tsx", ".ts"]);
let touched = 0;

// Mojibake patterns observed in this commit. All are UTF-8 read-as-CP1252
// re-encoded as UTF-8.
const fixes = [
  ["â€”", "—"],   // em-dash
  ["â€“", "–"],   // en-dash
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€œ", "“"],
  ["â€", "”"], // closing right curly double-quote (with C2 9D)
  ["â€¦", "…"],
  ["â€¢", "•"],
  ["Â ", " "],     // non-breaking space pre-mangled
  ["Â°", "°"],
  ["â‰¥", "≥"],
  ["â‰¤", "≤"],
];

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (exts.has(path.extname(f.name))) maybeFix(p);
  }
}

function maybeFix(file) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;
  for (const [bad, good] of fixes) c = c.split(bad).join(good);
  if (c !== orig) {
    fs.writeFileSync(file, c, "utf8");
    touched++;
    console.log("  fixed:", path.relative(process.cwd(), file));
  }
}

walk(root);
console.log(`\nFiles de-mojibaked: ${touched}`);
