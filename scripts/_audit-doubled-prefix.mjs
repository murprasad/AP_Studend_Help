import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon((process.env.DATABASE_URL || "").replace(/^["']|["']$/g, ""));

// Find all approved questions where ANY option starts with a letter-prefix like "A) ", "B) ", etc.
const all = await sql`SELECT id, course, options, "correctAnswer", "questionText", explanation, "isApproved" FROM questions WHERE "isApproved" = true`;

const PREFIX = /^[A-E][\)\.]\s/;
const bad = [];
for (const q of all) {
  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length === 0) continue;
  // Count how many options have the prefix pattern
  const prefixed = opts.filter(o => typeof o === "string" && PREFIX.test(o)).length;
  if (prefixed === opts.length && prefixed >= 2) {
    // All options have the doubled prefix
    bad.push({ id: q.id, course: q.course, opts, correctAnswer: q.correctAnswer });
  } else if (prefixed > 0) {
    // Partial — even worse, inconsistent
    bad.push({ id: q.id, course: q.course, opts, correctAnswer: q.correctAnswer, partial: prefixed });
  }
}

console.log(`Total approved questions: ${all.length}`);
console.log(`Affected (all options have leading letter-prefix): ${bad.filter(b => !b.partial).length}`);
console.log(`Partial (some but not all options prefixed): ${bad.filter(b => b.partial).length}`);

// Course breakdown
const byCourse = {};
for (const b of bad) {
  byCourse[b.course] = (byCourse[b.course] || 0) + 1;
}
console.log("\nBy course:");
console.log(JSON.stringify(byCourse, null, 2));

// Sample 5 examples
console.log("\nSample 5 affected questions:");
console.log(JSON.stringify(bad.slice(0, 5), null, 2));

// Sample 3 partial cases (concerning — could indicate inconsistent data)
const partial = bad.filter(b => b.partial);
if (partial.length > 0) {
  console.log("\nSample 3 PARTIAL cases (need careful handling):");
  console.log(JSON.stringify(partial.slice(0, 3), null, 2));
}

// Verify the regex is safe — find any approved option that starts with "A)" but is genuinely meant to be that (e.g., the actual content is "A) Some text"). Unlikely but check.
// Look at options that pass the regex but where correctAnswer letter aligns weirdly
const suspicious = bad.filter(b => {
  // If correctAnswer is "C" and options[2] starts with "C)" — that's the doubled-prefix pattern. Expected.
  if (!b.correctAnswer || !b.opts[b.correctAnswer.charCodeAt(0) - 65]) return false;
  const correctOpt = b.opts[b.correctAnswer.charCodeAt(0) - 65];
  // If correct option does NOT start with the matching letter, that's suspicious (e.g., correct=C but opts[2] starts with "A)")
  return !new RegExp(`^${b.correctAnswer}[\)\\.]`).test(correctOpt);
});
console.log(`\nMismatch cases (correctAnswer letter ≠ leading letter on its option): ${suspicious.length}`);
if (suspicious.length > 0) {
  console.log(JSON.stringify(suspicious.slice(0, 3), null, 2));
}
