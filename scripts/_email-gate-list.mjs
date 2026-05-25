/**
 * One-shot: emails the current gate list to murprasad@gmail.com for review.
 * Uses Resend (same as send-deploy-email.js).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";

const GATES = [
  // Structure (catches malformed inputs upfront)
  { id: "structure", category: "Structure", desc: "Stem empty or < 10 chars; explanation < 40 chars; correctAnswer not A-E" },
  { id: "structure-frq-leak", category: "Structure", desc: "MCQ correctAnswer is FRQ-style text ('Same as explanation', 'See above', etc.) — schema corruption" },

  // Options structural
  { id: "options", category: "Options", desc: "Options array empty or unparseable" },
  { id: "options-count", category: "Options", desc: "Wrong number of options for course (CLEP=5, COLLEGE_MATH/SPANISH=4)" },
  { id: "options-prefix-dup", category: "Options", desc: "Option has double prefix ('A) A) text')" },
  { id: "options-duplicate", category: "Options", desc: "Two options have same normalized text (Unicode-aware)" },
  { id: "options-permutation-equivalent", category: "Options", desc: "Two options permutation-equivalent ('{a,b}' = '{b,a}', '0.5' = '1/2')" },
  { id: "options-mixed-types", category: "Options", desc: "Yes/No coexists with algebraic/numeric options (CB style violation)" },
  { id: "options-missing-prefix", category: "Options", desc: "None of the options have A)/B) letter prefix" },
  { id: "options-partial-prefix", category: "Options", desc: "Inconsistent prefixes — some have, some don't" },
  { id: "options-duplicate-prefix-letters", category: "Options", desc: "All options labeled with SAME letter ('A) A) A) A)') — data corruption" },
  { id: "options-out-of-order-prefix", category: "Options", desc: "Prefix letters not sequential A, B, C, D[, E]" },
  { id: "options-all-or-none-of-above", category: "Options", desc: "Option uses 'All of the above' or 'None of the above' — CB rarely uses, creates ambiguity (ChatGPT v2 #17)" },
  { id: "options-length-skewed", category: "Options", desc: "Correct option > 2.5× median distractor length (CB parity violation)" },
  { id: "option-contains-hint", category: "Options", desc: "Option text contains reasoning/explanation hints" },

  // CorrectAnswer
  { id: "correctAnswer-index", category: "Answer", desc: "correctAnswer letter out of range for option count" },

  // Explanation — letter/value mismatch
  { id: "explanation-letter-mismatch", category: "Explanation", desc: "Explanation claims 'X is correct' but stored correctAnswer is different letter" },
  { id: "explanation-self-contradiction", category: "Explanation", desc: "Explanation claims multiple different letters as correct" },
  { id: "explanation-numeric-mismatch", category: "Explanation", desc: "Correct option has scalar value but explanation doesn't reference any matching number" },
  { id: "explanation-body-letter-ref", category: "Explanation", desc: "Body references option letter ('B is incorrect', 'D is the most comprehensive') — brittle on shuffle" },
  { id: "explanation-subjectivity-leak", category: "Explanation", desc: "Explanation uses 'best answer / most comprehensive / arguably' without stem asking for it — undermines single-answer objectivity (ChatGPT v2 #20)" },
  { id: "explanation-multi-answer-implication", category: "Explanation", desc: "Explanation says 'however/but X is also correct/the more/most…' — implies multiple correct (ChatGPT v2 #18)" },

  // Explanation — completeness
  { id: "explanation-unmatched-parens", category: "Explanation", desc: "Open/close paren count differs by 2+ — likely token-truncated" },
  { id: "explanation-abrupt-end", category: "Explanation", desc: "Explanation ends mid-word without terminal punctuation" },
  { id: "explanation-dangling-operator", category: "Explanation", desc: "Explanation ends with =, +, -, ×, etc. — likely truncated mid-equation" },
  { id: "explanation-no-reasoning", category: "Explanation", desc: "Explanation lacks any reasoning marker (because, since, by, using, etc.) — likely just restates answer" },
  { id: "confession-phrase", category: "Explanation", desc: "Explanation contains 'closest match', 'best guess', 'approximately' — generator confession" },

  // Stem
  { id: "stem-missing-stimulus", category: "Stem", desc: "Stem references 'the figure above' / 'passage below' but stimulus field is empty" },
  { id: "stem-truncated-math", category: "Stem", desc: "Stem like 'Factor the expression' without actual math object (Gregory's bug)" },
  { id: "stem-double-negation", category: "Stem (Sprint A)", desc: "Stem has 'NOT incorrect' / 'not false' double-negation — ambiguous logic (UARP §3.3)" },
  { id: "stem-extremum-mismatch", category: "Stem (Sprint A)", desc: "Stem asks smallest/largest/greatest with numeric options; correctAnswer is not the actual extremum (UARP §3.1)" },

  // Semantic contract (Sprint A)
  { id: "explanation-ignores-negation", category: "Semantic (Sprint A)", desc: "Stem contains NOT/EXCEPT/LEAST but explanation never acknowledges the inversion — generator treated as positive question (UARP §3.3)" },
  { id: "explanation-ignores-trend", category: "Semantic (Sprint A)", desc: "Stem asks about increase/decrease/rise/fall but explanation contains no direction words — likely wrong-direction answer (UARP §3.1)" },

  // Hallucination patterns (UARP §3.6) — 2026-05-25
  { id: "explanation-hallucination-fake-citation", category: "Hallucination", desc: 'Fabricated academic citation pattern (e.g., "Smith et al. (2024)") — CB never cites named studies' },
  { id: "explanation-hallucination-fake-research-appeal", category: "Hallucination", desc: '"according to research" without source — generator filler' },
  { id: "explanation-hallucination-vague-studies", category: "Hallucination", desc: '"studies have shown" — vague appeal to authority' },
  { id: "explanation-hallucination-vague-research", category: "Hallucination", desc: '"research indicates/suggests/demonstrates" — unsourced authority' },
  { id: "explanation-hallucination-suspicious-precision", category: "Hallucination", desc: 'Suspiciously precise statistic ("exactly 73.4%") likely hallucinated' },
  { id: "explanation-hallucination-weak-hedging", category: "Hallucination", desc: '"it can be said / could be argued" — generator hedging' },
  { id: "explanation-hallucination-fake-expert-appeal", category: "Hallucination", desc: '"some experts argue" — no expert actually named' },

  // Domain Vocabulary Expectations (UARP §5 surrogate) — Ayu meiosis-Q class
  { id: "options-missing-canonical-ploidy", category: "Domain Vocab", desc: 'Ploidy stem but options lack canonical bio terms (haploid/diploid/triploid). Ayu 2026-05-25 bug.' },
  { id: "options-missing-canonical-selection-type", category: "Domain Vocab", desc: 'Selection-type stem but options lack stabilizing/directional/disruptive' },
  { id: "options-missing-canonical-cell-cycle-phase", category: "Domain Vocab", desc: 'Cell-cycle-phase stem but options lack prophase/metaphase/anaphase/telophase' },
  { id: "options-missing-canonical-inheritance-type", category: "Domain Vocab", desc: 'Inheritance-type stem but options lack dominant/recessive/codominance/etc.' },
  { id: "options-missing-canonical-bond-type", category: "Domain Vocab", desc: 'Bond-type stem but options lack ionic/covalent/hydrogen/peptide/etc.' },
  { id: "options-missing-canonical-state-of-matter", category: "Domain Vocab", desc: 'State-of-matter stem but options lack solid/liquid/gas/plasma' },
  { id: "options-missing-canonical-gov-branch", category: "Domain Vocab", desc: 'Branches-of-government stem but options lack legislative/executive/judicial' },
  { id: "options-missing-canonical-function-type", category: "Domain Vocab", desc: 'Function-type stem but options lack linear/quadratic/polynomial/exponential/etc.' },

  // Cognitive Diversity (UARP §6.4) — separate cron-job sweep
  { id: "cognitive-diversity-template-collapse", category: "Cognitive (separate)", desc: 'Stem-opening template used by >30% of Qs in a unit — generator stuck. PL: 77% in CLEP_ANLIT_DRAMA "what can be inferred about…". SN: 67% in ACT_ENGLISH.' },

  // Trust Certification (UARP §16) — Sprint D partial
  { id: "TRUST-CERTIFICATION-ENGINE", category: "Trust (UARP §16)", desc: 'Per-Q trustScore (0-100) + tier (gold/silver/bronze/rejected) aggregating ALL above gates + telemetry + cognitive-diversity. Writes to Question.trustScore + Question.certification columns added 2026-05-25 via prisma db push.' },

  // External validators
  { id: "render-hazard", category: "Rendering", desc: "Unescaped currency $ that renders as LaTeX, phantom diagram refs" },
  { id: "topic-unit-mismatch", category: "Schema", desc: "Topic doesn't match expected keywords for unit" },

  // CAS (runs in separate _cas-sweep.mjs for math courses)
  { id: "CAS-recompute (math courses)", category: "Math (separate script)", desc: "mathjs solves quadratic/linear/function-eval/factor — rejects if computed value ≠ stored letter (covers ~30% of math Qs; rest skip)" },

  // Distractor plausibility (runs in separate _distractor-plausibility-sweep.mjs)
  { id: "distractor-all-none-in-math", category: "Distractor (separate)", desc: "All/None of the above in math/sci courses (covered globally now by options-all-or-none-of-above)" },
  { id: "distractor-magnitude-absurd", category: "Distractor (separate)", desc: "Numeric distractor > 10000× or < 0.0001× the correct value (order-of-magnitude error)" },
  { id: "distractor-verbatim-from-stem", category: "Distractor (separate)", desc: "Distractor text appears verbatim in stem (lazy generation)" },

  // LLM-judge gate (in _second-pass-verifier.mjs, requires Anthropic credits)
  { id: "second-pass-llm-verifier", category: "LLM (gen-pipeline only)", desc: "Haiku 4.5 independently re-solves question; rejects if solved letter ≠ stored letter OR explanation contradicts answer. Wired into all 4 fill scripts. Currently paused — credits exhausted." },
];

const RESEND_KEY = process.env.RESEND_API_KEY;
if (!RESEND_KEY) { console.error("RESEND_API_KEY missing"); process.exit(1); }

const html = `<h2>PrepLion Question Quality Gates — 2026-05-25 (Sprint A+B+D-partial + UARP §3.6/§5/§6.4/§14.1/§16/§17.1)</h2>
<p>Complete list of ${GATES.length} gates currently active. Includes:</p>
<ul>
<li><b>Sprint A</b> (§3.1, §3.3): negation + semantic-contract gates</li>
<li><b>Sprint B-lite</b> (§6.1): item performance engine (data-thin, infra ready)</li>
<li><b>UARP §3.6</b>: 7 hallucination patterns beyond confession-phrase</li>
<li><b>UARP §5 surrogate</b>: 8 domain-vocabulary gates (Ayu meiosis-Q class)</li>
<li><b>UARP §6.4</b>: cognitive-diversity template-collapse detector</li>
<li><b>UARP §14.1</b>: runtime gate now uses same 45+ gate set as gen-time</li>
<li><b>UARP §16</b>: trust certification engine — per-Q gold/silver/bronze tier</li>
<li><b>UARP §17.1</b>: provenance columns added (promptVersion, validatorVersion, repairHistory)</li>
</ul>
<p><b>Today's catches across both repos: ~5,833 questions unapproved</b> (PL 1,190 / SN 4,643) out of ~35,000 total. PL CLEP_COLLEGE_ALGEBRA (priority 1) ran 0 fails after Sprint A — clean.</p>
<p>UARP gap analysis: <code>docs/UARP_GAP_ANALYSIS.md</code> · Sprint plan: <code>docs/UARP_SPRINT_PLAN.md</code></p>
<p><strong>Pipeline layers:</strong></p>
<ol>
<li><b>Generation gate</b> — runs at gen-time in all 4 fill scripts (_fill-mirror-haiku, _fill-mirror-cb-sample, _fill-from-cb-spec, _fill-gap-topic). Rejects before INSERT.</li>
<li><b>Layer 8 runtime gate</b> — re-runs at /api/practice + /api/diagnostic serve time. Auto-unapproves any failing Q.</li>
<li><b>Daily sweep cron</b> — 09:00 UTC via GitHub Actions, runs full sweep across approved bank.</li>
<li><b>Warmup-champion pin</b> — fresh users get a curated, gate-vetted Q1.</li>
</ol>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">
<thead><tr style="background:#eee;"><th>Category</th><th>Gate ID</th><th>What it catches</th></tr></thead>
<tbody>
${GATES.map(g => `<tr><td>${g.category}</td><td><code>${g.id}</code></td><td>${g.desc}</td></tr>`).join("\n")}
</tbody>
</table>
<p><b>Total active gates: ${GATES.length}</b> (32 deterministic + 1 LLM-judge currently paused)</p>
<p style="color:#666;font-size:11px;">Sent automatically from PrepLion gate registry. Reply with feedback or new gate proposals.</p>`;

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "PrepLion Gates <noreply@studentnest.ai>",
    to: ["murprasad@gmail.com"],
    subject: `PrepLion Quality Gates — ${GATES.length} active (UARP §3.6+§5+§14.1+§16+§17.1, 2026-05-25)`,
    html,
  }),
});
const body = await res.text();
console.log("Resend status:", res.status);
console.log("Body:", body.slice(0, 300));
