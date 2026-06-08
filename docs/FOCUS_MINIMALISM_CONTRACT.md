# Focus Minimalism Contract — SN + PL

**One standard for both products.** Mirror every edit between
`AP_Help/docs/FOCUS_MINIMALISM_CONTRACT.md` and
`PrepLion/docs/FOCUS_MINIMALISM_CONTRACT.md`.

> Origin: PCA for a **recurring defect class** (2026-06-08). Focus Mode stripped
> SOME surfaces (sidebar, dashboard one-action, in-session chrome) but not
> others — most visibly the **practice SETUP screen**, which still rendered the
> full buffet (mode-chooser + course switcher + Unit/Difficulty/Count selectors
> with a 20-question option). The user reported **three of these in a row**
> (dashboard one-action, 20-question count, setup buffet). Same root cause: there
> was **no holistic "Focus minimalism" contract**, and the Focus QA walk only
> checked the dashboard. This document is that contract; `scripts/_qa-walk-focus-minimalism.mjs`
> is the QA walk that enforces it across EVERY surface.

---

## The principle

> **In Focus Mode, every authed surface presents exactly ONE essential next
> action and calm. Nothing else.**

Focus Mode is for students who learn differently (ADHD / focus-friendly). It is
an accommodations-style study aid — never a medical/diagnostic claim. The felt
experience is a *gear-shift into calm*: one thing at a time, no buffets, no
decision tax, no ticking secondary chrome.

Five enforceable rules derive from the principle. **Every Focus surface must obey
all five.**

| # | Rule | Concretely |
|---|------|-----------|
| R1 | **One primary action** | Exactly one primary CTA per surface (one `Start`, one `Next`, one feedback prompt). Secondary CTAs, cross-sells, upsells, nudges → hidden. |
| R2 | **No mode-choosers** | Choosing the mode (Flexible vs Focused, "How do you want to study?", session-type buffet) is gone — the student is already in Focus; don't re-ask. |
| R3 | **Settings collapsed by default** | Unit / Difficulty / Count / course-switcher are NOT shown inline. A single subtle "Customize" / "Adjust" affordance reveals them on demand. Default is sensible + invisible. |
| R4 | **Short counts only** | Session length options cap at **≤10** in Focus (no 15, no 20). Default 10 or fewer. Long sets are a focus hazard. |
| R5 | **Calm + subtle** | Calm palette (`data-focus-mode="true"` / `.focus-app`), no sidebar/bottom-nav/Sage widget/opt-in banners, subtle disclaimers (not amber warning cards), no secondary ticking chrome competing for attention. |

The Focus pill (top-right, `aria-pressed`) is the **only** persistent escape
hatch and is exempt from R1's "one CTA" count — it is chrome, not a surface
action.

---

## Per-surface rules (the QA checklist)

QA runs `scripts/_qa-walk-focus-minimalism.mjs` and asserts each row. A surface
is **non-compliant** (HARD FAIL) if any KEPT item is missing or any HIDDEN item
is present.

### 1. `/dashboard` — the hub
| | |
|---|---|
| **HIDDEN** | Sidebar (`aside.fixed.inset-y-0`), bottom nav, Sage widget, push/SMS opt-in banners, multi-card buffet, mobile header. |
| **KEPT** | `data-testid="focus-dashboard"` one-action view; calm theme (`data-focus-mode="true"`); the Focus pill (pressed). |
| **Assert** | `aside.fixed.inset-y-0` count === 0; `[data-testid="focus-dashboard"]` ≥ 1; `[data-focus-mode="true"]` ≥ 1; `button[aria-pressed="true"]:has-text("Focus")` ≥ 1. |

### 2. `/practice` (SETUP) — the regression hotspot
| | |
|---|---|
| **HIDDEN** | The **mode-chooser** ("How do you want to study right now?" / Flexible vs Focused cards); the session-type buffet (Practice vs FRQ card grid as a *chooser*); the inline course switcher (`CourseSelectorInline`); the inline Session-Settings selects (Unit / Difficulty / Number of Questions). The **20-question** count option must NOT exist. |
| **KEPT** | Exactly ONE primary CTA — `Start` / `Start focused session`. A single subtle **Customize / Adjust** affordance that, when tapped, reveals the (now `≤10`-capped) settings. Sensible defaults applied silently (e.g. `ALL` unit, `ALL` difficulty, count = 10/5). |
| **Assert** | No element with text "How do you want to study"; mode-chooser cards absent; `CourseSelectorInline` absent; the three setting `<Select>` triggers (Unit/Difficulty/Number) NOT visible by default; a "Customize"/"Adjust" trigger IS present; after expanding, the count options contain NO "20"; exactly one primary Start CTA. |

### 3. `/practice` (IN-SESSION) — answering a question
| | |
|---|---|
| **HIDDEN** | Sidebar, bottom nav, Sage widget, opt-in banners (exam-mode already hides these); secondary nudges/upsells stacked beside the question. |
| **KEPT** | The question + its options; one primary advance CTA (`Submit` → `Next Question` → `See Results`); the calm sprint frame (single timer, no competing tickers); the "I'm Overwhelmed" / breath safety control (a calm aid, not a buffet). |
| **Assert** | Exactly one primary advance button visible at a time; calm theme present; no sidebar. |

### 4. `/practice` (COMPLETION / feedback) — session summary
| | |
|---|---|
| **HIDDEN** | The post-session **buffet** of stacked nudges (FRQ-taste + next-session + cross-module) — replaced by ONE `PostSessionNextStep` hero. |
| **KEPT** | One feedback prompt (`SessionFeedbackPopup`), rendered **stably** (no mount/unmount flicker — see Defect Ledger D7); the summary stats; exactly one forward CTA (`PostSessionNextStep`). |
| **Assert** | Feedback prompt present **exactly once** and **stable** across a ~3s hold (no flicker — assert it did not unmount/remount); exactly one primary next-step CTA. |

### 5. `/mock-exam` — timed full-length
| | |
|---|---|
| **HIDDEN** | Sidebar, bottom nav, Sage, banners; setup buffet beyond the single Start. Long-format defaults are acceptable here (a mock *is* long), but the entry must still be one-action. |
| **KEPT** | One `Start` CTA; calm theme; the in-exam single timer; the 2-module break (SAT) as a calm pause, not a settings panel. |
| **Assert** | Exactly one primary Start/Begin CTA on entry; no sidebar; calm theme present. |

### 6. Analytics-adjacent surfaces (`/analytics`, `/study-plan`, `/resources`)
| | |
|---|---|
| **HIDDEN** | Sidebar/bottom-nav/Sage/banners (exam-mode auto-full-screen already covers these); secondary CTA stacks. |
| **KEPT** | The single return-to-dashboard escape (exam-mode top bar); calm theme; the primary content with at most one forward CTA. |
| **Assert** | No sidebar; calm theme present; ≤1 primary CTA in the content header. |

---

## Defaults table (what Focus silently picks so the buffet can hide)

| Setting | Regular default | Focus default | Focus cap |
|---|---|---|---|
| Unit | `ALL` (user-chosen) | `ALL` | n/a |
| Difficulty | `ALL` (user-chosen) | `ALL` (easy-first ramp via `rampEasyFirst`) | n/a |
| Question count | 10 | **10** | **≤10** (no 15/20) |
| Mode | user picks Flexible/Focused | already Focused — no chooser | n/a |
| Course | inline switcher | last-selected (hook); switch via Customize | n/a |

---

## How to run the QA walk

```bash
# StudentNest
E2E_BASE_URL=https://studentnest.ai node scripts/_qa-walk-focus-minimalism.mjs

# Local
E2E_BASE_URL=http://localhost:3000 node scripts/_qa-walk-focus-minimalism.mjs

# PrepLion parity (when the PL walk is ported)
E2E_BASE_URL=https://preplion.ai node scripts/_qa-walk-focus-minimalism.mjs
```

The walk authenticates a real fresh user via the Radix grade `<Select>`, drives
the 5-step journey to an onboarded `/dashboard`, turns Focus ON, then visits
EACH surface above and asserts MINIMAL by counting elements / checking absence.
It **hard-fails** (no `.catch` swallowing) so a regression in any surface blocks.

**This walk MUST fail today** on the un-stripped `/practice` setup (mode-chooser
present, settings inline, 20-question option present) — that is by design: the
walk's job is to catch this exact defect class until the practice-setup
minimalism ships.

---

## Wiring to the Quality Process

- **G4 (QA Gate)** in `docs/QUALITY_PROCESS.md` carries a checklist line:
  *"Focus minimalism — every Focus surface walked + asserted minimal (no
  mode-chooser, settings collapsed, count ≤10, one primary CTA), per
  docs/FOCUS_MINIMALISM_CONTRACT.md."*
- Any Focus-Mode change re-runs this walk as part of the G4 persona walkthrough.
- New authed surfaces MUST be added to the per-surface table AND to the walk
  before they ship — a surface with no Focus rule is a contract gap.

## Last updated
2026-06-08 — v1. PCA for the Focus-strips-some-surfaces-not-others defect class.
