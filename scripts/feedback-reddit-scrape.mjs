/**
 * scripts/feedback-reddit-scrape.mjs
 *
 * Fetches top-of-week posts from a subreddit, runs each through the
 * feedback-ingest pipeline. Standardized scraper for the Phase 3 weekly
 * cron (per project_feedback_loop_standard_spec.md).
 *
 * Usage:
 *   node scripts/feedback-reddit-scrape.mjs --sub=clep --limit=50
 *   node scripts/feedback-reddit-scrape.mjs --sub=APStudents --period=week
 *   node scripts/feedback-reddit-scrape.mjs --sub=Sat --period=month --limit=100
 *
 * --sub:    subreddit name (without r/)
 * --period: hour|day|week|month|year|all (default week)
 * --limit:  max posts (default 50)
 *
 * After scraping: re-aggregates all touched courses' profiles.
 *
 * Cost: ~$0.005/post (LLM extraction). 50 posts = $0.25.
 */
import "dotenv/config";
import { spawn } from "node:child_process";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const sub = args.sub;
const period = args.period ?? "week";
const limit = parseInt(args.limit ?? "50", 10);

if (!sub) {
  console.error("usage: --sub=<subreddit> [--period=week] [--limit=50]");
  process.exit(1);
}

const url = `https://www.reddit.com/r/${sub}/top.json?t=${period}&limit=${Math.min(limit, 100)}`;
console.log(`Fetching ${url}...`);
const res = await fetch(url, {
  headers: { "User-Agent": "studentnest-feedback-scrape/1.0 (contact: contact@studentnest.ai)" },
});
if (!res.ok) {
  console.error(`Reddit fetch failed: HTTP ${res.status}`);
  process.exit(2);
}
const data = await res.json();
const posts = data?.data?.children ?? [];
console.log(`Fetched ${posts.length} posts from r/${sub}`);

let processed = 0;
let classified = 0;
let skipped = 0;
let failed = 0;

for (const wrapper of posts) {
  const post = wrapper?.data;
  if (!post) continue;
  const title = post.title ?? "";
  const body = post.selftext ?? "";

  // Skip likely-irrelevant posts
  if (post.removed_by_category || post.locked) {
    skipped++;
    continue;
  }
  if ((title + body).length < 80) {
    skipped++;
    continue;
  }
  // Skip pinned/announcement posts (often mod posts)
  if (post.stickied) {
    skipped++;
    continue;
  }

  const permalink = `https://reddit.com${post.permalink}`;
  console.log(`  [${processed + 1}/${posts.length}] ${title.slice(0, 70)}`);

  // Run feedback-ingest as subprocess (so we don't have to inline ALL the logic)
  const result = await new Promise((resolve) => {
    const proc = spawn(process.execPath, ["scripts/feedback-ingest.mjs", permalink], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    proc.stdout.on("data", (d) => { out += d.toString(); });
    proc.stderr.on("data", (d) => { out += d.toString(); });
    proc.on("close", (code) => resolve({ code, out }));
  });

  processed++;
  if (result.code === 0) {
    if (result.out.includes("classify post into a known course")) {
      skipped++;
    } else if (result.out.includes("Already ingested")) {
      skipped++;
    } else if (result.out.includes("✓ Appended")) {
      classified++;
    }
  } else {
    failed++;
  }

  // Rate-limit Reddit (1 req/sec is courteous)
  await new Promise((r) => setTimeout(r, 1100));
}

console.log(`\n══ Done ══`);
console.log(`processed=${processed} classified=${classified} skipped=${skipped} failed=${failed}`);

// Re-aggregate all touched courses
console.log(`\nRe-aggregating all profiles...`);
const aggResult = await new Promise((resolve) => {
  const proc = spawn(process.execPath, ["scripts/feedback-aggregate.mjs"], { stdio: "inherit" });
  proc.on("close", (code) => resolve(code));
});
console.log(`Aggregate exit code: ${aggResult}`);
