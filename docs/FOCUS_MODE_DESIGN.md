# Focus Mode — Differentiation Design Spec (SN + PL)

**Goal:** turn Focus Mode from a near-invisible toggle into the product's signature differentiator — the "execution layer for learning." Pilot on **StudentNest SAT** (per strategy: high pain, parents pay, measurable). Strategy source: `memory/project_focus_steady_mode_strategy_2026-06-06.md`.

---

## 1. Current state (audited 2026-06-06) — the problem
`focusMode` (in `use-focus-prefs.ts`) is read in **3 files**. It only:
- hides the streak chip + mid-session pulse + one hint line in `practice/page.tsx`,
- is a toggle in `settings`,
- gates the activation card's suppression.

It does **NOT** change layout, sidebar, chrome, color, type, flow, or behavior. This is the "only changing what's hidden" anti-pattern — it doesn't even change colors. **A student cannot feel a mode shift.** No differentiation.

---

## 2. The two modes (the gear-shift)
| Dimension | **Regular Mode** (plan & explore) | **Focus Mode** (execute one thing) |
|---|---|---|
| Purpose | planning, exploration, browsing | high-intensity single-task execution |
| Content | full dashboard, syllabus, stats, all practice sets | ONE micro-task at a time |
| Pace | flexible, self-directed | fixed sprint timer (5/10/15 min) |
| Distractions | full nav, cards, recommendations | nav hidden, single centered column, nothing else |
| Progress | unit-level mastery | ultra-granular momentum (in-a-row, minutes focused, recoveries) |
| Palette | energetic (CB cobalt/white/yellow) | calm (warm off-white, muted slate/sage, dimmed) |
| Emotional signal | "I'm organizing" | "I'm locked in" |

The switch is **visual + emotional**, not just functional. Show the connect-the-dots win: *"Regular helped me plan; Focus helped me finish my math section in half the time."*

---

## 3. Color scheme (concrete tokens)
**Regular Mode (existing CB skin — keep):** `--cb-cobalt` energetic blue, white surfaces, `--cb-yellow` accent, gradients OK. Energy + motivation.

**Focus Mode (NEW — calm, add as a `data-mode="focus"` theme scope):**
| Token | Value | Why |
|---|---|---|
| `--focus-bg` | `#F6F7F4` (warm off-white) / dark opt `#1A1D21` | reduce glare; not stark white |
| `--focus-surface` | `#FFFFFF` w/ 1px `#E7E9E4` border | one quiet card |
| `--focus-text` | `#33404D` (soft charcoal, not pure black) | lower contrast strain |
| `--focus-accent` | `#5B7C99` muted slate-blue (or `#6B8E7F` sage) | calm, not the cobalt "alert" blue |
| `--focus-accent-soft` | 8% tint of accent | selected states |
| timer | calm progress **ring**, accent color | NOT a red ticking countdown |
| motion | none/minimal; 150ms ease fades only | overstimulation hurts focus users |
**Removed in Focus:** gradients, leaderboards, streak-as-competition, multiple CTAs, animations, badges, ambient cards.
**Layout in Focus:** sidebar hidden, top bar minimal (exit + timer + momentum only), single centered column `max-w-[640px]`, larger type (`text-lg`+), generous line-height + whitespace.

---

## 4. The flow
**Entry (guided, lightweight — NOT a heavy wizard):**
1. Student picks goal/course (existing).
2. ONE calm prompt: **"How do you want to study right now?"** → `[ Flexible plan ]` (Regular) / `[ Focused session ]` (Focus). Remembered; switchable anytime via a header pill.

**Regular Mode:** the (decluttered) dashboard — explore/plan/stats. *Depends on the dashboard clarity ICA landing first (one score, no card-flip).* Positioning "reduces overwhelm" is not credible until Regular itself is clean.

**Focus session (the differentiator):**
1. **Confirm ONE micro-task** — "Answer 5 Algebra questions" (chunked from the goal). One action.
2. **Calm full-screen single-task** — one question, calm palette, sprint ring, no nav, dimmed chrome.
3. **Momentum feedback** after each — "✓ 3 in a row · 6 min focused" (behavior, never grade/percentile/rank).
4. **"This is a lot →" button** always visible → `[ Make it easier ]` `[ Break it down ]` `[ Shorter set ]` `[ Quick win ]`. Emotional safety = the moat feature.
5. **Dynamic-difficulty ramp** — open with a confidence-first easy item; most quit on early friction → engineer the early win.
6. **Exit** — momentum recap ("10-min sprint · 5 done · recovered once · 8-min longest focus") → guided next step (ties to the post-practice → dashboard weak-area loop already built).

---

## 5. Behavioral MVP (the 5 must-haves) → where they plug in
1. **AI task-chunking** — goal → micro-steps. Phase 2 (LLM). Phase 1: pre-defined chunks per unit (no AI).
2. **Adaptive sprint timer** — Phase 1, rule-based (5/10/15) + momentum.
3. **Momentum system** — Phase 1, from existing `StudentResponse` (in-a-row, minutes, recoveries).
4. **Mode workflows** — Phase 1 (test/homework/learn/review presets).
5. **"I'm Overwhelmed" button** — Phase 1, rule-based responses (easier item / shorter set / quick win); Phase 2 adds AI reframe.
*Auto-detect struggle → suggest Focus Mode* = Phase 3 moat (frequent stops/hesitation/abandonment risk).

---

## 6. Pilot definition (depth > breadth)
- **Surface:** SN SAT practice (`/practice` in Focus Mode).
- **Phase 1 build (cheap, high-signal, NO new AI):** Focus session shell — calm `data-mode="focus"` theme + dimmed chrome + hidden nav + single-task column + sprint ring + momentum line + overwhelm button (rule-based) + dynamic-difficulty ramp + entry mode-choice. **This alone is a strong, demoable differentiator.**
- **North Star metric:** **completed focus sessions / week.** Secondary: session-completion rate · uninterrupted minutes · return-sessions/day · overwhelm-button → recovery rate · time-to-first-action · rage-quits.
- **Differentiation proof:** A/B retention + completion, Focus-on vs Regular-only cohorts. (Needs GA4 + Clarity — pending env vars.)
- **Positioning when shipped:** "Learning that adapts to your focus level" (SN) / "SAT prep that adjusts to how you study best" (PL). Never "ADHD mode."

---

## 7. Sequence (hard dependency)
1. **Dashboard clarity ICA** (one Projected-SAT score + fix card-flip) — makes Regular Mode clean ⇒ the contrast with Focus is real and the "reduce overwhelm" claim is honest. **Blocks the pilot.**
2. **Focus Mode v2 Phase-1 shell** (this doc, §6).
3. Instrument North Star (GA4/Clarity) → measure.
4. Phase 2 (AI chunking + overwhelm reframe) only after Phase-1 shows session-completion lift.

---

## Both products
`PL = SN`. Same Focus Mode; PL palette inherits the same calm theme. Mirror this doc to `PrepLion/docs/`.

## Last updated
2026-06-06 — v1 design spec written after auditing the near-empty current Focus Mode; defines the calm theme, two-mode flow, behavioral MVP, and SAT pilot.
