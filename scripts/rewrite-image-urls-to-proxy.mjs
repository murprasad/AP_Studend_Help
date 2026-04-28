// Rewrite all stimulusImageUrl in DB from raw Wikimedia URL to our
// /api/img-proxy?u=<URL> form. Production benefit: edge-cached, no
// rate-limit risk under load.
//
// Idempotent — only rewrites URLs that haven't already been proxied.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const PROXY_PREFIX = "/api/img-proxy?u=";

const rows = await sql`
  SELECT id, "stimulusImageUrl"
  FROM questions
  WHERE "stimulusImageUrl" IS NOT NULL
    AND "stimulusImageUrl" LIKE 'http%'
    AND "stimulusImageUrl" NOT LIKE '%/api/img-proxy%'
`;

console.log(`Found ${rows.length} questions with raw external image URLs`);

let rewrote = 0;
const samples = [];

for (const r of rows) {
  const raw = r.stimulusImageUrl;
  // Only rewrite Wikimedia / Wikipedia (allowlisted in proxy)
  if (!/(wikimedia|wikipedia)\.org/.test(raw)) continue;

  const proxied = PROXY_PREFIX + encodeURIComponent(raw);
  if (samples.length < 3) {
    samples.push({ id: r.id.slice(0, 8), before: raw.slice(0, 80), after: proxied.slice(0, 80) });
  }
  if (!dry) {
    await sql`
      UPDATE questions
      SET "stimulusImageUrl" = ${proxied},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
  }
  rewrote++;
}

console.log(`\nRewrote ${rewrote} URLs to use /api/img-proxy`);
for (const s of samples) {
  console.log(`\n${s.id}`);
  console.log(`  before: ${s.before}…`);
  console.log(`  after:  ${s.after}…`);
}
