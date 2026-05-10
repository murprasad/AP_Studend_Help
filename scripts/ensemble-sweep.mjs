/**
 * scripts/ensemble-sweep.mjs
 *
 * Retroactive 3-model ensemble sweep over approved MCQs. Same gate as the
 * gen-pipeline ensemble (ensembleJudgeMcq) but rewritten as a node script
 * for the bulk run. Per user 2026-05-08: every approved Q must pass the
 * ensemble; failures get isApproved=false.
 *
 * Quorum: ≥2 PASS → keep approved. ≥2 FAIL → unapprove.
 * No quorum (mixed/abstains) → keep approved (fail-OPEN — no false positives).
 *
 * Run:
 *   node scripts/ensemble-sweep.mjs                       # dry — full bank
 *   node scripts/ensemble-sweep.mjs --course=AP_PHYSICS_1 # one course
 *   node scripts/ensemble-sweep.mjs --limit=200           # cap (for budget)
 *   node scripts/ensemble-sweep.mjs --unapprove           # writes
 *   node scripts/ensemble-sweep.mjs --concurrency=4       # default 3
 *
 * Env: DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY
 *
 * Cost estimate: ~$0.020/question × bank size. 7,870 Qs ≈ $160.
 *
 * Artifact: data/ensemble-sweep-runs/<ISO>.json contains every vote.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--unapprove") return ["unapprove", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const UNAPPROVE = !!args.unapprove;
const COURSE = args.course ?? null;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 3;
const INCLUDE_UNAPPROVED = !!args["include-unapproved"]; // bidirectional re-score
const TIMEOUT_MS = 25_000;

console.log(`Mode: ${UNAPPROVE ? "WRITE (bidirectional: approve passes, unapprove fails)" : "DRY (read-only)"}`);
console.log(`Filter: course=${COURSE ?? "ALL"}, limit=${LIMIT ?? "none"}, concurrency=${CONCURRENCY}, includeUnapproved=${INCLUDE_UNAPPROVED}`);

function buildPrompt(q, opts) {
  // Strip any leading "X) " prefix from each option — they're stored that
  // way for legacy reasons and the UI strips at render. We re-prefix
  // canonically so the judge sees "A) ..." once, never "A) A) ...".
  const stripPrefix = (s) => String(s).replace(/^[A-E]\s*\)\s*/, "");
  const optsStr = opts.map((o, i) => `${String.fromCharCode(65 + i)}) ${stripPrefix(o)}`).join("\n");
  return `You are auditing a StudentNest practice question against real College Board (AP/SAT/ACT) exam standards. Return JSON only with keys "verdict" and "reason".

verdict must be exactly "PASS" or "FAIL".

FAIL if ANY of these CORRECTNESS bugs are present:
- The stored correctAnswer letter does NOT hold the value the explanation derives.
- The explanation contradicts itself (one sentence picks A, another picks B).
- The explanation references DISTRACTORS by letter ("Option B is incorrect because...", "A is wrong because...", "C is tempting but wrong"). Real CB explanations describe the CONTENT directly, not by letter. Saying "the correct answer is B" once is fine; enumerating distractor flaws by letter is FAIL.
- An OPTION's TEXT contains the word "Correct", "Incorrect", "Wrong", or "Right" (e.g. "B) 245 - Correct").
- The stimulus reveals the correct numeric answer (e.g. stimulus shows "= 245" when correct option is 245).
- LaTeX uses bare "int", "sum", "frac", "rac", "infty" without backslashes IN THE STORED TEXT (not the JSON-encoded version of backslashes).
- The explanation includes LLM monologue ("hmm", "let me reconsider", "is not needed, just").

FAIL also if the question doesn't match real CB exam STYLE/RIGOR (HARD requirement):
- **Passage-based exam without a passage** = automatic FAIL. AP Lit, AP Lang, SAT R/W, ACT Reading, ACT English, AP US History, AP World History, AP European History, AP Government, AP Psychology MCQs are ALWAYS based on a stimulus (passage, source quote+attribution, scenario, data, chart, diagram). If the stem is abstract trivia with NO stimulus on these courses, FAIL — not a real CB item.
- Stem reads more like a textbook paragraph than an exam item.
- Distractors are not all CB-grade plausible (an option is obviously wrong, or doesn't represent a real student misconception).
- Stimulus omits the CB-style scaffold (no source quote+attribution for history, no table/chart for AP Stats / ACT Science, no described diagram for AP Physics, no passage for SAT R/W, no described code for AP CSP).
- Source attribution is fabricated, vague, or missing year.
- Difficulty doesn't match the apparent rigor (HARD-tagged but is just longer recall).
- Stem uses ambiguous superlatives ("primary", "main", "best") without textual justification.

Otherwise PASS.

Question: ${q.questionText}

Options:
${optsStr}

Stored correctAnswer: ${q.correctAnswer}

Explanation: ${q.explanation || "(no explanation)"}

Return JSON only: {"verdict":"PASS"|"FAIL","reason":"<short>"}`;
}

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { model: "groq-llama-3.3-70b", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "groq-llama-3.3-70b", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "groq-llama-3.3-70b", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "groq-llama-3.3-70b", vote: "ABSTAIN", reason: e.message?.slice(0, 80) ?? "err" };
  }
}

async function callAnthropic(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = extractJson(data?.content?.[0]?.text ?? "");
    if (!parsed) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: "no json" };
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "claude-sonnet-4-6", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: e.message?.slice(0, 80) ?? "err" };
  }
}

async function callGemini(prompt) {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = extractJson(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
    if (!parsed) return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: "no json" };
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "gemini-2.5-flash", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "gemini-2.5-flash", vote: "ABSTAIN", reason: e.message?.slice(0, 80) ?? "err" };
  }
}

async function judgeOne(q) {
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  const prompt = buildPrompt(q, opts);
  const votes = await Promise.all([callGroq(prompt), callAnthropic(prompt), callGemini(prompt)]);
  const pass = votes.filter((v) => v.vote === "PASS").length;
  const fail = votes.filter((v) => v.vote === "FAIL").length;
  let verdict;
  if (fail >= 2) verdict = "FAIL";
  else if (pass >= 2) verdict = "PASS";
  else verdict = "NO_QUORUM";
  return { id: q.id, course: q.course, wasApproved: q.isApproved, verdict, votes };
}

// Pull. Branch the query because neon-serverless doesn't support nested
// sql`` fragments. INCLUDE_UNAPPROVED toggles whether unapproved Qs are
// re-scored (used for "rescue good Qs that earlier sweeps over-removed").
let qs;
if (INCLUDE_UNAPPROVED) {
  if (COURSE && LIMIT) {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "questionType" = 'MCQ' AND course::text = ${COURSE} ORDER BY "createdAt" DESC LIMIT ${LIMIT}`;
  } else if (COURSE) {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "questionType" = 'MCQ' AND course::text = ${COURSE} ORDER BY "createdAt" DESC`;
  } else if (LIMIT) {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "questionType" = 'MCQ' ORDER BY "createdAt" DESC LIMIT ${LIMIT}`;
  } else {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "questionType" = 'MCQ' ORDER BY "createdAt" DESC`;
  }
} else {
  if (COURSE && LIMIT) {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE} ORDER BY "createdAt" DESC LIMIT ${LIMIT}`;
  } else if (COURSE) {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE} ORDER BY "createdAt" DESC`;
  } else if (LIMIT) {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' ORDER BY "createdAt" DESC LIMIT ${LIMIT}`;
  } else {
    qs = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "isApproved" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' ORDER BY "createdAt" DESC`;
  }
}
console.log(`Loaded ${qs.length} approved MCQs.\n`);

const results = [];
const failedIds = [];
let i = 0;
const startTs = Date.now();

async function worker() {
  while (true) {
    const idx = i++;
    if (idx >= qs.length) return;
    const r = await judgeOne(qs[idx]);
    results.push(r);
    if (r.verdict === "FAIL") failedIds.push(r.id);
    if ((idx + 1) % 25 === 0) {
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(0);
      const fails = results.filter((x) => x.verdict === "FAIL").length;
      const noq = results.filter((x) => x.verdict === "NO_QUORUM").length;
      console.log(`[${idx + 1}/${qs.length}] elapsed=${elapsed}s · FAIL=${fails} · NO_QUORUM=${noq}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const summary = {
  total: results.length,
  pass: results.filter((r) => r.verdict === "PASS").length,
  fail: results.filter((r) => r.verdict === "FAIL").length,
  noQuorum: results.filter((r) => r.verdict === "NO_QUORUM").length,
};
console.log("\n══ SUMMARY ══");
console.log(JSON.stringify(summary, null, 2));

const perCourse = {};
for (const r of results) {
  if (!perCourse[r.course]) perCourse[r.course] = { pass: 0, fail: 0, noQuorum: 0 };
  perCourse[r.course][r.verdict === "FAIL" ? "fail" : r.verdict === "PASS" ? "pass" : "noQuorum"]++;
}
console.log("\n══ PER-COURSE ══");
for (const [c, m] of Object.entries(perCourse).sort((a, b) => b[1].fail - a[1].fail)) {
  console.log(`  ${c.padEnd(40)} pass=${m.pass}  fail=${m.fail}  noQuorum=${m.noQuorum}`);
}

const outDir = join(process.cwd(), "data", "ensemble-sweep-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `ensemble-${ts}.json`);
writeFileSync(outFile, JSON.stringify({
  generatedAt: new Date().toISOString(),
  mode: UNAPPROVE ? "WRITE" : "DRY",
  filter: { course: COURSE, limit: LIMIT },
  summary,
  perCourse,
  results,
}, null, 2));
console.log(`\nArtifact: ${outFile}`);

// 2026-05-10: mark PASS-verdict questions as pipelineVetted=true so the
// practice route's tier-preference (gold > silver > bronze) can serve
// them. Per feedback_serve_only_vetted_to_students.md.
if (UNAPPROVE) {
  const toMarkVetted = results.filter((r) => r.verdict === "PASS").map((r) => r.id);
  if (toMarkVetted.length > 0) {
    console.log(`\nMarking ${toMarkVetted.length} questions as pipelineVetted=true (PASS verdict)`);
    const CHUNK = 100;
    for (let i = 0; i < toMarkVetted.length; i += CHUNK) {
      const slice = toMarkVetted.slice(i, i + CHUNK);
      await sql`UPDATE questions SET "pipelineVetted" = true WHERE id = ANY(${slice})`;
    }
  }
}

if (UNAPPROVE) {
  // Bidirectional: approved+FAIL → unapprove; unapproved+PASS → approve.
  // SAFETY (per feedback_no_unapprove_below_200.md, 2026-05-09):
  //   - Approves are always allowed (raises count).
  //   - Unapproves require:
  //       (a) per-course current approved >= 200 AND
  //       (b) post-unapprove approved >= 200 (cap if needed).
  //   This protects the student-facing visibility floor.
  const allUnapprove = results.filter((r) => r.verdict === "FAIL" && r.wasApproved);
  const toApprove = results.filter((r) => r.verdict === "PASS" && !r.wasApproved).map((r) => r.id);

  // Group failed-to-unapprove by course
  const byCourse = {};
  for (const r of allUnapprove) {
    if (!byCourse[r.course]) byCourse[r.course] = [];
    byCourse[r.course].push(r.id);
  }

  // For each course in the failed-to-unapprove set, fetch live approved count
  // (approves from THIS run also raise the count — pre-apply approves first
  // mentally by adding the count of toApprove for the same course)
  const approvesByCourse = {};
  for (const r of results) {
    if (r.verdict === "PASS" && !r.wasApproved) {
      approvesByCourse[r.course] = (approvesByCourse[r.course] || 0) + 1;
    }
  }

  const finalUnapproveIds = [];
  const skipReasons = [];
  for (const [course, ids] of Object.entries(byCourse)) {
    const r = await sql`
      SELECT COUNT(*)::int AS c FROM questions
      WHERE course::text = ${course} AND "isApproved" = true AND "questionType" = 'MCQ'
    `;
    const currentApproved = r[0]?.c ?? 0;
    const projectedAfterApproves = currentApproved + (approvesByCourse[course] || 0);
    if (projectedAfterApproves < 200) {
      skipReasons.push(`${course}: currently ${currentApproved} approved (+${approvesByCourse[course]||0} from this run = ${projectedAfterApproves}), below 200 minimum — SKIPPING all ${ids.length} unapproves`);
      continue;
    }
    const maxAllowed = projectedAfterApproves - 200;
    if (ids.length > maxAllowed) {
      skipReasons.push(`${course}: ${ids.length} would-fail but cap at ${maxAllowed} (keep ≥200 after writes)`);
      finalUnapproveIds.push(...ids.slice(0, maxAllowed));
    } else {
      finalUnapproveIds.push(...ids);
    }
  }

  if (skipReasons.length > 0) {
    console.log("\n══ 200-floor SAFETY GATE applied ══");
    for (const s of skipReasons) console.log(`  ${s}`);
  }

  console.log(`\nWrites: -${finalUnapproveIds.length} unapprove (after 200-floor gate; ${allUnapprove.length} total failed), +${toApprove.length} approve (unapproved→PASS)`);
  const CHUNK = 100;
  for (let i = 0; i < finalUnapproveIds.length; i += CHUNK) {
    const slice = finalUnapproveIds.slice(i, i + CHUNK);
    await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${slice})`;
  }
  for (let i = 0; i < toApprove.length; i += CHUNK) {
    const slice = toApprove.slice(i, i + CHUNK);
    await sql`UPDATE questions SET "isApproved" = true WHERE id = ANY(${slice})`;
  }
  console.log("✓ Writes done.");
}
