# StudentNest — Session Work Log

Living plan + status doc. **Write the plan BEFORE starting work. Mark complete with commit SHA AFTER.** Crash-recovery reference — read on resume.

Conventions:
- `[ ]` planned
- `[~]` in progress
- `[x]` complete (include commit SHA or evidence)
- `[!]` blocked — requires user action

---

## Session 2026-04-21 — Conversion funnel + SEO landing pages

### Tranche 1 — Ship the uncommitted conversion-fix bundle + readiness wiring

- [x] Diagnose the "0 coach_requested / 67 dashboard_loads" mystery — race in `dashboard-view.tsx` already fixed in working tree, needed deploy (commit `45dacd0`)
- [x] Push `FunnelEvent` table to prod via HTTP adapter (`scripts/apply-funnel-event-table.mjs`) — TCP/5432 blocked from sandbox + user network
- [x] Run `npm run release:check` — 24/24 checks pass after fixing logo-delegate lookup + version bump to 5.1.0 / Beta 5.1
- [x] Commit + deploy Beta 5.1 (paywall + nudge + FunnelEvent) — `45dacd0` live
- [x] Wire `showScore` from snapshot → `/api/coach-plan` → `OutcomeProgressStrip` (REQ-025 anti-demoralization) — commit `2bde17b`
- [x] Port diagnostic → focused-practice funnel: `buildFocusedPracticeUrl` helper + inline CTA on results page + URL-param auto-launch on `/practice` — commit `afe17c3`
- [x] Trial days-remaining banner (≤3d threshold, severity at ≤1d) + CLEP cleanup script + per-course count script — commit `e1d9656`
- [x] Second deploy: `2bde17b` + `afe17c3` + `e1d9656` — live (smoke 15/15 pass)

### Tranche 2 — SEO marketing pages (PrepLion port)

- [x] `/how-hard-is/[slug]` dynamic route — 16 pages (one per AP/SAT/ACT course) with FAQPage JSON-LD — typecheck passes, uncommitted yet
- [x] `/pass-rates` static reference page — AP 3+ rates, SAT/ACT percentile tables — typecheck passes
- [x] `/wall-of-fame` — adapted from PrepLion CLEP version for AP/SAT/ACT, reads from existing `/api/leaderboard`
- [~] Commit SEO tranche + deploy

### Pending user action (blocks completion)

- [!] Run cleanup script: `node --env-file=.env scripts/cleanup-clep-junk.mjs` — sandbox denied, user must execute. Deletes unapproved CLEP/DSST junk rows (estimated ~130k).

### Pending work after tranche 2

- [ ] `#13` — Expand AP catalog (English Lang, HuGeo, Gov, Precalc, EnvSci)
  - **Per-course recipe (user directive 2026-04-21):**
    1. Download official material from College Board AP website (sample MCQs, past FRQs, CED PDF)
    2. Add `ApCourse` + `ApUnit` enum values to `prisma/schema.prisma` (`npx prisma db push`)
    3. Add `CourseConfig` block to `COURSE_REGISTRY` in `src/lib/courses.ts`
    4. Phase A ingest — write or adapt `scripts/ingest/ingest-ap-<course>.mjs` to populate `OfficialSample`
    5. Phase B review — generate `docs/content-analysis/AP_<COURSE>.md`
    6. Phase C generate — `node scripts/regen-grounded.mjs --course=AP_<COURSE> --mode=fill-to-target --target=500`
    7. Phase D sweep-validate — `node scripts/sweep-validate.mjs --course=AP_<COURSE>` (Haiku 4.5 un-approves any that fail)
    8. Phase E audit — `node scripts/ap-audit-questions.js --fix` + `scripts/ap-ai-review-questions.js --fix`
  - **Per-question quality requirements (user directive):**
    - Matches CB MCQ or FRQ structure exactly
    - College Board–level rigor (not easier, not arbitrarily harder)
    - Correct unit-weight ratio per AP CED (e.g., AP World Unit 1 = ~8–10% of exam, so question mix should mirror that)
    - Distractor quality (plausible-but-incorrect, common-misconception-based)
    - Single unambiguous answer
  - **Reference policy (user directive 2026-04-21):** Do NOT assume quality. Go to the College Board website, download official PDFs (CED, released exams, past FRQs, sample Qs). ALSO use free/legal sources: OpenStax, Khan Academy, MIT OCW, AoPS, Modern States. Use the downloaded material as the reference corpus for Phase A ingest and Phase C generation. Every generated question must be validated against these real exemplars — no hallucination.
  - Estimated effort: ~1 day per course × 5 courses + CB-PDF fetch time
- [ ] `#15` — Mobile parity (haptics, swipe, PTR, TTS, flashcards UI)
- [ ] `#16` — Flashcards port (SM-2 + swipe UI + 6 card types)
- [ ] `#12 v2` — Middleware gating for expired trials (deferred — separate UX decision)
- [ ] Write `docs/QUESTION_GEN_RUNBOOK.md` — formalize phases A–E of grounded question generation

### Persisted memory

- `project_current_state_2026-04-21.md` — crash-recovery snapshot (already saved)
- `project_backlog_2026-04-21.md` — prioritized backlog across all remaining work
- MEMORY.md — updated index, `project_current_state_2026-04-21` listed first

---

## Grounded question-generation pipeline (Phases A–E) — reference

| Phase | What | Script / Output |
|---|---|---|
| **A — Ingest** | Parse CB / OpenStax / Khan / MIT PDFs into `OfficialSample` rows | `scripts/ingest/ingest-*.mjs` (per-course), `ingest-all-ap.mjs` (batch) |
| **B — Review** | Per-course markdown analysis of corpus | `docs/content-analysis/*.md` + `INDEX.md` |
| **C — Grounded regen** | RAG-grounded generation of new questions | `scripts/regen-grounded.mjs --course=X --mode=fill-to-target --target=500` |
| **D — Sweep-validate** | Haiku 4.5 sweep → un-approve failures | `scripts/sweep-validate.mjs --all --resume` |
| **E — AI review/audit** | Final audit + regen unapproved | `scripts/ap-ai-review-questions.js --fix`, `scripts/ap-audit-questions.js --fix` |

Run-to-completion order per course; each phase is idempotent (contentHash + `--resume`). No explicit runbook in StudentNest — `docs/QUESTION_GEN_RUNBOOK.md` TODO.
