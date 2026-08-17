# Exam Readiness Checklist — "Safe to Serve Students" (canonical, 2026-06-23)

Codex + Claude standard. **Render ≠ safe-to-serve.** An exam is GO only if every dimension passes.

## The 7 dimensions
1. **Entry flow** — reachable from signup + dashboard; no dead/stale routes (e.g. /practice/quickstart); track selection routes to the right exam; new users land on the correct starting course.
2. **Practice flow** — session starts; questions load without 500s; answer submit works; next/results work; no dead-ends.
3. **Content answerable** — every figure-referenced question has a real rendered figure OR inline data; every passage/table ref has its stimulus; NO "the bar graph shows…" with no graph; no phantom figure refs.
4. **Rendering** — images/SVG render in-browser (not broken-image placeholders), mobile + desktop.
5. **Coverage** — enough approved questions to avoid repeat fatigue; major domains represented; template collapse bounded; enough distinct items for a normal session.
6. **Functional semantics** — answer count/format matches the exam (ACT/SAT = 4-option); score display exam-native; no cross-exam label leaks; dashboard/diagnostic/practice copy match the exam.
7. **Trust surface** — marketing doesn't overclaim; no stale public leaks; pricing/exam pages accurate; hidden exams truly hidden/unavailable.

## Verdict rule
- Served **unanswerable** content → **NOT GO** (red on Content).
- **Route/500** failures → **red**.
- Only **diversity/repetition** problems → **yellow** (usable, not ideal), not red.
- Renders + serves correctly but repetitive → usable, not ideal.

## Live matrix (Codex, 2026-06-23) + Claude verification
| Exam | Entry | Practice | Content answerable | Render | Coverage | Semantics | Trust | Overall |
|---|---|---|---|---|---|---|---|---|
| **ACT** | 🟢 | 🟢 | 🟢* (3 broken ACT_MATH found → remove) | 🟢 | 🟡 | 🟢 | 🟢 | **GO** (after 3-item removal) |
| **SAT** | 🟢 | 🟢 | 🟡→🟢 after removing 28 verified-broken | 🟢 | 🟡 (template collapse) | 🟢 | 🟢 | **Yellow** (usable post-removal; diversity gap) |
| **TEAS** | 🟡 | 🟡 | — | — | — | — | 🟢 | **Not go** (intentionally disabled / 500 paths) |
| **CLEP** | 🟢 | 🟡 (intermittent 500 narrow path) | ❓ needs own exact check | 🟢 | 🟢 | 🟢 | 🟢 | **Yellow** |
| **PSAT** | 🟡 | 🟡 | ❓ | 🟢 | 🟡 | ❓ leaks? | 🟢 | **Yellow** (behind line) |
| **AP** | 🟡 | 🟡 | ❓ | 🟢 | 🟡 | ❓ | 🟢 | **Yellow** (behind line) |

## Verified broken-content review (independent classifier, 2026-06-23)
93 heuristic candidates → per-question independent classify → **31 verified BROKEN** (28 SAT_MATH + 3 ACT_MATH + 0 ACT_SCIENCE). 62 answerable (figure was flavor / data inline). List: `data/broken-figref-verdicts.json`; unapprove staged at `scripts/_unapprove-broken-figref.mjs` (with backup). **PENDING USER APPROVAL** (prod write). Removing these closes the Content-answerable gate for SAT (→ usable) and keeps ACT clean.

## UPDATE 2026-06-23 — SAT broken-content cleanup EXECUTED (user-approved)
31 verified-broken un-approved (28 SAT_MATH + 3 ACT_MATH), backed up (data/broken-figref-backup.json), confirmed 0 still approved. SAT_MATH 2601→2573, ACT_MATH 731→728.
- **SAT Content-answerable: 🟡→🟢.** SAT overall = YELLOW (diversity/template-collapse only — quality gap, not serve-blocker).
- **ACT: stays GO** (3 broken cleared; no unanswerable served items).
Remaining SAT to reach green-overall: figure-diversity regeneration (blueprint SAT_FIGURE_REGEN_BLUEPRINT.md, Codex validating). Next exam in order: CLEP narrow-path stability (#3).
