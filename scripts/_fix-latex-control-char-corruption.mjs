// Repair LaTeX control-char corruption in the question bank.
//
// Root cause: LLM returns JSON like {"questionText":"... \frac{1}{x} ..."}.
// When JSON.parse runs, `\f` is a VALID JSON escape (form-feed 0x0C), so
// `\frac` becomes [0x0C]+"rac". Same collision for `\b`→backspace (\beta),
// `\v`→vertical-tab (\vec). The stored text then renders as "rac{1}{x}" with
// an invisible control char where the backslash belonged.
//
// These three control chars are NEVER legitimate in question content, so the
// repair is unambiguous: 0x0C->"\f", 0x08->"\b", 0x0B->"\v" (restoring the
// backslash + letter, e.g. \frac \beta \vec). We deliberately do NOT touch
// tab (0x09) or newline (0x0A) — those are legitimate whitespace, so their
// LaTeX collisions (\theta, \nabla) need a separate, heuristic pass.
//
// Dry-run by default. Pass --apply to write.
import { makePrisma } from "./_prisma-http.mjs";

const APPLY = process.argv.includes("--apply");
const FF = String.fromCharCode(12); // form-feed  -> \frac, \forall
const BS = String.fromCharCode(8);  // backspace  -> \beta, \binom
const VT = String.fromCharCode(11); // vert-tab   -> \vec

function repair(s) {
  if (typeof s !== "string") return s;
  // split/join on char-code vars (no literal control chars in source).
  return s.split(FF).join("\\f").split(BS).join("\\b").split(VT).join("\\v");
}
function hasCorruption(s) {
  return typeof s === "string" && (s.includes(FF) || s.includes(BS) || s.includes(VT));
}

const p = makePrisma();

let processed = 0, changed = 0, cursor = null;
let sample = null;
while (true) {
  const batch = await p.question.findMany({
    where: { OR: [{ questionText: { contains: "$" } }, { questionText: { contains: "rac{" } }, { explanation: { contains: "$" } }] },
    select: { id: true, questionText: true, explanation: true, stimulus: true, options: true },
    take: 200,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: "asc" },
  });
  if (!batch.length) break;
  for (const q of batch) {
    const optsArr = Array.isArray(q.options) ? q.options : null;
    const optStr = typeof q.options === "string" ? q.options : null;
    const corrupt =
      hasCorruption(q.questionText) || hasCorruption(q.explanation) || hasCorruption(q.stimulus) ||
      (optsArr && optsArr.some(hasCorruption)) || hasCorruption(optStr);
    if (!corrupt) continue;
    changed++;
    if (!sample) sample = { id: q.id, before: JSON.stringify(q.questionText).slice(0, 80) };
    if (APPLY) {
      const data = {
        questionText: repair(q.questionText),
        explanation: repair(q.explanation),
        stimulus: repair(q.stimulus),
      };
      if (optsArr) data.options = optsArr.map(repair);
      else if (optStr) data.options = repair(optStr);
      await p.question.update({ where: { id: q.id }, data });
    }
  }
  processed += batch.length;
  cursor = batch[batch.length - 1].id;
  if (APPLY && changed && changed % 50 === 0) console.log(`  repaired ${changed} ...`);
}

console.log(`${APPLY ? "APPLY" : "DRY-RUN"} - scanned ${processed} LaTeX-bearing Qs`);
if (sample) console.log(`sample corrupt id ${sample.id}: ${sample.before}`);
console.log(`${APPLY ? "REPAIRED" : "WOULD REPAIR"} ${changed} questions with control-char corruption.`);
await p.$disconnect();
