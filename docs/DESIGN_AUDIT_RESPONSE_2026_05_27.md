# Design Audit Response — 2026-05-27

Companion to `docs/DESIGN_REVIEW_2026_05_27.md`. Tracks which findings
were fixed in this sprint vs explicitly deferred.

## Shipped this sprint (both repos unless noted)

| Audit ID | Sev | Status | Commit |
|---|---|---|---|
| SN #1 — mock-exam answer-key leak | P0 | ✅ DONE | SN `7321c3e` |
| PL #3 / SN #2 — XP/streak read-modify-write | P0 | ✅ DONE | PL `4b08825` / SN `7321c3e` |
| PL #7 / SN #3 — stale JWT premium gate | P0 | ✅ DONE | PL `4b08825` / SN `7321c3e` |
| SN #9 — mock-exam stale-closure (Q feedback misroute) | P1 | ✅ DONE | SN `7321c3e` |
| SN #7 — AI tutor turnId race (slice(0,-2) nukes typed messages) | P1 | ✅ DONE | SN `7321c3e` |
| PL #9 — auto-unapprove read-then-write | P1 | ✅ DONE | PL `fd45845` |
| SN #12 — Stripe webhook Sentry capture | P1 | ✅ DONE | SN `7f5ffdd` |
| Earlier in same session — Sage FAQ length-gate + stop-words | P1 | ✅ DONE | PL `8987290` |
| Earlier — duplicate "How was this session?" widget | P1 | ✅ DONE | PL `8987290` |
| Earlier — session-summary denominator (server-side fix only) | P1 (partial) | ✅ PARTIAL | PL `8987290` |

## Explicitly deferred — needs its own sprint

### Architectural P0s requiring multi-day refactor + heavy regression testing

| Audit ID | Sev | Why deferred |
|---|---|---|
| PL #1 — Practice-page state-machine refactor (15+ useState → keyed Record) | P0 | Touches the core student loop; 15-20 file surface area; symptom (Q2/Q3 disabled) is rare enough to ship partial fixes first, do refactor with proper QA suite. |
| SN #4 — Sage Coach FSM rewrite + transcript chunked persistence | P0 | Affects flagship product. Needs FSM design + persistence schema + thorough offline-test plan. |
| PL #2 — Session-summary three-denominator unify | P0 | Already mitigated server-side; client still has fallback math. Full fix needs UI surgery on session-summary screen + per-Q timings rewrite to read from server. |
| PL #8 — Stripe webhook N-await rollback → StripeEvent log + reconciler | P1 | Right answer is event-sourced webhook (write event log → reconciler projects entitlements). Big change; current behavior is at-least-once with cron safety net. |

### Cross-cutting (apply across many files)

| Audit ID | Sev | Why deferred |
|---|---|---|
| Both repos — error-swallow density (135+ silent catches in PL) | — | Need a `silentTelemetry(fn)` helper + sweep across 56 files. Single sprint. |
| Both repos — no optimistic-concurrency-control anywhere | — | No `updatedAt` checks in WHERE clauses on any update. Needs schema audit + per-table policy decision. |

### Smaller P1/P2 items left for follow-up

- PL #4 — timer auto-advance `useEffect` + 11 setState
- PL #5 — mock-exam `setTimeout` inside setter
- PL #6 — auto-save useEffect deps + re-bound interval
- PL #10 — study-plan two-step write
- PL #11 — tutor-conversation lost-update on parallel tabs
- PL #12 — DB keep-alive ping per tab (move to BroadcastChannel leader)
- PL #13 — confetti ref+sessionStorage dual idempotency
- PL #14 — N+1 in /api/practice POST (CTE coalesce)
- SN #5 — Sage Coach evaluate watchdog + free-tier bypass
- SN #6 — Practice auto-launch race across three useEffects
- SN #8 — Sage Coach concept loader course drift
- SN #10 — Mock-exam timer interval recreate every render
- SN #11 — Parent-invite dedicated table + abuse caps
- SN #13 — `/api/practice` answer-key defense-in-depth (currently safe but fragile)
- SN #14 — `parsedOptions` recomputed + closure capture
- SN #15 — Sage Coach Web Speech typed wrapper

## Next sprint priorities (my recommendation)

1. **Practice page state-machine refactor (PL #1)** — biggest user-visible bug class. Will eliminate items #1, #4, half of #2.
2. **Sage Coach FSM (SN #4)** — flagship trust risk.
3. **Optimistic-concurrency-control sweep** — silent corruption bugs only get worse as scale grows.
