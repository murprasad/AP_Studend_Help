// Fix LaTeX-formatting bugs in SAT/ACT/PSAT approved bank.
//
// Issue: User report 2026-06-03 "Few Questions arent formatted."
// Root cause: questions contain raw LaTeX commands (\frac, \sqrt, \pi,
// \tfrac, etc.) without $...$ delimiters. The markdown renderer treats
// them as literal text, so students see "\frac{1}{2}" instead of a
// rendered fraction.
//
// Fix:
//   1. Find approved Qs with raw LaTeX commands NOT inside $...$ pairs
//   2. Wrap each LaTeX run with $...$
//   3. Apply same to options + explanation
//   4. Dry-run by default; pass --apply to write
//
// Run:
//   node scripts/_fix-unformatted-latex.mjs                    # dry-run
//   node scripts/_fix-unformatted-latex.mjs --apply --limit=50 # write 50

import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const FLAGS = process.argv.slice(2);
const APPLY = FLAGS.includes("--apply");
const LIMIT = parseInt(FLAGS.find((f) => f.startsWith("--limit="))?.split("=")[1] ?? "50", 10);
const COURSE = FLAGS.find((f) => f.startsWith("--course="))?.split("=")[1] ?? null;

// LaTeX commands we know about — the regex matches the command + its
// argument groups. Captures the whole expression so we can wrap in $...$.
//
// Approach: split text into segments inside $...$ (math mode, leave alone)
// and outside (raw). Inside outside-segments, find LaTeX command sequences
// and wrap them. This avoids double-wrapping.
const LATEX_COMMANDS = [
  "frac", "tfrac", "dfrac", "sqrt", "sum", "prod", "int", "lim",
  "infty", "pi", "alpha", "beta", "gamma", "delta", "theta", "lambda",
  "cdot", "times", "div", "le", "ge", "neq", "approx", "leq", "geq",
  "log", "ln", "sin", "cos", "tan", "csc", "sec", "cot",
  "circ", "degree", "vec", "overline", "underline", "boxed",
];

// Match a LaTeX command and its argument groups. Supports:
//   \frac{a}{b}, \sqrt{a}, \pi, \alpha
//   \tfrac12 (no-brace shorthand: capture trailing digits)
//   ^{...}, _{...} (super/subscript groups)
//   ^2, _x (single-char super/subscript)
const LATEX_CMD_RE = new RegExp(
  // \cmd{arg}{arg}{arg} OR \cmd<digit><digit> OR \cmd (no args)
  `\\\\(?:${LATEX_COMMANDS.join("|")})(?:\\{[^}]*\\}){1,3}` + // braced args
    `|\\\\(?:${LATEX_COMMANDS.join("|")})\\d{1,3}` +           // shorthand digits
    `|\\\\(?:${LATEX_COMMANDS.join("|")})\\b` +                // bare command
    `|\\^\\{[^}]+\\}|\\_\\{[^}]+\\}` +                          // braced sub/super
    `|\\^\\d|\\_\\d`,                                            // single-digit sub/super
  "g",
);

// Split text into runs of math-mode and prose, then wrap raw LaTeX runs
// found in prose. Math-mode delimiters recognized:
//   $...$       inline math
//   $$...$$     display math
//   \(...\)     LaTeX inline (KaTeX supports this)
//   \[...\]     LaTeX display (KaTeX supports this)
function wrapLatexRuns(text) {
  if (!text || typeof text !== "string") return { changed: false, text };
  const parts = [];
  let cursor = 0;
  // Combined regex matching ANY math delimiter pair
  const mathRe = /\$\$[^$]+\$\$|\$[^$]+\$|\\\([^)]*\\\)|\\\[[^\]]*\\\]/g;
  let m;
  while ((m = mathRe.exec(text)) !== null) {
    if (m.index > cursor) parts.push({ kind: "prose", text: text.slice(cursor, m.index) });
    parts.push({ kind: "math", text: m[0] });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push({ kind: "prose", text: text.slice(cursor) });

  let changed = false;
  const out = parts.map((p) => {
    if (p.kind === "math") return p.text; // leave math runs alone
    // In prose: find LaTeX runs and wrap each one in $...$
    if (!p.text.match(LATEX_CMD_RE)) return p.text;
    // Iterate matches, build wrapped version
    let result = "";
    let lastEnd = 0;
    let runStart = -1;
    let runEnd = -1;
    LATEX_CMD_RE.lastIndex = 0;
    let match;
    const matches = [];
    while ((match = LATEX_CMD_RE.exec(p.text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
    }
    if (matches.length === 0) return p.text;

    // Merge adjacent matches into one math run. Adjacent = separated only
    // by math-mode-safe content (single variable letters, digits, operators,
    // whitespace, decimal points, equals signs). The goal is to wrap an
    // entire equation like "f(x)=\frac{2}{5}x+4" in ONE $...$ pair rather
    // than fragmenting into "$\frac{2}{5}$x+4".
    const runs = [];
    let cur = { ...matches[0] };
    for (let i = 1; i < matches.length; i++) {
      const between = p.text.slice(cur.end, matches[i].start);
      // Allow merging if the gap is math-mode-safe (mathy chars only)
      const mathSafe = /^[\s+\-*/=(),.0-9a-zA-Z·×÷^_·]*$/.test(between) && between.length <= 20;
      if (mathSafe) {
        cur.end = matches[i].end;
      } else {
        runs.push(cur);
        cur = { ...matches[i] };
      }
    }
    runs.push(cur);

    // Note: leftward extension to "absorb equation context" was tried and
    // was too aggressive (grabbed whole sentences). Reverted to tight wrap
    // (LaTeX run only). Aesthetically less ideal — produces "$\frac{2}{5}$x"
    // instead of "$\frac{2}{5}x$" — but renders correctly without breaking
    // surrounding prose. The KaTeX-rendered fraction is the main fix the
    // user reported. Future improvement: LLM-based wider equation detection.

    // Build output: wrap each run in $...$
    for (const r of runs) {
      result += p.text.slice(lastEnd, r.start);
      result += "$" + p.text.slice(r.start, r.end) + "$";
      lastEnd = r.end;
      changed = true;
    }
    result += p.text.slice(lastEnd);
    return result;
  });

  return { changed, text: out.join("") };
}

// ── Main ───────────────────────────────────────────────────────────────
console.log(`\n═══ LaTeX-wrap fix — ${APPLY ? "WRITE MODE" : "DRY-RUN"} (limit=${LIMIT})${COURSE ? ` course=${COURSE}` : ""} ═══\n`);

const filter = COURSE
  ? `AND course::text = '${COURSE}'`
  : `AND course::text LIKE 'SAT_%' OR course::text LIKE 'ACT_%' OR course::text LIKE 'PSAT_%'`;

const candidates = await sql(`
  SELECT id, course::text AS course, "questionText", options, explanation
  FROM questions
  WHERE "isApproved" = true
    AND (
      ("questionText" ~ '\\\\(frac|tfrac|dfrac|sqrt|sum|prod|int|lim|infty|pi|alpha|beta|gamma|delta|theta|lambda|cdot|times|div|le|ge|neq|approx|leq|geq|circ|vec)\\W' AND "questionText" NOT LIKE '%$%')
      OR
      ("questionText" ~ '\\\\(frac|tfrac|dfrac|sqrt)' AND POSITION('$' IN "questionText") = 0)
    )
    ${COURSE ? `AND course::text = '${COURSE}'` : ""}
  LIMIT $1
`, [LIMIT]);

console.log(`Found ${candidates.length} candidates.\n`);

let fixed = 0, skipped = 0;
for (const q of candidates) {
  const stem = wrapLatexRuns(q.questionText);
  const explFix = wrapLatexRuns(q.explanation || "");
  // For options (JSON array of strings), wrap each
  let optionsChanged = false;
  let optsValue = q.options;
  if (Array.isArray(q.options)) {
    const newOpts = q.options.map((o) => {
      if (typeof o === "string") {
        const r = wrapLatexRuns(o);
        if (r.changed) optionsChanged = true;
        return r.text;
      }
      return o;
    });
    optsValue = newOpts;
  }

  const anyChange = stem.changed || explFix.changed || optionsChanged;
  if (!anyChange) {
    skipped++;
    continue;
  }

  if (APPLY) {
    await sql(`
      UPDATE questions
      SET "questionText" = $1,
          options = $2::jsonb,
          explanation = $3,
          "updatedAt" = NOW()
      WHERE id = $4
    `, [stem.text, JSON.stringify(optsValue), explFix.text, q.id]);
    process.stdout.write(`  ✓ ${q.id.slice(0, 8)} ${q.course}\n`);
  } else {
    console.log(`\n  [DRY] ${q.id.slice(0, 8)} ${q.course}`);
    if (stem.changed) {
      console.log(`    OLD stem: ${q.questionText.slice(0, 120)}...`);
      console.log(`    NEW stem: ${stem.text.slice(0, 120)}...`);
    }
    if (optionsChanged) {
      console.log(`    options changed`);
    }
  }
  fixed++;
}

console.log(`\n═══ Summary ═══`);
console.log(`  Changed: ${fixed}`);
console.log(`  Skipped (no change after wrap): ${skipped}`);
console.log(`  Mode: ${APPLY ? "wrote to DB" : "dry-run"}`);
