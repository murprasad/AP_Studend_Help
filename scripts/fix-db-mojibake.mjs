// DB-side mojibake fix for stimulus + explanation + questionText.
// PowerShell-encoding artifacts that survive into DB content show as
// raw markup to students:
//   "	o" instead of "→"  (LaTeX \to mangled by tab-replacement)
//   "â€"" instead of "—"  (em-dash mangled by Latin-1 mis-decode)
//   etc.
//
// Same patterns as scripts/fix-mojibake.mjs but applied to question rows.
// Idempotent — only updates rows that actually contain a pattern.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const FIXES = [
  ["	o", "\\to"],            // tab+o (broken \to from LaTeX) — restore as raw \to so KaTeX can render
  ["	ext", "\\text"],         // \text mangled
  ["	imes", "\\times"],
  ["	heta", "\\theta"],
  ["â€”", "—"], ["â€“", "—"],
  ["â€”s", "—"], ["â€“s", "—"],
  ["â€™", "'"], ["â€˜", "'"],
  ["â€œ", "\""], ["â€", "\""],
  ["â€¦", "…"], ["â€¢", "•"],
  ["â‰¥", "≥"], ["â‰¤", "≤"],
  ["Â°", "°"], ["Â ", " "],
];

const args = process.argv.slice(2);
const dry = args.includes("--dry");

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, explanation
  FROM questions
  WHERE "isApproved" = true
`;

console.log(`Scanning ${rows.length} approved questions for mojibake/LaTeX corruption…`);
let fixed = 0;
const samples = [];

for (const r of rows) {
  let qt = r.questionText ?? "";
  let st = r.stimulus ?? "";
  let ex = r.explanation ?? "";
  const orig = { qt, st, ex };

  for (const [bad, good] of FIXES) {
    qt = qt.split(bad).join(good);
    st = st.split(bad).join(good);
    ex = ex.split(bad).join(good);
  }

  if (qt === orig.qt && st === orig.st && ex === orig.ex) continue;

  fixed++;
  if (samples.length < 3) {
    samples.push({
      id: r.id.slice(0, 8),
      course: r.course,
      diffs: [
        orig.qt !== qt ? `Q: "${orig.qt.slice(0, 60)}…" → "${qt.slice(0, 60)}…"` : null,
        orig.st !== st ? `S: "${orig.st.slice(0, 60)}…" → "${st.slice(0, 60)}…"` : null,
        orig.ex !== ex ? `E: "${orig.ex.slice(0, 60)}…" → "${ex.slice(0, 60)}…"` : null,
      ].filter(Boolean),
    });
  }

  if (!dry) {
    await sql`
      UPDATE questions
      SET "questionText" = ${qt},
          stimulus = ${st === "" ? null : st},
          explanation = ${ex},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
  }
}

console.log(`\nFixed: ${fixed} questions`);
console.log(`\nSamples:`);
for (const s of samples) {
  console.log(`\n${s.id} ${s.course}`);
  for (const d of s.diffs) console.log(`  ${d}`);
}
