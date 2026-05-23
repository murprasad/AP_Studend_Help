/**
 * Sample-Based Coverage Audit — the gap analysis that actually measures
 * what users see.
 *
 * For each scraped CB sample question (in data/sample-questions/<COURSE>.json):
 *   1. Extract key concept (Haiku, 1 call)
 *   2. Search PL pool for keyword overlap (SQL ILIKE)
 *   3. Ask Haiku: "Does PL have an equivalent question on this concept?"
 *      Pass the sample stem + top 3 PL matches.
 *   4. Output verdict: COVERED / PARTIAL / GAP + suggested fill-in topic.
 *
 * Run after data/sample-questions/<COURSE>.json files are populated.
 *
 * Usage:
 *   node scripts/_sample-coverage-audit.mjs --course=CLEP_BIOLOGY
 *   node scripts/_sample-coverage-audit.mjs --all     # every file in data/sample-questions/
 */
import "dotenv/config";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const ALL = !!args.all;
const COURSE_FILTER = args.course ?? null;

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) { console.error("ANTHROPIC_API_KEY required"); process.exit(1); }

let courses = [];
if (ALL) {
  courses = readdirSync("data/sample-questions/")
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
} else if (COURSE_FILTER) {
  courses = [COURSE_FILTER];
} else {
  console.error("Usage: --course=<COURSE> or --all");
  process.exit(1);
}

const COVERAGE_PROMPT = `You are auditing a CLEP/AP exam-prep question pool to find topic gaps.

You will be given:
1. A REFERENCE question from the official College Board sample set.
2. The TOP MATCHING questions from the prep platform's pool (already filtered by keyword overlap).

Your job: decide if the prep platform has adequate coverage of the REFERENCE question's CONCEPT.

Categories:
- COVERED — the platform has at least one question testing the same concept (even if worded differently). Student preparing on the platform would not be surprised by the reference question.
- PARTIAL — the platform mentions the concept but doesn't directly test it (e.g., concept appears in passing, but no question requires applying it).
- GAP — the platform has NO question testing this concept. Student would be unprepared.

Reply in this exact format:
verdict: COVERED|PARTIAL|GAP
reason: <1 sentence>
suggested_topic: <short topic phrase if GAP, else "—">`;

async function haikuJudge(referenceStem, referenceOptions, platformMatches) {
  const matchBlock = platformMatches.length === 0
    ? "(no keyword matches found in platform pool)"
    : platformMatches.map((m, i) => `${i+1}. ${m.questionText.slice(0, 200)}`).join("\n");
  const userMsg = `REFERENCE (CB official sample):\nStem: ${referenceStem}\nOptions:\n${referenceOptions.join("\n")}\n\nPLATFORM POOL TOP MATCHES:\n${matchBlock}\n\nVerdict?`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: COVERAGE_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) return { verdict: "ERROR", reason: `haiku ${res.status}`, suggested_topic: "—" };
    const j = await res.json();
    const text = j?.content?.[0]?.text || "";
    const verdict = text.match(/verdict:\s*(COVERED|PARTIAL|GAP)/i)?.[1]?.toUpperCase() || "ERROR";
    const reason = text.match(/reason:\s*(.+)/i)?.[1]?.trim().slice(0, 200) || "";
    const suggested = text.match(/suggested_topic:\s*(.+)/i)?.[1]?.trim().slice(0, 100) || "—";
    return { verdict, reason, suggested_topic: suggested };
  } catch (e) { return { verdict: "ERROR", reason: e.message.slice(0, 100), suggested_topic: "—" }; }
}

// Crude keyword extraction — take 4-6 longest distinctive words from stem + options
function keywordsFromQuestion(stem, options) {
  const STOP = new Set(["the","and","or","of","a","an","in","on","to","for","is","are","with","by","as","at","from","that","this","which","what","who","when","where","why","how","be","been","being","have","has","had","do","does","did","not","no","yes","but","so","if","else","then","than","both","each","all","any","some","few","more","most","less","other","such","only","own","same","just","like","also","very","can","cannot","could","should","would","may","might","must","shall","will","into","over","under","again","up","down","out","off","through","during","before","after","between","because","while","about","against","among","throughout","within","following","best","one","two","another","first","second"]);
  const text = (stem + " " + options.join(" ")).toLowerCase();
  const tokens = text.replace(/[^a-z\s]/g, " ").split(/\s+/)
    .filter((t) => t.length >= 5 && !STOP.has(t));
  // Deduplicate, keep order
  const seen = new Set();
  const unique = tokens.filter((t) => seen.has(t) ? false : (seen.add(t), true));
  return unique.slice(0, 8);
}

const overall = {};

for (const course of courses) {
  const filePath = `data/sample-questions/${course}.json`;
  if (!existsSync(filePath)) { console.log(`SKIP ${course} — no sample file`); continue; }
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  const samples = data.questions || [];
  if (samples.length === 0) continue;
  console.log(`\n══ ${course} — ${samples.length} CB samples ══`);

  const results = [];
  for (const sample of samples) {
    const stem = sample.stem || sample.questionText || "";
    const options = sample.options || [];
    const keywords = keywordsFromQuestion(stem, options);
    if (keywords.length === 0) continue;

    // SQL search — find PL questions matching ANY of top-4 keywords (UNION approach)
    const top = keywords.slice(0, 4);
    const allMatches = [];
    for (const kw of top) {
      let rows = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          rows = await sql`
            SELECT id, "questionText" FROM questions
            WHERE course::text = ${course} AND "isApproved" = true AND "questionType" = 'MCQ'
              AND ("questionText" ILIKE ${"%" + kw + "%"} OR explanation ILIKE ${"%" + kw + "%"})
            LIMIT 3
          `;
          break;
        } catch (e) {
          console.log(`    SQL retry ${attempt+1}: ${e.message?.slice(0, 60)}`);
          await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        }
      }
      if (!rows) { rows = []; }
      for (const r of rows) {
        if (!allMatches.some((m) => m.id === r.id)) allMatches.push(r);
        if (allMatches.length >= 5) break;
      }
      if (allMatches.length >= 5) break;
    }
    const matches = allMatches;

    // Haiku judges
    const judgment = await haikuJudge(stem, options, matches);
    const out = { q: sample.q, stem: stem.slice(0, 80), keywords, matchCount: matches.length, ...judgment };
    results.push(out);
    const tag = judgment.verdict === "COVERED" ? "✓" : judgment.verdict === "PARTIAL" ? "△" : judgment.verdict === "GAP" ? "✗" : "?";
    console.log(`  ${tag} Q${sample.q}: ${judgment.verdict.padEnd(8)} — ${judgment.reason.slice(0, 80)}`);
    if (judgment.verdict === "GAP") console.log(`      → suggested fill: ${judgment.suggested_topic}`);
    // Incremental save — survives mid-run crashes
    try {
      const dateStr2 = new Date().toISOString().slice(0, 10);
      const suffix2 = COURSE_FILTER ? `-${COURSE_FILTER}` : "";
      writeFileSync(`data/sample-coverage-${dateStr2}${suffix2}.json`, JSON.stringify({ ...overall, [course]: results }, null, 2));
    } catch {}
    await new Promise((r) => setTimeout(r, 1500)); // throttle for Anthropic tier 1
  }
  overall[course] = results;
}

const dateStr = new Date().toISOString().slice(0, 10);
const suffix = COURSE_FILTER ? `-${COURSE_FILTER}` : "";
const outPath = `data/sample-coverage-${dateStr}${suffix}.json`;
writeFileSync(outPath, JSON.stringify(overall, null, 2));
console.log(`\nSaved: ${outPath}`);

// Summary
console.log(`\n══ COVERAGE SUMMARY ══`);
for (const [c, results] of Object.entries(overall)) {
  const cov = results.filter((r) => r.verdict === "COVERED").length;
  const par = results.filter((r) => r.verdict === "PARTIAL").length;
  const gap = results.filter((r) => r.verdict === "GAP").length;
  const tot = results.length;
  const covPct = ((cov / tot) * 100).toFixed(0);
  console.log(`  ${c.padEnd(40)} ${cov}/${tot} covered (${covPct}%) | ${par} partial | ${gap} GAP`);
  const gaps = results.filter((r) => r.verdict === "GAP").map((r) => r.suggested_topic).filter((t) => t !== "—");
  if (gaps.length > 0) console.log(`     gap topics: ${gaps.join(" · ")}`);
}
