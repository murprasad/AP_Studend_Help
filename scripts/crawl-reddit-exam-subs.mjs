#!/usr/bin/env node
/**
 * Stage 1 crawler: pull top posts + top comments from exam subreddits.
 *
 * Reddit JSON API is read-only without OAuth (~60 req/min soft limit).
 * We fetch: top posts (time=year, limit=100) per sub, then for each post
 * top 10 comments via comment listing endpoint.
 *
 * Output: scripts/data/reddit-exam-signals-<date>.json
 *
 * Usage: node scripts/crawl-reddit-exam-subs.mjs
 *
 * No auth required. Uses only public JSON endpoints. Safe, idempotent.
 */

import fs from "node:fs/promises";
import path from "node:path";

const SUBS = [
  { name: "APStudents", exam: "AP" },
  { name: "SAT", exam: "SAT" },
  { name: "ACT", exam: "ACT" },
];

const UA = "StudentNestInsightsCrawler/1.0 (contact@studentnest.ai)";
const DELAY_MS = 1200; // stay well under 60 rpm

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function crawlSub({ name, exam }) {
  console.log(`\n── r/${name} ──`);
  const listUrl = `https://www.reddit.com/r/${name}/top.json?t=year&limit=100`;
  const list = await fetchJson(listUrl);
  const posts = list?.data?.children ?? [];
  console.log(`  Top posts (year): ${posts.length}`);

  const signals = [];
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i].data;
    // Skip low-value posts
    if (p.stickied || p.score < 20) continue;
    if (!p.selftext && !p.title) continue;

    await sleep(DELAY_MS);
    let comments = [];
    try {
      const cUrl = `https://www.reddit.com/r/${name}/comments/${p.id}.json?limit=10&sort=top`;
      const thread = await fetchJson(cUrl);
      // thread is [ postListing, commentListing ]
      const cArr = thread?.[1]?.data?.children ?? [];
      comments = cArr
        .filter((c) => c.kind === "t1" && c.data.body && c.data.score >= 5)
        .slice(0, 5)
        .map((c) => ({ score: c.data.score, body: c.data.body.slice(0, 1500) }));
    } catch (e) {
      console.log(`    [skip] comments for ${p.id}: ${e.message}`);
    }

    signals.push({
      exam,
      subreddit: name,
      postId: p.id,
      title: p.title,
      flair: p.link_flair_text ?? null,
      score: p.score,
      numComments: p.num_comments,
      createdUtc: p.created_utc,
      url: `https://reddit.com${p.permalink}`,
      body: (p.selftext ?? "").slice(0, 3000),
      topComments: comments,
    });
    if (i % 10 === 0) console.log(`  progress: ${i + 1}/${posts.length}`);
  }
  console.log(`  collected: ${signals.length} signals (filtered low-score/sticky)`);
  return signals;
}

async function main() {
  const all = [];
  for (const sub of SUBS) {
    try {
      const sigs = await crawlSub(sub);
      all.push(...sigs);
    } catch (e) {
      console.log(`  [ERR] r/${sub.name}: ${e.message}`);
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const outDir = path.resolve(process.cwd(), "scripts", "data");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `reddit-exam-signals-${date}.json`);
  await fs.writeFile(outPath, JSON.stringify({ date, signals: all }, null, 2));
  console.log(`\n✔ Wrote ${all.length} signals to ${outPath}`);

  const byExam = all.reduce((acc, s) => {
    acc[s.exam] = (acc[s.exam] ?? 0) + 1;
    return acc;
  }, {});
  console.log("By exam:", byExam);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
