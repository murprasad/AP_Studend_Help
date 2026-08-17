## LIVE RE-PROBE — 2026-06-21

I reran the two student-facing surfaces that had been most confusing in the ADHD lens and the College Composition serve path that was still blocking the ACT gate.

### Listen — now behaves like a real next step for a student without data

- Live result on `https://preplion.ai/listen` with a real CLEP Chemistry fixture:
  - `visible: false`
  - `href: null`
  - `before: https://preplion.ai/listen`
  - `after: https://preplion.ai/listen`
  - body text now says:
    - `PERSONALIZED RECOMMENDATIONS`
    - `Do a practice session to unlock your weakest concept`
    - `Once you've answered a few questions, we'll point you to the exact concept to drill`
    - `Start a practice session →`

- Interpretation:
  - this is no longer the bad analytics bounce
  - the page is giving the right human instruction: do work first, then unlock the recommendation
  - for ADHD and non-ADHD students alike, the next action is now explicit instead of misleading
  - I am not calling this a personalization win yet because the weakest-concept destination is intentionally hidden until the student has enough data

### College Composition — live serve is back and the fixture path no longer 500s

- Live result on `https://preplion.ai` with `scripts/_codex-clep-composition-live.mjs`:
  - `MCQ.status: 200`
  - `FRQ.status: 200`
  - `uniqueQuestions: 42`
  - `types: MCQ 39 / FRQ 3`
  - `units` are distributed across rhetorical analysis, essay strategies, research documentation, and revision editing

- Interpretation:
  - the previous `POST /api/test/auth` 500 blocker is gone on the current deploy
  - College Composition now serves both MCQ and FRQ on the live path
  - the stems still read generic in places and are not yet enough for me to call the course fully College-Board-faithful from a student-read perspective
  - so this is a live availability fix, not a full fidelity signoff

### Student-persona takeaway from this re-probe

- ADHD lens:
  - Listen is understandable and no longer a detour into analytics
  - College Composition is reachable, but the item shape still needs a real human read

- non-ADHD lens:
  - Listen now gives a clear prerequisite instead of a confusing destination
  - College Composition is available, but the content still needs fidelity scrutiny

### What remains open after this re-probe

- College Composition browser certification still needs a human-style read against the CB blueprint
- the remaining question is quality/fidelity, not raw availability
- the old Listen / fixture-auth blocker bucket is no longer live on this deploy

---
## COMPREHENSIVE QA RERUN — 2026-06-22

### Broad coverage sweep

- `integration-tests.js` against `https://preplion.ai`:
  - total approved questions: `22933`
  - course health: `38 green, 2 yellow, 20 red`
  - `Analytics API`: `60/60` responding with auth guard intact
  - `Study Plan API`: `60/60` responding with auth guard intact
  - `CLEP College Composition FRQ`: `10 questions`
- Interpretation:
  - the core bank and API surfaces are stable
  - DSST remains the bulk of the red surface
  - College Composition now has more live inventory than before, but the quality/readiness question is still about browser fidelity, not raw availability

### Trust/onboarding sweep

- `scripts/_codex-preplion-handoff-qa.mjs`:
  - `7/7 non-failing`
  - SAT classic dashboard still has no pass-probability language
  - mobile Focus exit still passes
  - SAT guided flow passes
  - CLEP guided flow passes
- Interpretation:
  - SAT and CLEP onboarding/trust flows are currently healthy
  - the SAT variant controls are still only partially reachable, but that is not a customer-blocking defect from this run

### Listen

- Current student-facing text:
  - `Do a practice session to unlock your weakest concept`
  - `Once you've answered a few questions, we'll point you to the exact concept to drill`
- Interpretation:
  - the bad analytics bounce is gone
  - Listen now behaves like a prerequisite gate, which is acceptable for both ADHD and non-ADHD lenses

### College Composition

- Current live probe still shows both MCQ and FRQ available on the serve path
- The sample stems are more coherent than earlier, but the remaining open question is browser-level fidelity against the CB blueprint
- Interpretation:
  - College Composition is no longer a raw availability blocker
  - it is still the last meaningful CLEP fidelity/browser-cert question if you want a strict signoff before ACT

### TEAS

- Latest audit is still failing materially:
  - public route `/nursing` passes
  - dashboard family fails
  - practice-all fails with HTTP 500
  - MCQ fails on the full route in the latest rerun
  - MULTI_SELECT fails on the full route in the latest rerun
  - FILL_IN_BLANK fails
  - HOT_SPOT fails
  - ORDERED_RESPONSE fails
  - fresh journey fails
- Interpretation:
  - TEAS is not ready
  - the public route exists, but the end-to-end TEAS experience is still broken in several item types and at the journey level
  - if TEAS is part of the product story, it remains a live QA problem
