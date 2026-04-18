#!/usr/bin/env node
/**
 * Stage 2 extractor: read raw reddit signals, use Groq to extract
 * structured tips/strategies per post.
 *
 * Input:  scripts/data/reddit-exam-signals-<date>.json
 * Output: scripts/data/reddit-exam-tips-<date>.json
 *
 * Cheap: Groq llama-3.3-70b, free tier, ~10¢ per 1k posts.
 *
 * Usage:
 *   node scripts/extract-reddit-tips.mjs              # latest signals file
 *   node scripts/extract-reddit-tips.mjs --date 2026-04-17
 */

import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const dateArg = args.indexOf("--date") >= 0 ? args[args.indexOf("--date") + 1] : null;

// Load .env
try {
  const envText = await fs.readFile(".env", "utf-8");
  for (const line of envText.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
} catch { /* .env optional */ }

const GROQ_KEY = process.env.GROQ_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!GROQ_KEY && !ANTHROPIC_KEY) { console.error("Need GROQ_API_KEY or ANTHROPIC_API_KEY"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGroq(prompt) {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You extract exam-prep strategies from Reddit posts. Return ONLY valid JSON." },
            { role: "user", content: prompt },
          ],
          max_tokens: 800,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) {
        if (res.status === 429) { await sleep(10000); continue; }
        const body = await res.text();
        if (body.includes("spend_limit_reached")) throw new Error("groq_spend_limit");
        throw new Error(`${res.status}`);
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (e) {
      if (e.message === "groq_spend_limit") throw e;
    }
  }
  throw new Error("all Groq models failed");
}

async function callSonnet(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: "You extract exam-prep strategies from Reddit posts. Return ONLY valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 100)}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// Router: try Groq first, fall back to Haiku on spend-limit
let groqBlocked = false;
async function callAI(prompt) {
  if (!groqBlocked && GROQ_KEY) {
    try { return await callGroq(prompt); }
    catch (e) {
      if (e.message === "groq_spend_limit") {
        console.log("  [!] Groq spend limit reached — switching to Anthropic Haiku for rest of run");
        groqBlocked = true;
      }
    }
  }
  if (ANTHROPIC_KEY) return await callSonnet(prompt);
  throw new Error("no AI provider available");
}

const EXTRACT_PROMPT = (sig) => `Extract actionable exam-prep strategies from this Reddit post.

SUBREDDIT: r/${sig.subreddit} (${sig.exam} exam)
TITLE: ${sig.title}
BODY: ${sig.body.slice(0, 2000)}

TOP COMMENTS (score ≥5):
${sig.topComments.map((c, i) => `[${i + 1}] (${c.score} pts) ${c.body.slice(0, 600)}`).join("\n")}

Return ONLY a JSON object (no markdown, no preamble):
{
  "tips": [
    {
      "strategy": "<one sentence actionable tip>",
      "category": "time-management | resources | practice-method | test-day | topic-focus | psychology | other",
      "exam": "${sig.exam}",
      "course": "<specific course if named, else null>",
      "evidence": "<verbatim quote from post/comment that supports this tip>",
      "confidence": "<high if multiple mentions or first-person success, medium if opinion, low if unclear>"
    }
  ],
  "themes": ["<1-3 word theme>"],
  "skip": false
}

If the post is noise/jokes/unrelated, return {"tips": [], "themes": [], "skip": true}.
Extract 0-3 tips per post. Prefer quality over quantity.`;

async function main() {
  const dataDir = path.resolve(process.cwd(), "scripts", "data");
  const files = (await fs.readdir(dataDir)).filter((f) => f.startsWith("reddit-exam-signals-") && f.endsWith(".json"));
  if (files.length === 0) { console.error("No signals file found. Run crawl-reddit-exam-subs.mjs first."); process.exit(1); }
  files.sort().reverse();
  const target = dateArg ? `reddit-exam-signals-${dateArg}.json` : files[0];
  const inPath = path.join(dataDir, target);
  console.log(`Reading: ${inPath}`);
  const raw = JSON.parse(await fs.readFile(inPath, "utf-8"));

  const tips = [];
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const sig of raw.signals) {
    processed++;
    try {
      const resp = await callAI(EXTRACT_PROMPT(sig));
      const cleaned = resp.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no JSON");
      const parsed = JSON.parse(match[0]);
      if (parsed.skip || !parsed.tips?.length) { skipped++; }
      else {
        for (const tip of parsed.tips) {
          tips.push({ ...tip, sourceUrl: sig.url, postTitle: sig.title, postScore: sig.score });
        }
      }
    } catch (e) {
      errors++;
    }
    if (processed % 10 === 0) {
      console.log(`  ${processed}/${raw.signals.length} — tips: ${tips.length}, skipped: ${skipped}, errors: ${errors}`);
    }
    await sleep(1500); // Groq rate limit
  }

  const date = new Date().toISOString().slice(0, 10);
  const outPath = path.join(dataDir, `reddit-exam-tips-${date}.json`);
  await fs.writeFile(outPath, JSON.stringify({ date, sourceFile: target, processed, skipped, errors, tips }, null, 2));
  console.log(`\n✔ Wrote ${tips.length} tips to ${outPath}`);
  console.log(`By category: ${JSON.stringify(tips.reduce((a, t) => { a[t.category] = (a[t.category] ?? 0) + 1; return a; }, {}))}`);
  console.log(`By exam: ${JSON.stringify(tips.reduce((a, t) => { a[t.exam] = (a[t.exam] ?? 0) + 1; return a; }, {}))}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
