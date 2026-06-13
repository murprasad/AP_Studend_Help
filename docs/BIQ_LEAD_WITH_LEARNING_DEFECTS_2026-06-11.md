# BIQ Defect Record — Lead-with-Learning session (2026-06-11)

Process: `docs/QUALITY_PROCESS.md` (BIQ loop = Tech RCA → Process RCA → ICA/ECA/PCA → wire PCA to role gate → Defect Ledger). Mirror in `AP_Help/docs/`. Retained across sessions.

Defect IDs continue the global ledger (last was D8).

---

## D9 — Journey leads with JUDGMENT despite items 0–2 marked "✅ live"  *(external / customer-found, systemic)*
**Symptom (user, 2026-06-11):** new-user `/journey` opens with a graded warm-up (Step 1 of 5), then a FORCED 10-Q diagnostic, then "0/10" + "your projected CLEP score" as a first-session verdict. This is the exact "lead with judgment" failure the goal exists to kill.

**Tech RCA (5-Why):**
1. Why measurement-first? warm-up → forced diagnostic (step 3) → step-5 shows 0/N + projected score.
2. Why forced? `journey/page.tsx handleStep1Done` advanced unconditionally to step 3.
3. Why warm-up hard? `step-1-mcq.tsx` requested `difficulty:"ALL"` (cold quadratic, not EASY).
4. Why shown "done"? Item 1 shipped ONLY the step-5 1-CTA reduction; the "first questions EASY" + "diagnostic optional, not a gate" clauses were never built, yet the progress log flipped item 1 to ✅.
5. **Root cause:** Definition-of-Done violated — an item was marked ✅ from *partial code shipping*, with no clause-by-clause Requirements-Conformance audit (G1) and no QA persona walk (G4). Same class as D5/D6.

**Process RCA / accountability:** PO (accepted thin-slice as done), QA (no persona walk → never saw the measurement-first flow). Gates at fault: **G1, G4.**

**ICA (shipped):** warm-up serves EASY + "no score, no pressure" sub-label; `handleStep1Done` → step 5 directly; diagnostic demoted to an opt-in card; step-5 score-as-verdict removed when no diagnostic taken.
**ECA:** audit SN journey for the same forced-diagnostic pattern (parity); re-audit EVERY "✅" in the goal doc against its actual clauses (independent conformance agent running).
**PCA:** a goal-doc item may flip to ✅ ONLY after (a) Requirements-Conformance agent returns clause-by-clause ✅, and (b) a QA persona walk observes it live. Wire to **G1 + G4**.

---

## D10 — Broken duplicate-answer-SET question served  *(external / customer-found, question-quality)*
**Symptom:** CLEP_COLLEGE_ALGEBRA "Solve for x: x²+2x+1=16" served with (D) "-5, 3" and (E) "3, -5" — identical root set {-5,3} → two correct options, an unanswerable question.

**Tech RCA:** the duplicate-option gate (a) compared option strings order-sensitively (so "-5, 3" ≠ "3, -5"), and (b) its normalizer never stripped the letter prefix (see D11), so the leading "D)"/"E)" made the two strings differ regardless. Net: a whole class of order-permuted duplicate answer-sets passed.

**ICA:** unapprove the question. **ECA:** swept the FULL approved pool → 4 real offenders unapproved (3 College Algebra + 1 Precalculus); 2 ordering-question false-positives correctly EXCLUDED by the ordering guard. **PCA:** new deterministic `options-duplicate-set` gate — order-independent set comparison over short value-lists, with an ordering-question guard (`order|sequence|arrange|chronological|earliest|steps occur`) so permutation answers aren't mis-flagged. Wire to **G2/G3** + Question-Quality tri-agent (gate + generator + monitor).
**BIQ verify:** before fix, sweep caught 0; after fix, 6 (incl. the original); after ordering guard, 4 real. The new gate WOULD have caught the original defect ✅.

---

## D11 — `normalizeOptForDupe` case-bug disabled the duplicate-option gate for prefixed options  *(internal, found during D10 RCA)*
**Tech RCA (5-Why):** `s.toLowerCase().replace(/^[A-E]\)\s*/,"")` — `toLowerCase()` runs FIRST, turning "D)" → "d)", but the strip regex matches only UPPERCASE `[A-E]`, so it never fired. The prefix survived, so "d) -5, 3" was treated as the value and two prefixed duplicates differed by their letter. Root: regex authored assuming original case but placed after a lowercasing call; **no test fixture ever exercised a letter-prefixed duplicate option.**

**ICA/PCA (shipped):** strip changed to `/^\(?[a-e][\).]\s*/` (post-lowercase, case-correct, also handles "(A)" and "A."). Strengthens BOTH the legacy duplicate-option gate and the new set gate.
**PCA wire:** add a unit test with letter-prefixed duplicate options to the gate suite (**G2/G3**).

---

## D12 — TEAS serve-path regression: 2,313 → 155 approved  *(external-impacting, content)*  **RESOLVED 2026-06-11**
**Symptom:** TEAS had 5,420 total questions but only **155 approved/serving** (was 2,313 per 2026-06-10 docs). Deploy integration test flagged "TEAS 0 MCQ".

**Tech RCA (settled):** NOT a mass-unapproval. `scripts/deterministic-gate.mjs` only PROMOTES (`isApproved=false`→`true`), never unapproves. The math: dry-running the gate on the 5,265 unapproved TEAS showed **2,158 pass (41%)**; 155 already-approved + 2,158 = **exactly 2,313**. So the prior session's silver-tier promotion to 2,313 **never persisted** (crash mid-`--approve`, or a dry run mislabeled "done") — only 155 survived. Same "claimed-not-verified" class as D13. The 3,107 that fail are correctly gated: **2,860 lack source attribution** (sourceBook/sourceUrl), 497 structure, 108 answer-consistency, 58 stimulus, 7 style.
**ICA (done):** re-ran `deterministic-gate.mjs --course=TEAS --approve` → promoted 2,158 → **TEAS approved 155→2,313, verified.** Every promoted Q passed the silver-tier deterministic gates; serving live (approval read from DB, no deploy needed).
**PCA (done):** `scripts/shipped-course-floor-probe.mjs` — DB-DIRECT approved-count invariant (can't be fooled by the API's TEAS unit-mapping that reported 0). Hard-fails if a shipped course drops below floor (TEAS≥1500, ACCUPLACER≥250). **Wired into `pages:deploy`** after integration-tests. A shipped course losing its served pool is now an incident, not a silent warning.
**Remaining (content, not a defect):** the 2,860 source-less TEAS Qs need source attribution before they can promote — separate content work, not a regression.

---

## D13 (meta) — "code-shipped" treated as "done"  *(recurring root, ties D9)*
The binding lesson: items keep getting marked live without test-as-user. **PCA:** no goal-doc item flips to ✅ without G1 conformance + G4 QA-walk evidence. This is wired as the PCA of D9 and reinforces D5/D6 + `memory/feedback_test_as_user`.

---

## Accountability matrix (this session)
| Defect | Primary | Secondary | PCA (wired) |
|---|---|---|---|
| D9  | PO | QA | G1 conformance-agent + G4 QA-walk before ✅ |
| D10 | DEV | REV | G2/G3 `options-duplicate-set` gate + ordering guard |
| D11 | DEV | REV | G2/G3 normalizer fix + prefixed-duplicate unit test |
| D12 | SRE | DEV | G6 approved-count floor probe per shipped course |
| D13 | PO/RM | all | DoD = verified-live; no ✅ without G1+G4 |

## Status
ICA shipped for D9/D10/D11 (PL working tree). ECA: PL pool swept (4 unapproved); SN parity + TEAS RCA pending. Independent REV + conformance agents running (G3/G1). Deploy + live-verify (G5/G6) after agents pass.
