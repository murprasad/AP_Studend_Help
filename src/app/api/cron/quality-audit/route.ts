/**
 * GET /api/cron/quality-audit
 *
 * Nightly content-quality audit. Mirrors the 8 deterministic checks in
 * scripts/quality-audit.mjs (A–H) so the same logic runs in-process on
 * CF Workers. External scheduler (cron-job.org / GitHub Actions) hits
 * this hourly/daily with CRON_SECRET Bearer auth.
 *
 * Defaults to read-only: logs + emails findings, does NOT auto-quarantine.
 * Pass ?quarantine=1 along with CRON_SECRET to flip flagged rows to
 * isApproved=false so the regen-grounded pipeline re-creates them.
 *
 * Checks (deterministic only — LLMs can't do arithmetic reliably):
 *   A. equivalent_distractors   — 2+ options parse to same (value, unit)
 *   B. orphan_correct_answer    — correctAnswer letter not in options range
 *   C. thin_explanation         — explanation <80 chars
 *   D. stim_refs_passage        — refs "passage above" but stimulus empty
 *   E. stim_refs_diagram        — refs diagram/graph/table but missing
 *   F. empty_option             — any option empty/whitespace
 *   G. too_short_option         — non-numeric option <3 chars
 *   H. missing_content_hash     — legacy rows without dedup hash
 *
 * Email on findings > 0 to contact@studentnest.ai via sendEmail().
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const SCAN_LIMIT = 5000; // per-run cap — CF Workers has ~30s budget
const QUARANTINE_LIMIT = 200; // safety cap on auto-quarantine per run

// ── Numeric evaluator — mirrors scripts/quality-audit.mjs ──────────────────
function stripLabel(s: string): string {
  return String(s).replace(/^[A-E][)\.]\s*/, "").trim();
}

function normalize(raw: unknown): { body: string; unit: string } {
  if (raw == null) return { body: "", unit: "" };
  let s = String(raw).trim();
  s = s.replace(/^(?:=|≈|is|answer\s*:?|value\s*:?)\s*/i, "");
  s = s.replace(/^\$/, "");
  let unit = "";
  const u = s.match(/^(.*?)\s+([a-zA-ZµΩ°]+(?:\/[a-zA-Z²³]+)?\.?)$/);
  if (u) {
    s = u[1].trim();
    unit = u[2].toLowerCase().replace(/\.$/, "");
  }
  return { body: s.trim(), unit };
}

const NUM_RX = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function evalOption(raw: string): { value: number; unit: string } | null {
  const { body: s, unit } = normalize(raw);
  if (!s) return null;
  const pct = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*%$/);
  if (pct) return { value: Number(pct[1]) / 100, unit };
  if (NUM_RX.test(s)) return { value: Number(s), unit };
  const mixed = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const [w, n, d] = [Number(mixed[1]), Number(mixed[2]), Number(mixed[3])];
    if (d !== 0) return { value: (w < 0 ? -1 : 1) * (Math.abs(w) + n / d), unit };
  }
  const frac = s.replace(/[()]/g, "").match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*\/\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (frac) {
    const [a, b] = [Number(frac[1]), Number(frac[2])];
    if (b !== 0) return { value: a / b, unit };
  }
  const mul = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*[*·×]\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (mul) return { value: Number(mul[1]) * Number(mul[2]), unit };
  return null;
}

function nearlyEqual(a: number, b: number): boolean {
  if (a === b) return true;
  const diff = Math.abs(a - b), scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return diff / scale < 1e-9 || diff < 1e-12;
}

function optsArr(o: unknown): unknown[] | null {
  if (!o) return null;
  if (Array.isArray(o)) return o;
  if (typeof o === "string") { try { return JSON.parse(o); } catch { return null; } }
  return null;
}

// ── Individual checks (return null ok, or { code, detail }) ────────────────
type CheckResult = { code: string; detail: string } | null;
type QuestionRow = {
  id: string; course: string; unit: string; topic: string | null;
  contentHash: string | null;
  questionText: string | null; stimulus: string | null;
  options: unknown; correctAnswer: string | null;
  explanation: string | null;
};

function checkA(q: QuestionRow): CheckResult {
  const opts = optsArr(q.options);
  if (!opts || opts.length < 2) return null;
  const evals = opts.map((o) => evalOption(stripLabel(String(o))));
  for (let i = 0; i < evals.length; i++) {
    for (let j = i + 1; j < evals.length; j++) {
      const ei = evals[i], ej = evals[j];
      if (!ei || !ej) continue;
      if (nearlyEqual(ei.value, ej.value) && (ei.unit || "") === (ej.unit || "")) {
        return { code: "A", detail: `Options ${String.fromCharCode(65 + i)}+${String.fromCharCode(65 + j)} both = ${ei.value}${ei.unit ? " " + ei.unit : ""}` };
      }
    }
  }
  return null;
}
function checkB(q: QuestionRow): CheckResult {
  const opts = optsArr(q.options);
  if (!opts) return { code: "B", detail: "options unparseable" };
  const ca = String(q.correctAnswer || "").trim().toUpperCase();
  if (!/^[A-E]$/.test(ca)) return { code: "B", detail: `correctAnswer "${q.correctAnswer}" not A-E` };
  if (ca.charCodeAt(0) - 65 >= opts.length) return { code: "B", detail: `correctAnswer "${ca}" but only ${opts.length} options` };
  return null;
}
function checkC(q: QuestionRow): CheckResult {
  const e = String(q.explanation || "").trim();
  return e.length < 80 ? { code: "C", detail: `explanation ${e.length} chars` } : null;
}
function checkD(q: QuestionRow): CheckResult {
  const qt = String(q.questionText || "");
  const stim = String(q.stimulus || "");
  if (/\b(excerpt|passage|letter|document|source|author|text)\s+(above|below|shown)|the\s+(passage|excerpt|source|document)\s+(above|below)/i.test(qt) && stim.length < 40) {
    return { code: "D", detail: `refs passage but stimulus ${stim.length} chars` };
  }
  return null;
}
function checkE(q: QuestionRow): CheckResult {
  const qt = String(q.questionText || "");
  const stim = String(q.stimulus || "");
  if (/\b(graph|chart|diagram|figure|table|free-body|FBD)\s+(above|below|shown)/i.test(qt) && stim.length < 10) {
    return { code: "E", detail: "refs diagram/graph/table but stimulus missing" };
  }
  return null;
}
function checkF(q: QuestionRow): CheckResult {
  const opts = optsArr(q.options);
  if (!opts) return null;
  for (let i = 0; i < opts.length; i++) {
    const s = String(opts[i] ?? "").replace(/^[A-E][)\.]\s*/, "").trim();
    if (s.length === 0) return { code: "F", detail: `Option ${String.fromCharCode(65 + i)} empty` };
  }
  return null;
}
function checkG(q: QuestionRow): CheckResult {
  const opts = optsArr(q.options);
  if (!opts) return null;
  for (let i = 0; i < opts.length; i++) {
    const s = String(opts[i] ?? "").replace(/^[A-E][)\.]\s*/, "").trim();
    if (s.length > 0 && s.length < 3) {
      const mathChars = /^[-+]?[\d.πep√\/°%$]+$/i.test(s);
      if (!mathChars) return { code: "G", detail: `Option ${String.fromCharCode(65 + i)} "${s}"` };
    }
  }
  return null;
}
function checkH(q: QuestionRow): CheckResult {
  return !q.contentHash || q.contentHash.length < 32 ? { code: "H", detail: "contentHash missing" } : null;
}

const CHECKS: Array<(q: QuestionRow) => CheckResult> = [checkA, checkB, checkC, checkD, checkE, checkF, checkG, checkH];

// ── Route handler ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shouldQuarantine = req.nextUrl.searchParams.get("quarantine") === "1";
  const startedAt = Date.now();

  const rows = await prisma.question.findMany({
    where: { isApproved: true, questionType: "MCQ" },
    select: {
      id: true, course: true, unit: true, topic: true, contentHash: true,
      questionText: true, stimulus: true, options: true, correctAnswer: true,
      explanation: true,
    },
    orderBy: { createdAt: "desc" },
    take: SCAN_LIMIT,
  });

  const findings: Array<{ id: string; course: string; unit: string; code: string; detail: string }> = [];
  const countByCode: Record<string, number> = {};
  for (const q of rows) {
    for (const check of CHECKS) {
      const r = check(q as QuestionRow);
      if (r) {
        findings.push({ id: q.id, course: q.course, unit: q.unit, code: r.code, detail: r.detail });
        countByCode[r.code] = (countByCode[r.code] || 0) + 1;
      }
    }
  }

  // Quarantine non-H findings. H (missing_content_hash) is a legacy data
  // issue, not a quality bug — don't retire rows for it.
  let quarantined = 0;
  if (shouldQuarantine) {
    const toQuarantine = Array.from(
      new Set(findings.filter((f) => f.code !== "H").map((f) => f.id)),
    ).slice(0, QUARANTINE_LIMIT);
    for (const id of toQuarantine) {
      try {
        await prisma.question.update({ where: { id }, data: { isApproved: false } });
        quarantined++;
      } catch { /* skip failures silently */ }
    }
  }

  const summary = {
    scanned: rows.length,
    totalFindings: findings.length,
    countByCode,
    quarantined,
    quarantineEnabled: shouldQuarantine,
    durationMs: Date.now() - startedAt,
  };

  // Email a summary ONLY when there are non-H findings (H is noise from
  // legacy rows — would spam the inbox daily).
  const nonLegacy = findings.filter((f) => f.code !== "H").length;
  if (nonLegacy > 0) {
    const lines = [
      `Quality audit — ${nonLegacy} non-legacy findings across ${rows.length} questions`,
      "",
      ...Object.entries(countByCode)
        .filter(([c]) => c !== "H")
        .map(([c, n]) => `  ${c}: ${n}`),
      "",
      `Quarantine: ${shouldQuarantine ? `${quarantined} rows flipped to isApproved=false` : "disabled this run"}`,
      "",
      "Sample findings (first 10 non-legacy):",
      ...findings.filter((f) => f.code !== "H").slice(0, 10).map((f) =>
        `  [${f.code}] ${f.course} / ${f.unit}  ${f.id}: ${f.detail}`,
      ),
      "",
      "Run manually: node scripts/quality-audit.mjs",
    ].join("\n");
    // sendEmail signature: (to, subject, html). Wrap plain text in <pre>
    // so line breaks survive HTML rendering.
    const html = `<pre style="font-family:ui-monospace,monospace;font-size:13px;">${lines.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
    sendEmail(
      "contact@studentnest.ai",
      `[StudentNest] Quality audit: ${nonLegacy} findings`,
      html,
    ).catch(() => { /* email is best-effort */ });
  }

  return NextResponse.json(summary);
}
