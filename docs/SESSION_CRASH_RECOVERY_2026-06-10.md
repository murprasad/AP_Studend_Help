# Session Crash-Recovery — 2026-06-10 (StudentNest / AP_Help-focused)

Companion: `PrepLion/docs/SESSION_CRASH_RECOVERY_2026-06-10.md` (PL-focused, has the shipped-code detail).
This session's primary work was in PrepLion; this file captures SN-relevant state + actions.

## 🎯 ACTIVE HARD-REQUIREMENT GOAL (continuous, applies to BOTH products)
**Diagnose why PL+SN don't grow/retain students; implement highest-impact fix; document rest. Goal: more students try → addicted → subscribe. Continuous until gap + KPIs fixed.**

### Evidence — SN real prod funnel (n=215, 2026-06-10)
| Stage | n | % |
|---|---|---|
| Signed up | 215 | 100% |
| Onboarding done | 175 | 81.4% |
| Answered ≥1 Q | 120 | 55.8% |
| Completed ≥1 sess | 106 | 49.3% |
| **Returned day-2+** | 33 | **15.3%** |
| Subscribed | 3 | 1.4% |
- **89% one-and-done. D2 retention 15%.** Same disease as PL (D2 24%), worse. **Root cause: no return loop.**

### The fix — RETURN HOOK — now on BOTH products ✅
At session-end, show the streak + "come back tomorrow, your next set is ready" (return intention at peak attention). Shipped PL 2026-06-10; **PORTED TO SN same day** (build clean, deployed). SN files: `src/app/api/practice/[sessionId]/route.ts` (updateUserProgress returns `{streakDays, streakAdvanced}`; captured at call site → summary response) + `src/app/(dashboard)/practice/page.tsx` (SessionSummary interface + summary render, ~line 1090). Copy is track-neutral (works for SAT/ACT/AP). Measure D2-retention lift over next 2 weeks.

## 🔧 SN-SPECIFIC PENDING (from 2026-06-10 audit + parity review)
**Parity gaps surfaced by independent audit (PL shipped admin product-sep + test-user detector):**
- **SN test-user detector** — currently INLINE in `src/components/admin/users-list-tab.tsx` (lines ~34-38), and SN's pattern set is actually a SUPERSET of PL's (`@example.*`, `persona-`, `walk-`, `playwright-`, `+std/sat/act`). Action: extract to `AP_Help/src/lib/test-users.ts` (mirror PL shape); ALSO PL should adopt SN's broader patterns.
- **SN Recent-Signups bug** — `src/components/admin/monitor-tabs.tsx` (~line 110) shows raw recentUsers; QA accounts (`murprasad+std`, `qa-`, `persona-`) appear in real signups. PL just fixed this; mirror the `!isTestUser(...)` filter. LOW effort, real bug.
- SN admin product-separation (SAT/ACT/AP/PSAT selector) is OPTIONAL — SN's product model differs from PL's; not a defect to port wholesale.

**Fidelity / student (from SN pending audit):**
- #38 generator-side answer-position randomization (new gens cluster correct answer at A).
- #34 ACT_MATH 5→4 option legacy regen (~751 Qs; do NOT mass-unapprove — 200 floor).
- #37 CB corpus re-parse (LaTeX math mangling + ACT_ENGLISH ~14% ACT-Math bleed).
- Circular-explanation prevention gates (explanation quality 91.6% → 95%).
- Broken Khan-Academy link gate (665 hardcoded links in courses.ts, no validator).
- #21 dashboard ONE next-action resolver (next-step-engine.ts exists, flag-gated OFF).
- SAT/PSAT linked-stimulus generator (#12); Bluebook exam-skin runner; version bump → 11.3.0.

## 🔴 USER-ACTION BLOCKED (SN)
- GSC + Bing submit (sitemap/schema live, owner-only). Social accounts (@studentnestprep) + post the 10 rendered videos (`_video-gen/out`). GA4 + Clarity IDs in CF env. ADHD outreach send. Delete leaked `.cron-secret-to-paste.txt`.

## Cross-product process note
BIQ / 6-role quality process (`docs/QUALITY_PROCESS.md`, mirrored in both repos) is a HARD REQUIREMENT — every change runs G1–G6 with INDEPENDENT REV + QA-walk before "done". Memory anchor created this session (`feedback_quality_process_biq_mandatory.md`).
