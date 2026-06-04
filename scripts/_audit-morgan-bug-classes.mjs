/**
 * 2026-06-04 — Retroactive scan for the 3 bug classes caught in Morgan
 * Rhodes's SAT R&W diagnostic (2026-06-04 09:21 UTC):
 *   1. scaffold-token-leak: questionText/stimulus starts with STIMULUS:,
 *      QUESTION:, STEM:, etc.
 *   2. json-object-stimulus: stimulus is a serialized JSON object
 *      (renders as raw braces).
 *   3. missing-question-marker: MCQ stem has no question marker.
 *
 * Reports counts per course. With --apply, unapproves offenders, but
 * respects the "no unapprove below 200 approved" guardrail per
 * [[feedback_no_unapprove_below_200]].
 *
 * Usage:
 *   node scripts/_audit-morgan-bug-classes.mjs          # report only
 *   node scripts/_audit-morgan-bug-classes.mjs --apply  # unapprove
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const APPLY = process.argv.includes("--apply");
const MIN_APPROVED_FLOOR = 200; // per feedback_no_unapprove_below_200

const SCAFFOLD_RX = /^(STIMULUS|QUESTION|STEM|PROMPT|OPTIONS|ANSWER|EXPLANATION|CONTEXT|PASSAGE)\s*[:：]/i;

function isScaffoldLeak(text) {
  if (!text || typeof text !== "string") return false;
  return SCAFFOLD_RX.test(text.trimStart());
}

function isJsonObjectStim(stim) {
  if (!stim || typeof stim !== "string") return false;
  const s = stim.trimStart();
  if (!/^[{[]/.test(s)) return false;
  const hasMultiTextKey =
    /"(Text|Passage|Source|Excerpt)\s*\d?"\s*:/i.test(s) ||
    /"(Text|Passage|Source)\s+[AB12]"\s*:/i.test(s);
  return hasMultiTextKey || /"[A-Za-z][\w\s]{0,30}"\s*:\s*"/.test(s);
}

function isMissingQuestionMarker(rawStem, qType) {
  if (qType === "NUMERICAL") return false; // skip SPR
  if (qType && qType !== "MCQ") return false;
  if (!rawStem || typeof rawStem !== "string") return true;
  const stem = rawStem.trim();
  const hasQuestionMark = /\?/.test(stem);
  const hasFillBlank = /_{3,}/.test(stem);
  const hasUnderlineMarker = /<u>|\*\*[A-Za-z][^*]{1,40}\*\*/i.test(stem);
  const hasUnderlinedReference = /\bunderlined\s+(word|phrase|portion|sentence|clause|text|part)\b/i.test(stem);
  const hasInterrogativeOpener =
    /^(which|what|why|how|when|where|who|whom|whose|in the|based on|according to|the author|the (writer|speaker|narrator|passage|text|excerpt|study|figure|graph|table|chart|diagram)|select|choose|identify|describe|explain|determine|find|calculate|solve|estimate|evaluate|consider|assume|suppose|if\s)/i.test(stem);
  const hasStandardInstruction = /\b(complete|fill in|fills the blank|best (completes|describes|explains|fits|expresses)|most (accurately|likely|nearly|appropriate|effectively))\b/i.test(stem);
  const endsWithTerminator = /[.!?;]/.test(stem.slice(-1));
  const endsWithPrepOrArticle =
    /\b(to|of|by|in|at|from|as|with|for|on|into|onto|upon|about|over|under|between|the|a|an|that|this|these|those|than|because|since|while|after|before|during|whereas)$/i.test(stem.replace(/[.!?;:,]$/, ""));
  const isSentenceCompletion = !endsWithTerminator || endsWithPrepOrArticle;
  return !(hasQuestionMark || hasFillBlank || hasUnderlineMarker ||
           hasUnderlinedReference || hasInterrogativeOpener || hasStandardInstruction ||
           isSentenceCompletion);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  console.log(`\n=== Morgan-bug-class audit ${APPLY ? "[APPLY]" : "[DRY-RUN]"} ===`);

  // Pull every approved question + key fields.
  const rows = await sql`
    SELECT id, course, "questionText", stimulus, "questionType", "isApproved"
    FROM questions
    WHERE "isApproved" = true
  `;
  console.log(`Scanning ${rows.length} approved Qs...`);

  const offenders = {
    scaffold: [],
    json: [],
    marker: [],
  };

  for (const r of rows) {
    if (isScaffoldLeak(r.questionText) || isScaffoldLeak(r.stimulus)) {
      offenders.scaffold.push({ id: r.id, course: r.course });
    } else if (isJsonObjectStim(r.stimulus)) {
      offenders.json.push({ id: r.id, course: r.course });
    } else if (isMissingQuestionMarker(r.questionText, r.questionType)) {
      offenders.marker.push({ id: r.id, course: r.course });
    }
  }

  console.log(`\nResults:`);
  console.log(`  scaffold-token-leak:      ${offenders.scaffold.length}`);
  console.log(`  json-object-stimulus:     ${offenders.json.length}`);
  console.log(`  missing-question-marker:  ${offenders.marker.length}`);

  // Per-course breakdown of total offenders
  const byCourse = new Map();
  for (const kind of ["scaffold", "json", "marker"]) {
    for (const o of offenders[kind]) {
      byCourse.set(o.course, (byCourse.get(o.course) || 0) + 1);
    }
  }
  console.log(`\nPer-course offender counts:`);
  for (const [c, n] of [...byCourse.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}`);
  }

  if (!APPLY) {
    console.log(`\n(dry-run — re-run with --apply to unapprove)`);
    return;
  }

  // For each course, check current approved count and apply the floor.
  const allIds = [
    ...offenders.scaffold.map(o => o.id),
    ...offenders.json.map(o => o.id),
    ...offenders.marker.map(o => o.id),
  ];
  if (allIds.length === 0) {
    console.log(`\nNo offenders. Nothing to unapprove.`);
    return;
  }

  // Group ids by course to enforce the 200-floor per course.
  const idsByCourse = new Map();
  for (const o of [...offenders.scaffold, ...offenders.json, ...offenders.marker]) {
    if (!idsByCourse.has(o.course)) idsByCourse.set(o.course, []);
    idsByCourse.get(o.course).push(o.id);
  }

  let totalUnapproved = 0;
  for (const [course, ids] of idsByCourse.entries()) {
    const [{ count: approvedCount }] = await sql`
      SELECT COUNT(*)::int AS count FROM questions
      WHERE course = ${course} AND "isApproved" = true
    `;
    const afterUnapprove = approvedCount - ids.length;
    if (afterUnapprove < MIN_APPROVED_FLOOR && approvedCount >= MIN_APPROVED_FLOOR) {
      const allowed = approvedCount - MIN_APPROVED_FLOOR;
      const subset = ids.slice(0, Math.max(0, allowed));
      console.log(`  ${course}: ${approvedCount} approved → would drop to ${afterUnapprove}, capping at ${subset.length} unapproves to keep floor of ${MIN_APPROVED_FLOOR}`);
      if (subset.length > 0) {
        await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${subset})`;
        totalUnapproved += subset.length;
      }
    } else if (approvedCount < MIN_APPROVED_FLOOR) {
      console.log(`  ${course}: ${approvedCount} approved (below floor) — SKIP all ${ids.length} offenders`);
    } else {
      await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${ids})`;
      totalUnapproved += ids.length;
      console.log(`  ${course}: unapproved ${ids.length} (${approvedCount} → ${afterUnapprove})`);
    }
  }

  console.log(`\nTOTAL UNAPPROVED: ${totalUnapproved}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
