import { readFileSync, writeFileSync } from "node:fs";

const p = "src/app/page.tsx";
let s = readFileSync(p, "utf8");
const before = s.length;

// Routes whose RSC prefetches return 500 on prod (FMEA F12). When that
// happens, Next.js Link gets stuck and the click does NOT navigate.
// Mitigation: disable prefetching on these Links so click always does
// a hard navigation. Once the underlying RSC infra is fixed, this can
// be reverted.
const routes = [
  "/ap-prep", "/sat-prep", "/act-prep",
  "/pricing", "/about", "/contact",
  "/login", "/register",
];

let total = 0;
for (const r of routes) {
  // Match <Link href="/route" ... (no prefetch attr yet) ...>
  // Use a function replacer with negative-lookahead manually.
  const escaped = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<Link href="${escaped}([^"]*)?"((?!\\sprefetch)[^>]*)>`, "g");
  s = s.replace(re, (match, query, rest) => {
    total++;
    return `<Link href="${r}${query ?? ""}" prefetch={false}${rest}>`;
  });
}

writeFileSync(p, s);
console.log(`Added prefetch={false} to ${total} Link tags. Size ${before} → ${s.length}`);
