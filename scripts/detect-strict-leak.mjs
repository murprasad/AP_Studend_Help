// Stricter leak detector — catches what regex + AI-judge let through.
//
// Adds:
//   1. Lemmatization: strip trailing "s"/"es"/"ing" so "hubs" matches "hub".
//   2. Lower n-gram threshold (3-token match counts as leak).
//   3. Stop-word filter: don't count common words ("the", "a", "of", "and", etc.).
//   4. Order-insensitive: 60% of answer's content tokens appear in stim → leak.
//
// Run AFTER ai-judge has tagged the bank. Skip already-unapproved.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "strict-leak-2026-04-28";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const groupArg = args.find(a => a.startsWith("--group="))?.split("=")[1] ?? "AP";
const groupPrefix = groupArg === "SAT" ? "SAT_" : groupArg === "ACT" ? "ACT_" : groupArg === "CLEP" ? "CLEP_" : "AP_";

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "or", "is", "are", "was", "were", "be", "been",
  "to", "in", "on", "at", "by", "for", "with", "as", "from", "this", "that",
  "these", "those", "it", "its", "their", "his", "her", "they", "them",
  "which", "who", "whom", "what", "where", "when", "why", "how",
  "such", "some", "any", "all", "each", "every", "both", "more", "most",
  "would", "could", "should", "can", "may", "might", "will", "shall",
  "have", "has", "had", "do", "does", "did", "not", "no", "nor",
  "but", "if", "than", "then", "so", "very", "much", "many",
]);

function lemmatize(token) {
  // Strip trailing 's', 'es', 'ing' to handle plurals/gerunds.
  if (token.length <= 4) return token;
  if (token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (token.endsWith("es") && !token.endsWith("ses")) return token.slice(0, -2);
  if (token.endsWith("ing") && token.length > 6) return token.slice(0, -3);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function tokens(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/^[a-e][\)\.]\s*/i, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(t => lemmatize(t))
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function ngramSet(tokens, n) {
  const set = new Set();
  for (let i = 0; i + n <= tokens.length; i++) set.add(tokens.slice(i, i + n).join(" "));
  return set;
}

function longestNgramMatch(aTokens, bTokens) {
  let longest = 0;
  for (let n = Math.min(aTokens.length, bTokens.length, 12); n >= 2; n--) {
    const aSet = ngramSet(aTokens, n);
    for (const phrase of aSet) {
      if (ngramSet(bTokens, n).has(phrase)) return n;
    }
  }
  return longest;
}

function tokenOverlap(aTokens, bTokens) {
  if (aTokens.length === 0) return 0;
  const bset = new Set(bTokens);
  return aTokens.filter(t => bset.has(t)).length / aTokens.length;
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
  FROM questions
  WHERE course::text LIKE ${groupPrefix + '%'}
    AND "isApproved" = true
    AND "questionType" = 'MCQ'
    AND stimulus IS NOT NULL
    AND LENGTH(stimulus) > 30
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
`;

console.log(`Strict leak scan — ${groupArg}, ${rows.length} candidates`);
const samples = [];
let leak3 = 0, leak60 = 0, leak = 0;

for (const r of rows) {
  let opts;
  try { opts = typeof r.options === "string" ? JSON.parse(r.options) : r.options; } catch { continue; }
  if (!Array.isArray(opts)) continue;
  const correctLetter = String(r.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);
  const idx = "ABCDE".indexOf(correctLetter);
  if (idx < 0 || idx >= opts.length) continue;

  const aTokens = tokens(opts[idx]);
  if (aTokens.length < 3) continue;  // skip 1-2 content-token answers (math values)
  const sTokens = tokens(r.stimulus);

  const longest = longestNgramMatch(aTokens, sTokens);
  const overlap = tokenOverlap(aTokens, sTokens);

  // Require BOTH a 3+ token verbatim match AND the answer be supported in stim.
  // OR a very high overlap (≥75%) WITH at least 2 token n-gram (some phrasal echo).
  // This filters out govt/civics false positives where common terms align but no
  // actual phrase leak exists.
  const isLeak = (longest >= 3 && overlap >= 0.30) ||
                 (longest >= 2 && overlap >= 0.75 && aTokens.length >= 4);
  if (!isLeak) continue;

  leak++;
  if (longest >= 3) leak3++;
  if (overlap >= 0.60) leak60++;

  if (samples.length < 10) {
    samples.push({
      id: r.id.slice(0, 8), course: r.course,
      ans: String(opts[idx]).slice(0, 80),
      longest, overlap: overlap.toFixed(2),
      aTokens: aTokens.slice(0, 6).join(" "),
      stim: r.stimulus.slice(0, 100),
    });
  }

  if (!dry) {
    await sql`
      UPDATE questions
      SET "isApproved" = false,
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':unapproved'},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
  }
}

console.log(`Leaks: ${leak} | 3-gram match: ${leak3} | 60% overlap: ${leak60}`);
console.log(`\nSamples:`);
for (const s of samples) {
  console.log(`\n  ${s.id} ${s.course} — longest=${s.longest} overlap=${s.overlap}`);
  console.log(`  ANS:    ${s.ans}`);
  console.log(`  STIM:   ${s.stim}…`);
}
