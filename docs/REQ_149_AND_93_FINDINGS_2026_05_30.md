# SN — REQ-149 (Sprint E1 mirror) + #93 (PostMockReveal) findings

**Author:** Tech Lead investigation
**Date:** 2026-05-30
**Status:** Investigations complete. Both items require product decisions before code lands.

---

## REQ-149 — SN mirror of PL Sprint E1 single-source pass probability

### Investigation summary

PL's Sprint E1 fixed a real bug: sidebar showed pass % = 10, hero showed
pass % = 20 (same user, same course). Both were the SAME METRIC computed
two different ways. Sprint E1 unified the calculation; now both surfaces
show the same calibrated number.

SN has the same architectural split — `/api/readiness` (via
`loadReadinessSnapshot` in `score-engine-inputs.ts`) and
`/api/pass-probability` (via `computePassProbability`). **But SN's
surfaces show DIFFERENT METRICS.**

| Surface | Metric | Range |
|---|---|---|
| Sidebar ring (`/api/readiness`) | `scaledScore` (predicted score) | AP 1-5, SAT 400-1600, ACT 1-36 |
| Dashboard hero (`/api/pass-probability`) | `passProbability` (likelihood) | 0-1 (rendered as 0-100%) |

These are different metrics, not inconsistent values of the same metric.
A student seeing "SAT 1340" in the sidebar and "67% chance of hitting
your dream score" in the hero is NOT seeing a bug — they're seeing two
related-but-distinct numbers.

### The actual question

Is there a user-visible inconsistency on SN that mirrors PL's bug? **Not
that I found in the architecture.** The sidebar and hero are
intentionally showing different things.

That said, the architectural split is fragile:
- If SN ever needs to show pass % in two surfaces, the same Sprint E1
  bug class applies
- The split is confusing for future engineers maintaining it
- PL just deleted `/api/readiness` (Sprint E1.4) and SN still has it

### Recommended path forward — 3 options for PO

**A. Status quo — defer.** Document that SN surfaces show different
metrics intentionally. No code changes needed. Risk: future bug.

**B. Mirror the architectural cleanup.** Same as PL Sprint E1: delete
SN's `/api/readiness` route, migrate clients to `/api/pass-probability`,
expand the route shape with both `scaledScore` AND `passProbability`.
Effort: ~1 day. Risk: medium — touches the dashboard, sidebar, analytics.
**Recommendation:** Do this when other architectural work touches the
score-engine path; not worth a dedicated sprint.

**C. Product unification — show one metric.** Decide whether SN shows
scaledScore everywhere OR passProbability everywhere. Single number,
no confusion. Effort: 2-3 days (UI + copy). Risk: lower-bound product
clarity, but loses one signal.

**Default:** A (status quo, document). Revisit if the bug surfaces in
user reports.

---

## #93 — Wire PostMockReveal into mock + diagnostic completion

### Investigation summary

PostMockReveal is the SN equivalent of PL's PostCompletionModal — the
single-decision lock-in screen that fires after a mock or diagnostic
completes. It's the highest-intent moment for trial conversion (parent
sees the predicted score, sees the gap to dream school, clicks "trial").

Current state:
- The component exists at `src/components/mock-exam/post-mock-reveal.tsx`
- It is NOT mounted on the mock-exam complete screen yet
- It is NOT mounted on the diagnostic complete screen yet
- The post-completion-modal pattern (used by PL) is the right reference

### What's blocking the wire

1. **Readiness rebrand** — per memory, PostMockReveal language was
   designed pre-"Predicted Score" rebrand (SN moved from
   `passProbability` UI labels to "Predicted Score" labels for
   parent-facing clarity). The component copy may still say "pass
   probability" — needs an audit.
2. **Funnel attribution** — PostMockReveal needs to fire
   `trackTrialStarted(course, "post_mock_reveal")` (now wired in PL's
   gtag.ts; ported to SN today). The wire needs to call this event so
   conversion attribution works.
3. **Mount points** — need to identify where in mock-exam/page.tsx and
   diagnostic/page.tsx the modal should fire. Likely at the
   results-render step after `completedAt` lands.

### Recommended path forward

1. Audit PostMockReveal copy for legacy "pass probability" → "predicted
   score" replacements.
2. Add `trackTrialStarted` (using SN's new gtag.ts) on trial-start click.
3. Mount on mock-exam complete + diagnostic complete pages.
4. QA: write a spec that triggers a mock complete and asserts the modal
   appears.
5. Estimated effort: ~3-4 hours focused.

### Why this matters

PostMockReveal is SN's **highest-conversion-moment intervention**.
Without it, users finish a mock exam, see their score, and bounce.
Wiring it is the SN equivalent of PL's REQ-020 fix that already shipped.

**Recommendation:** Schedule for the next conversion-focused sprint. The
infrastructure is in place (component + gtag.ts events); it's a
~half-day wiring job.

---

## Summary

Both items investigated. Both have clear paths forward, but both need
product input or a dedicated sprint window to ship. Neither is shipping
in this session.

Items now have:
- Documented root-cause / architectural findings
- 3 forward-path options each
- Effort estimates
- Recommended default

**This documentation serves as the kickoff brief for whoever picks up
the work next.**
