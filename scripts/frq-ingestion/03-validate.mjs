#!/usr/bin/env node
/**
 * Stage 3 — Validate extracted FRQ JSON before DB seed.
 *
 * Reads every data/cb-frqs/{course}/{year}-extracted.json and asserts:
 *   - questions array non-empty
 *   - per question: questionNumber, type, promptText, totalPoints, rubric all present
 *   - rubric.points sum to totalPoints (±1 for rounding)
 *   - rubric is non-empty array
 *   - promptText length >= 50 chars (reject obvious extraction errors)
 *
 * Outputs:
 *   - Per-file pass/fail report
 *   - Writes data/cb-frqs/_validated.json with the cleaned, ready-to-seed list
 *   - Failures dropped (logged but excluded from the seed list)
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const PDF_ROOT = join(ROOT, "data", "cb-frqs");

async function listExtractedFiles() {
  const out = [];
  const courses = await readdir(PDF_ROOT, { withFileTypes: true });
  for (const c of courses) {
    if (!c.isDirectory()) continue;
    const dir = join(PDF_ROOT, c.name);
    const files = await readdir(dir);
    for (const f of files) {
      if (f.endsWith("-extracted.json")) {
        const m = f.match(/^(\d{4})-extracted\.json$/);
        if (m) out.push({ course: c.name, year: Number(m[1]), path: join(dir, f) });
      }
    }
  }
  return out;
}

function validateFRQ(q, course, year) {
  const issues = [];
  if (typeof q.questionNumber !== "number") issues.push("missing questionNumber");
  if (!q.type || typeof q.type !== "string") issues.push("missing type");
  if (!q.promptText || q.promptText.length < 50) issues.push(`promptText too short (${q.promptText?.length ?? 0} chars)`);
  if (typeof q.totalPoints !== "number" || q.totalPoints <= 0) issues.push(`invalid totalPoints (${q.totalPoints})`);
  if (!Array.isArray(q.rubric) || q.rubric.length === 0) issues.push("rubric missing or empty");

  if (Array.isArray(q.rubric) && q.rubric.length > 0) {
    const pointSum = q.rubric.reduce((sum, r) => sum + (typeof r.points === "number" ? r.points : 0), 0);
    if (Math.abs(pointSum - q.totalPoints) > 1) {
      issues.push(`rubric points sum ${pointSum} ≠ totalPoints ${q.totalPoints}`);
    }
    for (const [i, r] of q.rubric.entries()) {
      if (!r.step || typeof r.step !== "string") issues.push(`rubric[${i}].step missing`);
      if (typeof r.points !== "number") issues.push(`rubric[${i}].points not a number`);
    }
  }

  return issues;
}

async function main() {
  const files = await listExtractedFiles();
  console.log(`\n🔬 FRQ ingestion stage 3 — validation\n`);
  console.log(`Found ${files.length} extracted files.\n`);

  const validated = [];
  let totalQs = 0, validQs = 0, droppedQs = 0;
  const droppedDetail = [];

  for (const { course, year, path } of files) {
    let parsed;
    try {
      parsed = JSON.parse(await readFile(path, "utf8"));
    } catch (e) {
      console.log(`✗ ${course} ${year}: file unparseable (${e instanceof Error ? e.message : String(e)})`);
      continue;
    }

    if (!Array.isArray(parsed.questions)) {
      console.log(`✗ ${course} ${year}: no questions array`);
      continue;
    }

    let kept = 0, dropped = 0;
    for (const q of parsed.questions) {
      totalQs++;
      const issues = validateFRQ(q, course, year);
      if (issues.length === 0) {
        validated.push({
          course,
          year,
          questionNumber: q.questionNumber,
          type: q.type,
          unit: q.unit || null,
          skill: q.skill || null,
          promptText: q.promptText,
          stimulus: q.stimulus || null,
          totalPoints: q.totalPoints,
          rubric: q.rubric,
          sampleResponse: q.sampleResponse || null,
          // Provenance
          source: "college_board_released",
          sourceUrl: `https://apcentral.collegeboard.org/courses/${course.toLowerCase().replace(/_/g, "-").replace(/^ap-/, "ap-")}/exam`,
        });
        kept++;
        validQs++;
      } else {
        dropped++;
        droppedQs++;
        droppedDetail.push({ course, year, questionNumber: q.questionNumber, issues });
      }
    }

    const tag = dropped === 0 ? "✓" : kept === 0 ? "✗" : "⚠";
    console.log(`${tag} ${course} ${year}: ${kept} valid, ${dropped} dropped`);
  }

  await writeFile(
    join(PDF_ROOT, "_validated.json"),
    JSON.stringify(validated, null, 2),
  );

  console.log(`\n── Summary ──`);
  console.log(`  Total questions: ${totalQs}`);
  console.log(`  Valid (ready to seed): ${validQs}`);
  console.log(`  Dropped: ${droppedQs}`);
  if (droppedDetail.length > 0 && droppedDetail.length <= 20) {
    console.log(`\n  Dropped details:`);
    for (const d of droppedDetail) {
      console.log(`    ${d.course} ${d.year} Q${d.questionNumber}: ${d.issues.join("; ")}`);
    }
  }
  console.log(`\n📝 Wrote ${PDF_ROOT}/_validated.json with ${validQs} ready-to-seed FRQs`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
