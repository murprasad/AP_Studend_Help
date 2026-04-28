// Strip UTF-8 BOMs that PowerShell's Set-Content -Encoding utf8 added.
// Next.js "use client" directives break when prefixed with a BOM.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const exts = new Set([".tsx", ".ts"]);
let stripped = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (exts.has(path.extname(f.name))) maybeStrip(p);
  }
}

function maybeStrip(file) {
  const buf = fs.readFileSync(file);
  // UTF-8 BOM = 0xEF 0xBB 0xBF
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    fs.writeFileSync(file, buf.slice(3));
    stripped++;
    console.log("  stripped:", path.relative(process.cwd(), file));
  }
}

walk(root);
console.log(`\nFiles with BOM stripped: ${stripped}`);
