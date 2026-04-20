// Phase B — Full corpus analysis.
//
// Reads every OfficialSample row and produces per-course markdown
// summaries: row counts by questionType, source, topic coverage,
// stem length distribution, and example exemplars. Output feeds the
// Phase C grounded generator (picks exemplars) + Phase D validation
// (establishes "CB-indistinguishable" quality floor).
//
// Output:
//   docs/content-analysis/INDEX.md        — cross-course roll-up
//   docs/content-analysis/{COURSE}.md     — per-course deep dive
//
// Usage: node scripts/analyze-corpus.mjs
//        node scripts/analyze-corpus.mjs --course=AP_PHYSICS_1
//
// Pure read operation — no DB writes, no commits. Safe to re-run.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const arg = process.argv.find((a) => a.startsWith("--course="));
const onlyCourse = arg ? arg.slice("--course=".length) : null;

function stemLengthStats(rows) {
  const lens = rows.map((r) => (r.questionText || "").length).sort((a, b) => a - b);
  if (lens.length === 0) return { min: 0, p25: 0, median: 0, p75: 0, max: 0, avg: 0 };
  const pct = (p) => lens[Math.floor((lens.length - 1) * p)];
  return {
    min: lens[0],
    p25: pct(0.25),
    median: pct(0.5),
    p75: pct(0.75),
    max: lens[lens.length - 1],
    avg: Math.round(lens.reduce((a, b) => a + b, 0) / lens.length),
  };
}

function summarizeCourse(course, rows) {
  const total = rows.length;
  if (total === 0) return null;

  const byType = {};
  const bySource = {};
  const byUnit = {};
  for (const r of rows) {
    byType[r.questionType] = (byType[r.questionType] || 0) + 1;
    bySource[r.sourceName || "unknown"] = (bySource[r.sourceName || "unknown"] || 0) + 1;
    if (r.unit) byUnit[r.unit] = (byUnit[r.unit] || 0) + 1;
  }

  const lenStats = stemLengthStats(rows);

  // Pick 3 exemplars — prefer the earliest real CB/CLEP/ACT source
  const ranked = [...rows].sort((a, b) => {
    const aCB = /College Board|ACT|DANTES|Prometric|CED|Past FRQ|Fact Sheet/.test(a.sourceName || "") ? 0 : 1;
    const bCB = /College Board|ACT|DANTES|Prometric|CED|Past FRQ|Fact Sheet/.test(b.sourceName || "") ? 0 : 1;
    if (aCB !== bCB) return aCB - bCB;
    return (b.year || 0) - (a.year || 0);
  });
  const exemplars = ranked.slice(0, 3);

  return {
    course,
    total,
    byType,
    bySource,
    byUnit,
    lenStats,
    exemplars,
  };
}

function renderCourseMarkdown(summary) {
  const { course, total, byType, bySource, byUnit, lenStats, exemplars } = summary;
  let md = `# ${course} — Corpus Analysis\n\n`;
  md += `**Total OfficialSample rows:** ${total}\n\n`;

  md += `## By question type\n\n| Type | Count |\n|---|---|\n`;
  for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    md += `| ${t} | ${n} |\n`;
  }

  md += `\n## By source\n\n| Source | Count |\n|---|---|\n`;
  for (const [s, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    md += `| ${s} | ${n} |\n`;
  }

  if (Object.keys(byUnit).length > 0) {
    md += `\n## By unit\n\n| Unit | Count |\n|---|---|\n`;
    for (const [u, n] of Object.entries(byUnit).sort((a, b) => b[1] - a[1])) {
      md += `| ${u} | ${n} |\n`;
    }
  }

  md += `\n## Stem length (chars)\n\n`;
  md += `| min | p25 | median | p75 | max | avg |\n|---|---|---|---|---|---|\n`;
  md += `| ${lenStats.min} | ${lenStats.p25} | ${lenStats.median} | ${lenStats.p75} | ${lenStats.max} | ${lenStats.avg} |\n`;

  md += `\n## Coverage signal\n\n`;
  if (total < 10) md += `⚠️ UNDER 10 — thin RAG grounding; prioritize additional ingestion for this course\n`;
  else if (total < 30) md += `🟡 10–29 — minimum viable RAG grounding\n`;
  else if (total < 100) md += `🟢 30–99 — good coverage\n`;
  else md += `⭐ 100+ — gold-standard coverage\n`;

  md += `\n## Exemplars (3 samples from top-ranked sources)\n\n`;
  for (let i = 0; i < exemplars.length; i++) {
    const e = exemplars[i];
    md += `### Exemplar ${i + 1} — ${e.sourceName || "unknown"}\n\n`;
    md += `**Type:** ${e.questionType}`;
    if (e.year) md += `  |  **Year:** ${e.year}`;
    if (e.unit) md += `  |  **Unit:** ${e.unit}`;
    md += `\n\n`;
    md += `**Question:**\n\n> ${(e.questionText || "(none)").slice(0, 400).replace(/\n/g, "\n> ")}\n\n`;
    if (e.stimulus) md += `**Stimulus:**\n\n\`\`\`\n${e.stimulus.slice(0, 300)}\n\`\`\`\n\n`;
    if (Array.isArray(e.options) && e.options.length > 0) {
      md += `**Options:**\n`;
      for (const o of e.options) md += `- ${String(o).slice(0, 120)}\n`;
      md += `\n`;
    }
    if (e.correctAnswer) md += `**Correct:** ${e.correctAnswer}\n\n`;
    if (e.sourceUrl) md += `**Source URL:** ${e.sourceUrl}\n\n`;
  }

  return md;
}

async function main() {
  const where = onlyCourse ? { course: onlyCourse } : {};
  const rows = await prisma.officialSample.findMany({
    where,
    orderBy: [{ course: "asc" }, { year: "desc" }],
  });

  // Group by course
  const byCourse = new Map();
  for (const r of rows) {
    if (!byCourse.has(r.course)) byCourse.set(r.course, []);
    byCourse.get(r.course).push(r);
  }

  const outDir = path.resolve("docs/content-analysis");
  fs.mkdirSync(outDir, { recursive: true });

  const summaries = [];
  for (const [course, courseRows] of byCourse.entries()) {
    const s = summarizeCourse(course, courseRows);
    if (!s) continue;
    summaries.push(s);
    const md = renderCourseMarkdown(s);
    fs.writeFileSync(path.join(outDir, `${course}.md`), md);
  }

  // Roll-up index
  summaries.sort((a, b) => b.total - a.total);
  let index = `# Corpus Analysis — Index\n\n`;
  index += `Generated: ${new Date().toISOString()}\n\n`;
  index += `**Total OfficialSample rows across ${summaries.length} courses:** ${summaries.reduce((s, c) => s + c.total, 0)}\n\n`;
  index += `## Per-course coverage\n\n| Course | Rows | Tier | Types |\n|---|---|---|---|\n`;
  for (const s of summaries) {
    let tier;
    if (s.total >= 100) tier = "⭐ gold";
    else if (s.total >= 30) tier = "🟢 good";
    else if (s.total >= 10) tier = "🟡 min";
    else tier = "⚠️ thin";
    const types = Object.keys(s.byType).join("/");
    index += `| [${s.course}](${s.course}.md) | ${s.total} | ${tier} | ${types} |\n`;
  }
  fs.writeFileSync(path.join(outDir, "INDEX.md"), index);

  console.log(`Wrote ${summaries.length} per-course files + INDEX.md to ${outDir}`);
  console.log(`Total rows analyzed: ${summaries.reduce((s, c) => s + c.total, 0)}`);

  // Summary to stdout
  const gold = summaries.filter((s) => s.total >= 100).length;
  const good = summaries.filter((s) => s.total >= 30 && s.total < 100).length;
  const min = summaries.filter((s) => s.total >= 10 && s.total < 30).length;
  const thin = summaries.filter((s) => s.total < 10).length;
  console.log(`Coverage: ⭐ gold ${gold}  🟢 good ${good}  🟡 min ${min}  ⚠️ thin ${thin}`);

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
