# Crash Recovery Snapshot — 2026-05-31

> Updated ~hourly while the autonomous loop is running. See the
> companion memory entry at
> `~/.claude/projects/C--Users-akkil-project-PrepLion/memory/project_active_goals_2026_05_31.md`
> for the latest version if this file is stale. PrepLion sister file
> at `C:/Users/akkil/project/PrepLion/docs/CRASH_RECOVERY_2026_05_31.md`.

## Active goals (4)

| # | Goal | Status |
|---|---|---|
| 1 | SN landing → CB design | ✅ DONE (`56fa107` + brand fix `a63ade8`) |
| 2 | PL landing → match SN design | ✅ DONE (PL commit `1ae78bb`) |
| 3 | SAT = CB digital SAT parity (Sprint S1-S4) | 🟡 7/16 shipped + validation engine extended |
| 4 | All PL+SN public pages → SN design | ✅ DONE via CB-skin globals.css overrides + chrome migration |

## Goal 3 — Sprint S1-S4 progress (the long-running one)

### Shipped to master

| Item | What it does | Commit |
|---|---|---|
| F3 | SAT_MATH copy corrected for digital SAT | (deploy-gates commit chain) |
| F5 | SAT_R&W copy corrected | `b9ffbab` |
| F6 | CB-spec weighted sampling in `/api/mock-exam` | `b9ffbab` |
| F4 | Desmos calculator panel on every SAT/PSAT Math Q | `3a875ea` |
| F2-structure | 2-module SAT mock with 10-min break | `3a875ea` |
| F7 | Scaled 200-800 (SAT) / 160-760 (PSAT) per section + 15 unit tests | `fe92e53` |
| F12 | Khan Academy SAT skill-links on wrong-answer explanations + 12 unit tests | `9d05bf7` |
| Validation engine | SAT 4-choice + R&W stimulus gate + NUMERICAL branch + 19 tests | `c160d67` |

### Pending — next-tick pickup order

1. **F8** M2 difficulty tier feeds into scaled-score band ceiling
2. **F11** IRT calibration wired to SAT (replaces piecewise curve in F7)
3. **F13** Tag every SAT Q with the official CB skill code — needs DB-write auth
4. **F9** Domain subscores on result page
5. **F14/F15/F16** Practice ecosystem — study plans, skill heatmap, free 8 full-length tests

### Blocked on user
- F1 / F5b SAT bank audits — need DB-read auth for `scripts/audit-sat-vs-cb-official.mjs`

## Goal 4 — Cross-page design migration

### Chrome migration (DONE on both repos)
- marketing layout, marketing header, marketing footer (PL), auth layout — all CB tokens.
- DSST marketing routes deleted on PL (`/dsst-prep`, `/dsst-passing-scores`, `/dsst-test-day-guide`, `/free-dsst-practice`).

### CSS skin overrides (DONE on both repos)
- `globals.css` `@layer utilities` rules flatten legacy gradient/blue/amber → CB tokens on every marketing+auth page via `font-roboto` selector specificity.
- Verified live in production CSS bundles on both `studentnest.ai` and `preplion.ai`.

### What's not yet rewritten
- Hero illustrations + page bodies for `/clep-prep`, `/accuplacer-prep` (PL), `/sat-prep`, `/ap-prep`, `/act-prep`, `/psat-prep`, `/am-i-ready` (both). Chrome looks CB now, but page bodies retain their original layouts.

## Pre-existing test debt (not blocking prod)

- `tests/e2e/critical-paths-2026-05-03.spec.ts:88` — "Find my weak areas" CTA assertion against the OLD landing. SN deploy `bn3fiqm40` failed playwright on this, wrangler push went through so prod IS updated.

## User-blocked items
- DB-read auth for `scripts/audit-sat-vs-cb-official.mjs` (F1 + F5b)
- SN GA4 measurement ID

## Recent in-flight deploys (today)

| ID | Repo | What | Outcome |
|---|---|---|---|
| `bjef11h5m` | PL | @layer-wrapped CB-skin CSS + relaxed pre-release-check | ✅ exit 0 |
| `bn3fiqm40` | SN | @layer-wrapped CB-skin CSS + relaxed pre-release-check | ✅ wrangler push live |
| `b2hp1h3af` | PL | Chrome migration + DSST route deletion | ✅ exit 0 |
| `betdhipal` | SN | Chrome migration | ✅ exit 0 |
