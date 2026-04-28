// Verify the live image-proxy on prod by hitting random proxied URLs.
// Should see 200 + image/* content-type. Tracks cache HIT vs MISS so we
// know the edge cache is warming.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const PROD = "https://studentnest.ai";
const SAMPLE = 30;

const rows = await sql`
  SELECT id, course::text c, "stimulusImageUrl"
  FROM questions
  WHERE "isApproved" = true
    AND "stimulusImageUrl" LIKE '/api/img-proxy%'
  ORDER BY RANDOM()
  LIMIT ${SAMPLE}
`;

console.log(`Testing ${rows.length} live proxied URLs on prod…\n`);

const results = { ok: 0, broken: 0, hit: 0, miss: 0 };
const broken = [];

for (const r of rows) {
  const fullUrl = PROD + r.stimulusImageUrl;
  try {
    const res = await fetch(fullUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
    });
    const ct = res.headers.get("content-type") ?? "";
    const cache = res.headers.get("x-cache") ?? "?";
    if (res.ok && ct.startsWith("image/")) {
      results.ok++;
      if (cache === "HIT") results.hit++;
      else results.miss++;
    } else {
      results.broken++;
      const body = res.ok ? null : await res.text().catch(() => "");
      broken.push({ id: r.id.slice(0, 8), course: r.c, status: res.status, ct, body: body?.slice(0, 100) });
    }
  } catch (e) {
    results.broken++;
    broken.push({ id: r.id.slice(0, 8), course: r.c, error: e.message?.slice(0, 80) });
  }
  // Pace 500ms between requests
  await new Promise(r => setTimeout(r, 500));
}

console.log(`OK:     ${results.ok}/${rows.length} (${(results.ok/rows.length*100).toFixed(0)}%)`);
console.log(`Broken: ${results.broken}/${rows.length}`);
console.log(`Cache:  ${results.hit} HIT, ${results.miss} MISS (cache warming with use)`);

if (broken.length > 0) {
  console.log(`\nBroken samples:`);
  for (const b of broken.slice(0, 10)) console.log(`  ${b.id} ${b.course}: ${b.status ?? ''} ${b.ct ?? ''} ${b.body ?? b.error ?? ''}`);
}
