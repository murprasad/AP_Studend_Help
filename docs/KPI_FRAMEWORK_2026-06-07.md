# KPI Framework — Discovery Findings → Measured Targets
*2026-06-07 · SN + PL · "measure baseline → set target → action plan → implement until met"*

Every discovery finding becomes a **measurable KPI** with: a **measurement method** (a deterministic
script or a measuring agent — deterministic first, LLM-judge last, per
[[feedback_validator_must_be_deterministic]]), a **baseline**, a **target**, an **action plan**, and
an **owner + cadence**. The KPI scorecard is produced by `scripts/measure-kpis.mjs` (deterministic /
DB KPIs) + the **Fidelity Agent** (rubric KPIs). Re-run weekly; track trend vs target.

## How we measure a "soft" KPI like FIDELITY (the worked example)
You can't measure "fidelity" as one number — you **decompose it into dimensions, score each, and
composite**. Per `docs/FIDELITY_ARCHITECTURE.md`, fidelity = how closely our questions match real
CB/ACT on:

| Dim | How measured | Det / Judge |
|---|---|---|
| Option-count compliance | % questions with the exam's correct # of options | **Deterministic** |
| Stimulus/figure presence | % of blueprint-requiring items that have the required stimulus/figure | **Deterministic** |
| No hints-in-options | % with bare-value options (no "because/since" in choices) | **Deterministic** |
| Blueprint/topic-weight match | KL-divergence of our unit distribution vs CB blueprint | **Deterministic** |
| Answer-position balance | χ² of correct-answer letter distribution (no "always C") | **Deterministic** |
| Render health | % that pass the render-hazard validator (no broken LaTeX/SVG) | **Deterministic** |
| Explanation quality | % non-circular, teaching (the BIQ detector) | **Deterministic** |
| Cognitive level match | rubric-judge: is the reasoning depth CB-like vs recall? | **Judge** (LLM, sampled) |
| Distractor plausibility | rubric-judge: are wrong options tempting + diagnostic? | **Judge** (LLM, sampled) |
| CB "feel"/style | rubric-judge vs CB exemplars; + Bluebook screenshot-diff; + blind A/B persona walk | **Judge + Human** |

**Fidelity Score (per course)** = weighted mean of dimension scores (0–100). The **Fidelity Agent**
runs the deterministic dims on the *whole* course and the judge dims on a *sample* (e.g. 30/course),
emits per-dimension + composite. Human layer (Bluebook diff + blind A/B) is the final gate, not the
daily metric. This is the model for every soft KPI: **decompose → deterministic-where-possible →
judge-sampled for the rest → composite.**

---

## The KPI tree (mapped to discovery findings)

### A. Product Fidelity — *the conversion gate* (finding: "third-party is too easy/hard kills trials")
- **A1 Fidelity Score / course** — measure: Fidelity Agent (above). Baseline: **TO MEASURE** (run agent).
  Target: **≥90/100 every visible course**. Action: per-dimension gap → targeted gen/sweep. Cadence: weekly.

### B. Explanation Quality — (finding: students value "AI drilling on missed questions")
- **B1 % teaching (non-circular) explanations** — measure: `isCircular` detector (`measure-kpis.mjs`).
  Baseline: **SN 86.3%** (3,023/22,032 circular), **PL ~ (re-measure math-aware)**. Target: **≥95%**.
  Action: explanation-regen (running, prose courses); pure-math needs a recompute-validated pass.

### C. Bank Health
- **C1 % gold-tier** (pipelineVetted ∧ auditPassed) — Target ≥70%. Baseline: measure.
- **C2 Contamination rate** (off-topic Qs) — Target **<1%**. Baseline: Fin-Acct 9%→0 (fixed); sweep others.
- **C3 Coverage** (% units ≥ N approved) — Target: 0 red units on visible courses.

### D. Readiness Signal — (finding: "can't tell if I'm ready / fail by a few points"; plateau diagnosis)
- **D1 Readiness calibration** = mean |predicted − actual| on mocks/diagnostics. Measure: join
  pass-probability prediction to subsequent mock score. Baseline: **needs outcome data** (instrument).
  Target: **within ±5 scaled pts / ±5%**. Action: recalibrate formula on real outcomes.

### E. Engagement / Pacing — (finding: top in-app pain = "too long"; validates Focus Mode)
- **E1 Session completion rate** = completed / started. Measure: DB. Target: **≥80%**.
- **E2 Abandon rate** (started, not completed). Target: ≤20%.
- **E3 Focus sessions/week** (North Star) — measure: trackEvent `focus_session_complete`. Target: ↑ WoW.

### F. Retention & Conversion — (finding: Sarah used heavily then went quiet; convert-on-win)
- **F1 D1 / D7 return rate** (by signup cohort). Measure: DB. Baseline: measure. Target: **D1 ≥40%, D7 ≥20%**.
- **F2 Free→Paid conversion %**. Measure: DB. Target: set after baseline.
- **F3 Convert-on-win rate** = % who upgrade within 48h of a ≥50% session. Measure: DB join.

### G. Voice of Customer — (finding: discovery must be continuous)
- **G1 Top pain-point volume + trend** — measure: `discovery-aggregate.mjs` WoW. Target: top-pain ↓.
- **G2 NPS / would-recommend** — measure: win-moment prompt (to wire). Target: set after baseline.

---

## Operating loop (per KPI, until target met)
1. **Baseline** — `measure-kpis.mjs` + Fidelity Agent produce the scorecard.
2. **Target** — set per table above (some need a baseline first).
3. **Action plan** — the gap drives the work (e.g. B1 gap → regen; A1 stimulus-dim gap → figure gen).
4. **Implement → re-measure** weekly; a KPI is "done" only when it **holds at target for 2 consecutive
   measurements** (no one-off spikes), per [[feedback_failing_test_is_signal_not_noise]].
5. **Prevent regression** — each met KPI gets a gate (e.g. B1 → approval-time circular gate; C2 →
   contamination sweep in the gen pipeline) so it can't silently fall back.

## Build status
- **Wired now:** `scripts/measure-kpis.mjs` — computes B1, C1–C3, E1–E2, F1–F3, G1 from the DB +
  detectors → baseline scorecard (`data/kpi-scorecards/kpi-<date>.{json,md}`). Both products.
- **Next:** Fidelity Agent (A1) — deterministic dims now, judge dims (sampled) next; D1 needs outcome
  instrumentation; G2 needs the win-moment NPS prompt.
