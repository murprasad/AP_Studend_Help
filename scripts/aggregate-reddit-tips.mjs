#!/usr/bin/env node
/**
 * Stage 3 aggregator: cluster similar tips, find themes with ≥N
 * corroboration, emit promotion candidates for Sage FAQ / strategy tips.
 *
 * Uses Groq to cluster by semantic similarity (small batch) then aggregates.
 *
 * Input:  scripts/data/reddit-exam-tips-<date>.json
 * Output: scripts/data/reddit-exam-themes-<date>.json
 *
 * Usage: node scripts/aggregate-reddit-tips.mjs [--min-corroboration 3]
 */

import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const MIN_CORROB = parseInt(getArg("min-corroboration", "3"), 10);

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
} catch { }

const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("No GROQ_API_KEY"); process.exit(1); }

async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You cluster and deduplicate exam-prep tips. Return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      max_tokens: 2500,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function clusterBatch(exam, tips) {
  const prompt = `You are given a list of exam-prep tips scraped from Reddit for ${exam}. Cluster them by shared strategy/theme. Duplicate tips that say the same thing should collapse into ONE canonical theme with a corroboration count.

TIPS (${tips.length}):
${tips.map((t, i) => `[${i}] cat=${t.category} | ${t.strategy}`).join("\n")}

Return ONLY valid JSON (no markdown):
{
  "themes": [
    {
      "canonical": "<one-sentence canonical form of this strategy>",
      "category": "time-management | resources | practice-method | test-day | topic-focus | psychology | other",
      "memberIndexes": [<indexes from the TIPS list that belong to this theme>]
    }
  ]
}

Merge aggressively — if two tips are substantively the same advice, they belong to the same theme.
Only form themes with ≥2 members. Singleton tips should not appear.`;

  const resp = await callGroq(prompt);
  const cleaned = resp.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON");
  return JSON.parse(match[0]);
}

async function main() {
  const dataDir = path.resolve(process.cwd(), "scripts", "data");
  const files = (await fs.readdir(dataDir)).filter((f) => f.startsWith("reddit-exam-tips-") && f.endsWith(".json"));
  if (files.length === 0) { console.error("No tips file."); process.exit(1); }
  files.sort().reverse();
  const inPath = path.join(dataDir, files[0]);
  console.log(`Reading: ${inPath}`);
  const raw = JSON.parse(await fs.readFile(inPath, "utf-8"));

  // Group by exam for cluster calls (keep prompt size manageable)
  const byExam = raw.tips.reduce((acc, t) => { (acc[t.exam] ??= []).push(t); return acc; }, {});
  const result = { date: new Date().toISOString().slice(0, 10), sourceFile: files[0], minCorroboration: MIN_CORROB, themes: [] };

  for (const [exam, tips] of Object.entries(byExam)) {
    console.log(`\nClustering ${exam}: ${tips.length} tips`);
    // Chunk if >80 tips
    const CHUNK = 80;
    const allThemes = [];
    for (let i = 0; i < tips.length; i += CHUNK) {
      const chunk = tips.slice(i, i + CHUNK);
      try {
        const { themes } = await clusterBatch(exam, chunk);
        // Denormalize member indexes to actual tip objects + offset
        for (const t of themes ?? []) {
          const members = (t.memberIndexes ?? []).map((idx) => chunk[idx]).filter(Boolean);
          if (members.length >= MIN_CORROB) {
            allThemes.push({
              exam,
              canonical: t.canonical,
              category: t.category,
              corroborationCount: members.length,
              courses: [...new Set(members.map((m) => m.course).filter(Boolean))],
              sampleEvidence: members.slice(0, 3).map((m) => ({ quote: m.evidence, source: m.sourceUrl, title: m.postTitle })),
            });
          }
        }
      } catch (e) {
        console.log(`  [ERR] chunk ${i}: ${e.message}`);
      }
    }
    // Sort by corroboration desc
    allThemes.sort((a, b) => b.corroborationCount - a.corroborationCount);
    result.themes.push(...allThemes);
  }

  const outPath = path.join(dataDir, `reddit-exam-themes-${result.date}.json`);
  await fs.writeFile(outPath, JSON.stringify(result, null, 2));
  console.log(`\n✔ ${result.themes.length} themes (≥${MIN_CORROB} corrob) → ${outPath}`);
  console.log(`\nTop themes by exam:`);
  const byExamThemes = result.themes.reduce((a, t) => { (a[t.exam] ??= []).push(t); return a; }, {});
  for (const [exam, ts] of Object.entries(byExamThemes)) {
    console.log(`\n  ${exam}:`);
    for (const t of ts.slice(0, 5)) console.log(`    [${t.corroborationCount}×] ${t.canonical} (${t.category})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
