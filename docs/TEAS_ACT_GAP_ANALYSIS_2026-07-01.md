# TEAS + ACT fidelity gap analysis — 2026-07-01

Independent research (via agents, WebFetch on official + major prep sources) comparing our
bank to the real exams. Sources: ATI official (help.atitesting.com item types + content),
Mometrix, NurseHub, Capital Region BOCES, TestPrep-Online, Smart Edition (TEAS); ACT.org
sample questions + Enhanced-ACT 2025 sources, Kaplan (ACT).

---
## TEAS 7 — structure (ground truth)
170 Q / 150 scored, 4 sections: Reading 45 (39 scored, 55m), Math 38 (34, 57m),
Science 50 (44, 60m — A&P is the largest sub-area), English 37 (33, 37m). **~15% of the
exam is "alternate item types."** Five official item types:
1. Multiple choice (4 opt) — ~85%+, all sections.
2. **Multiple select (SATA)** — >1 correct, no partial credit, all sections.
3. **Fill-in-the-blank / supply answer** — free/numeric, primarily Math.
4. Ordered response (drag-and-drop, 4–6 items) — frequent in Science.
5. Hot spot (click a region) — frequent in Science/A&P.

### Our TEAS bank (approved): 2,248 total
MCQ ~2,016 · ORDERED 155 · HOTSPOT 76 (A&P only) · MULTI_SELECT 1. Section volume:
Reading 501, Math 427, Science 864 (A&P 409, Bio 163, Chem 145, SciReason 147), English 456.

### TEAS gaps (prioritized)
1. **CRITICAL — Fill-in-the-blank/numeric = 0.** A core official alternate type, primary
   non-MCQ in Math. Zero coverage. Build a SUPPLY_ANSWER/numeric primitive (Math first).
2. **HIGH — Multiple-select (SATA) = 1.** Highest-anxiety type (no partial credit), used in
   all sections. Effectively absent. Scale a real pool per section.
3. **MEDIUM — Section balance inverted:** Science over-weighted (37% ours vs 29% real),
   **Math thin (18% vs 22%)**. Grow Math next, not more Science.
4. **CRITICAL/verify — A&P per-body-system balance:** A&P is the single largest scored area;
   audit the 409 A&P Qs cover all 11 systems ~evenly (any system <~25 Qs is a risk).
5. **HIGH — Biology must-haves:** Mendelian genetics, the 4 macromolecules, microorganisms/disease.
6. **MEDIUM — Chemistry:** verify acids/bases, solution properties, reaction rates.
7. **MEDIUM — Reading Craft & Structure:** ensure text-structure + author's-POV items (not just
   vocab-in-context). **English Conventions:** sentence-type classification + semicolon/modifier items.
8. Hot spot (76) is directionally right (Science-only) but thin for its exam weight; ordered
   response (155) healthiest — verify 4–6 item range + Science concentration.
Note: sub-objective *distribution* is otherwise strong; this is targeted fill + item-type build,
not a rebuild.

---
## ACT — Enhanced ACT (2025-2026)
Core test now **131 Q** (English 50/35m, Math 45/50m, Reading 36/40m); **Science 40/40m is
OPTIONAL** (separate 1–36 score, feeds a STEM score). Composite = avg(English, Math, Reading).
**All 4-option MC now (Math dropped its 5th option).** English = in-passage "NO CHANGE" edits;
Reading & Science 100% passage/figure-based; Math mostly standalone.

### Our ACT bank (approved): ACT_ENGLISH 520 · ACT_MATH 739 · ACT_READING 541 · ACT_SCIENCE 2066.
Format fidelity is CORRECT (4-choice all sections incl. Math; A–D/F–J lettering; in
FOUR_CHOICE_COURSES; Science-optional handled in copy).

### ACT gaps (prioritized)
1. **CRITICAL — ACT_SCIENCE passage-density unverified on the current 2,066 pool.** A 2026-06-28
   audit found only ~8% passage/figure-based (real Science is ~100% stimulus-driven). Pool has
   since ~doubled; RE-PROFILE for passage attachment + Data-Rep/Research-Summary/Conflicting-
   Viewpoints mix. If still <~90% passage-based, stays CRITICAL.
2. **HIGH — English under-uses "NO CHANGE" in-passage editing** (~13% measured; PT2 uses it as
   the first option on most usage/mechanics items). Regenerate toward edit-in-place.
3. **HIGH — Math missing logarithms (0%) + thin conics (~3%)** — both confirmed Enhanced-ACT topics.
4. **MEDIUM — Section balance inverted vs the composite:** Science (2,066) ≈ 3–4× any core
   section, yet it's OPTIONAL/separate; English (520) + Reading (541) — which feed the composite —
   are smallest. Rebalance generation toward English/Math/Reading.
5. **MEDIUM — Align ACT mock configs** to Enhanced counts (English 50/35, Math 45/50, Reading
   36/40, Science 40/40; composite = E+M+R; Science → STEM).

Key files: `src/lib/courses.ts` (ACT_* configs), `src/lib/deterministic-question-gates.ts`
(FOUR_CHOICE_COURSES + stimulus gate), `docs/ACT_CONTENT_FIDELITY_AUDIT_2026-06-28.md`,
`scripts/_gen-act-science-*.mjs`.

---
## Note on "are our questions exactly like the exam?"
No prep company has the real (secure, copyrighted) exam questions. The legitimate + legal
standard is **blueprint-aligned, format-true, difficulty-matched** original questions grounded
in the official content outline + free materials — which is what we build. Fidelity = content +
format fidelity, not verbatim reproduction.
