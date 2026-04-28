// Strip telegraphing hint-labels from MCQ option text. CB-savvy students
// spot these instantly and lose trust in the bank.
//
// Patterns we kill (case-insensitive, anywhere in option string):
//   - "Correct:" / "Incorrect:" prefix labels (chem boiling-points style)
//   - One-word descriptive tags after numeric answers ("0.40 Sport job",
//     "0.15 Low rate", "0.30 Sport part-time", "0.375 High chance")
//
// Strategy:
//   1. Find approved MCQs where ANY option contains a hint-label pattern.
//   2. Strip the label, keep the actual answer text.
//   3. Mark with modelUsed = "hint-labels-stripped-2026-04-28".
//
// Idempotent. No regeneration — just text cleanup.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "hint-labels-stripped-2026-04-28";

const rows = await sql`
  SELECT id, course::text AS course, options
  FROM questions
  WHERE "isApproved" = true
    AND "questionType" = 'MCQ'
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
`;

console.log(`Scanning ${rows.length} approved MCQs for hint-label leaks…`);

let scanned = 0, fixed = 0;
const samples = [];

// Hint-label patterns to strip
const PATTERNS = [
  // "A) Correct: CH₄ (London)..." → "A) CH₄ (London)..."
  { re: /^(\s*[A-E][\)\.]?\s*)Correct:\s*/i, replace: "$1" },
  { re: /^(\s*[A-E][\)\.]?\s*)Incorrect:\s*[^—:]*[—:]\s*/i, replace: "$1" },
  { re: /^(\s*[A-E][\)\.]?\s*)Incorrect:\s*/i, replace: "$1" },
  // "0.40 Sport job" → "0.40" (when followed by a 1-3 word descriptive tag)
  // We only strip if the tag is a short descriptor without typical sentence
  // punctuation — preserves "0.40 of all participants chose..." sentences.
  { re: /^(\s*[A-E][\)\.]?\s*[\d./]+)\s+([A-Z][a-z]+(\s[a-z]+)?\s*[a-z]*)\s*$/, replace: "$1" },
];

for (const r of rows) {
  scanned++;
  let opts;
  try { opts = typeof r.options === "string" ? JSON.parse(r.options) : r.options; }
  catch { continue; }
  if (!Array.isArray(opts)) continue;

  let changed = false;
  const newOpts = opts.map((o) => {
    let s = String(o);
    const orig = s;
    for (const p of PATTERNS) s = s.replace(p.re, p.replace);
    if (s !== orig) changed = true;
    return s;
  });

  if (!changed) continue;

  if (samples.length < 5) {
    samples.push({ id: r.id, course: r.course, before: opts, after: newOpts });
  }

  await sql`
    UPDATE questions
    SET options = ${JSON.stringify(newOpts)}::jsonb,
        "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER},
        "updatedAt" = NOW()
    WHERE id = ${r.id}
  `;
  fixed++;
}

console.log(`\nScanned: ${scanned}`);
console.log(`Fixed:   ${fixed}`);
console.log(`\nSamples:`);
for (const s of samples) {
  console.log(`\n— ${s.id.slice(0,8)} (${s.course}) —`);
  for (let i = 0; i < s.before.length; i++) {
    if (s.before[i] !== s.after[i]) {
      console.log(`  BEFORE: ${s.before[i]}`);
      console.log(`  AFTER : ${s.after[i]}`);
    }
  }
}
