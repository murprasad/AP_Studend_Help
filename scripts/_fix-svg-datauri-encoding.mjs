// Re-encode broken SVG stimulus data-URIs from the non-compliant
// `data:image/svg+xml;utf8,<svg ...>` scheme (raw <, >, " break in
// Chrome/Safari → figure fails to load → img alt shows in its place)
// to bulletproof base64. Matches the fixed svgToDataUri() in
// src/lib/stimulus-svg/theme.ts.
//
// Dry-run by default. Pass --apply to write.
//
//   node scripts/_fix-svg-datauri-encoding.mjs           # dry-run
//   node scripts/_fix-svg-datauri-encoding.mjs --apply   # write
import { makePrisma } from "./_prisma-http.mjs";

const APPLY = process.argv.includes("--apply");
const PREFIX = "data:image/svg+xml;utf8,";

function toBase64(svg) {
  const c = svg.replace(/\s+/g, " ").trim();
  return "data:image/svg+xml;base64," + Buffer.from(c, "utf8").toString("base64");
}

const p = makePrisma();

const total = await p.question.count({ where: { stimulusImageUrl: { startsWith: PREFIX } } });
console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — ${total} questions use the broken ;utf8, SVG encoding`);

let processed = 0, changed = 0, cursor = null;
let sampleBefore = null, sampleAfter = null;

while (true) {
  const batch = await p.question.findMany({
    where: { stimulusImageUrl: { startsWith: PREFIX } },
    select: { id: true, stimulusImageUrl: true, course: true },
    take: 200,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: "asc" },
  });
  if (!batch.length) break;
  for (const q of batch) {
    const raw = String(q.stimulusImageUrl).slice(PREFIX.length).replace(/%23/g, "#");
    const newUri = toBase64(raw);
    if (!sampleBefore) {
      sampleBefore = String(q.stimulusImageUrl).slice(0, 70);
      sampleAfter = newUri.slice(0, 70);
    }
    if (APPLY) {
      await p.question.update({ where: { id: q.id }, data: { stimulusImageUrl: newUri } });
    }
    changed++;
  }
  processed += batch.length;
  cursor = batch[batch.length - 1].id;
  if (APPLY && processed % 400 === 0) console.log(`  re-encoded ${changed} ...`);
}

console.log(`\nsample BEFORE: ${sampleBefore}`);
console.log(`sample AFTER:  ${sampleAfter}`);
console.log(`\n${APPLY ? "WROTE" : "WOULD WRITE"} ${changed} rows.`);
if (APPLY) {
  const remaining = await p.question.count({ where: { stimulusImageUrl: { startsWith: PREFIX } } });
  console.log(`remaining ;utf8, URIs: ${remaining}`);
}
await p.$disconnect();
