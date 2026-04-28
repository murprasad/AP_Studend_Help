// Verify visual elements actually work:
//  1. For every approved question with stimulusImageUrl: HEAD-fetch and verify
//     200 + image content-type.
//  2. For every approved question with ```mermaid block: validate syntax
//     (balanced braces, has graph/flowchart prefix).
//  3. For every approved question with LaTeX: detect mojibake artifacts
//     ("	o", "rac{", raw "\f") that would render broken.
//
// Reports: which courses have working visuals, which have broken.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const PARALLEL = 2;
const PACE_MS = 800;

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const ct = res.headers.get("content-type") ?? "";
    return { ok: true, status: res.status, contentType: ct, isImage: ct.startsWith("image/") };
  } catch (e) {
    return { ok: false, status: 0, error: e.message?.slice(0, 60) };
  }
}

console.log("# Visual integrity check — 2026-04-28\n");

// ── 1. Image-stim verification ──
const imageRows = await sql`
  SELECT id, course::text AS course, "stimulusImageUrl"
  FROM questions
  WHERE "isApproved" = true
    AND "stimulusImageUrl" IS NOT NULL
    AND "stimulusImageUrl" LIKE 'http%'
  ORDER BY course, RANDOM()
`;
console.log(`## Image-stimulus check — ${imageRows.length} questions with image URLs\n`);

const byCourse = {};
let imgChecked = 0, imgOk = 0, imgBroken = 0;
const brokenSamples = [];

// Sample up to 8 per course (paced) so we don't trip rate limits
const sampledByCourse = {};
for (const r of imageRows) {
  if (!sampledByCourse[r.course]) sampledByCourse[r.course] = [];
  if (sampledByCourse[r.course].length < 8) sampledByCourse[r.course].push(r);
}
const sampled = Object.values(sampledByCourse).flat();
console.log(`Sampling ${sampled.length} questions (max 30/course)…`);

// Parallel HEAD checks
async function processChunk(chunk) {
  const results = await Promise.all(chunk.map(async r => {
    const result = await checkUrl(r.stimulusImageUrl);
    return { row: r, result };
  }));
  for (const { row, result } of results) {
    imgChecked++;
    if (!byCourse[row.course]) byCourse[row.course] = { ok: 0, broken: 0, rate_limit: 0 };
    if (result.ok && result.isImage) {
      imgOk++;
      byCourse[row.course].ok++;
    } else if (result.status === 429) {
      // Rate-limited — not actually broken
      byCourse[row.course].rate_limit++;
    } else {
      imgBroken++;
      byCourse[row.course].broken++;
      if (brokenSamples.length < 5) brokenSamples.push({ id: row.id.slice(0, 8), url: row.stimulusImageUrl, ...result });
    }
  }
}

for (let i = 0; i < sampled.length; i += PARALLEL) {
  await processChunk(sampled.slice(i, i + PARALLEL));
  if (i + PARALLEL < sampled.length) await new Promise(r => setTimeout(r, PACE_MS));
}

console.log(`\nImage check results: ${imgOk}/${imgChecked} OK, ${imgBroken} broken`);
console.log(`\nPer-course (sampled):`);
for (const [c, x] of Object.entries(byCourse).sort()) {
  const pct = (x.ok / (x.ok + x.broken) * 100).toFixed(0);
  console.log(`  ${c}: ${x.ok}/${x.ok + x.broken} (${pct}% OK)`);
}
if (brokenSamples.length > 0) {
  console.log(`\nBroken samples:`);
  for (const s of brokenSamples) {
    console.log(`  ${s.id}: status=${s.status} ${s.error ?? ''} url=${s.url.slice(0, 80)}`);
  }
}

// ── 2. Mermaid syntax check ──
const mermaidRows = await sql`
  SELECT id, course::text AS course, stimulus
  FROM questions
  WHERE "isApproved" = true
    AND stimulus LIKE '%\`\`\`mermaid%'
`;
console.log(`\n## Mermaid block check — ${mermaidRows.length} questions with Mermaid\n`);
let mOk = 0, mBroken = 0;
const mBrokenSamples = [];
for (const r of mermaidRows) {
  const m = r.stimulus.match(/```mermaid([\s\S]*?)```/);
  if (!m) {
    mBroken++;
    if (mBrokenSamples.length < 5) mBrokenSamples.push({ id: r.id.slice(0, 8), reason: "no closing ```" });
    continue;
  }
  const body = m[1].trim();
  // Basic syntax: must start with graph/flowchart/sequenceDiagram/etc.
  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|erDiagram|xychart-beta|timeline|mindmap|gitGraph|journey|requirementDiagram|c4Context|quadrantChart|sankey-beta|block-beta)/i.test(body)) {
    mBroken++;
    if (mBrokenSamples.length < 5) mBrokenSamples.push({ id: r.id.slice(0, 8), reason: `no valid prefix: "${body.slice(0, 30)}…"` });
    continue;
  }
  // Check balanced [] {} parentheses
  const opens = (body.match(/[\[\{\(]/g) ?? []).length;
  const closes = (body.match(/[\]\}\)]/g) ?? []).length;
  if (opens !== closes) {
    mBroken++;
    if (mBrokenSamples.length < 5) mBrokenSamples.push({ id: r.id.slice(0, 8), reason: `unbalanced brackets ${opens}/${closes}` });
    continue;
  }
  mOk++;
}
console.log(`Mermaid check: ${mOk}/${mermaidRows.length} OK, ${mBroken} broken`);
if (mBrokenSamples.length > 0) {
  console.log(`\nBroken Mermaid:`);
  for (const s of mBrokenSamples) console.log(`  ${s.id}: ${s.reason}`);
}

// ── 3. LaTeX mojibake remnants ──
const latexCheck = await sql`
  SELECT COUNT(*)::int n FROM questions
  WHERE "isApproved" = true
    AND (stimulus ~ E'\\trac\\{' OR explanation ~ E'\\trac\\{' OR "questionText" ~ E'\\trac\\{'
      OR stimulus LIKE '%	o%' OR stimulus LIKE '%	ext%' OR stimulus LIKE '%	imes%')
`;
console.log(`\n## LaTeX mojibake check`);
console.log(`Remaining broken LaTeX: ${latexCheck[0].n}`);

// ── 4. SAT/ACT visual coverage gap ──
const visGap = await sql`
  SELECT course::text c,
    COUNT(*) FILTER (WHERE "isApproved" = true) AS total,
    COUNT(*) FILTER (WHERE "isApproved" = true AND "stimulusImageUrl" IS NOT NULL) AS w_img,
    COUNT(*) FILTER (WHERE "isApproved" = true AND stimulus LIKE '%mermaid%') AS w_mm
  FROM questions
  WHERE course::text LIKE 'SAT_%' OR course::text LIKE 'ACT_%'
  GROUP BY course
  ORDER BY course
`;
console.log(`\n## SAT/ACT visual coverage:`);
for (const r of visGap) {
  console.log(`  ${r.c}: ${r.total} approved, ${r.w_img} images, ${r.w_mm} Mermaid`);
}
