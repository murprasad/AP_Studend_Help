# Requirement: Time-Aware Mode Switching

**Recorded:** 2026-04-26
**Source:** User strategy doc — yearly demand cycle analysis
**Status:** REQUIREMENT for system readiness assessment

## Statement

The product MUST adapt its surface, defaults, and recommendations based on **time-to-exam**, not just content. One product, four modes:

| Mode | Triggers | Surface |
|---|---|---|
| **Learn** | Exam date >12 weeks away, OR no exam date set + low signal | Concepts, videos, guided paths, fundamentals |
| **Optimize** | Exam 4-12 weeks away | Weakness targeting, adaptive practice, score predictor, analytics |
| **Cram** | Exam <4 weeks away | High-yield only, FRQs, exam simulations, "night-before" mode |
| **Retake** | Within 4 weeks AFTER an exam date passed | Mistake analysis, score delta focus, retake strategy |

## Why this matters

> "If your system adapts to intent by time, not just content, you'll feel dramatically more 'intelligent' than competitors."

Static prep tools (Princeton Review, Barron's, Khan Academy) treat all users the same regardless of when their exam is. A user 3 weeks out from an AP exam needs fundamentally different defaults than a user 6 months out. Today, StudentNest serves both the same dashboard. This is the core differentiation gap.

## Cross-product mapping

| Family | Demand profile | Primary mode |
|---|---|---|
| AP | Highly seasonal, peaks Mar-May | Cram in May, Optimize Mar-Apr, Learn rest of year |
| SAT/ACT | Multi-peak, retake-driven | Optimize year-round, Cram around test weeks, Retake post-test |
| CLEP | Always-on, opportunistic | "Fast Pass 7-day" — primarily Cram-like compressed plan |
| DSST | Niche, steady | Similar to CLEP |

## Acceptance criteria

A user is considered well-served when:
- [ ] Dashboard surface matches mode based on `examDate` (already in `User` schema)
- [ ] If `examDate` is null, default mode = Learn (with Optimize CTA: "set exam date")
- [ ] Mode switch is visible — user knows which mode they're in and why
- [ ] Each mode has distinct primary CTA (Learn → "Start guided path", Optimize → "Practice weakest unit", Cram → "Today's high-yield drill", Retake → "Analyze last mock")
- [ ] Phase recommendations + study plan reflect mode (e.g., Cram skips fundamentals)
- [ ] Mode is course-specific (user can be in Cram for AP Bio AND Optimize for SAT Math simultaneously)

## Cross-references

- `memory/project_yearly_demand_cycle.md` — full 12-month demand analysis
- `memory/project_gap_analysis_phases_A_D.md` — Phase A-D ties to Optimize + Cram modes
- Phase C (Cram Mode / Exam Countdown Playbook) is the FIRST visible expression of this requirement

## Sequencing implications

- Phase A (Score Predictor) → Optimize Mode reinforcement
- Phase B (Sage Coach + FRQ annotations) → Cram Mode prep
- Phase C (Cram Mode + Exam Countdown) → **explicit Mode 3 implementation. PRIORITY for AP May peak.**
- Phase D (Daily Study OS) → Learn + Optimize modes (year-round retention play)
- Future phase: Retake Mode (June/December windows) + Mode auto-switch by `examDate`
