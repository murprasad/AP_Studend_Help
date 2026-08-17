# Onboarding redesign — register → Focus/Regular → dashboard (A30.87, 2026-07-01)

User goal: eliminate unnecessary onboarding steps. LIVE on preplion.ai.

## Target flow (all tracks)
Register (captures the exam) → ONE choice: Focus vs Regular (Focus default) → dashboard.
- SAT/ACT/TEAS: NO course pick (single-primary-course tracks → track default).
- CLEP: course picked at registration (carried as `?course=` so it's never asked twice);
  if none, the journey shows the CLEP picker once, then Focus/Regular.
- Warm-up + diagnostic REMOVED from onboarding (straight to dashboard "Start").

## Key files
- `src/components/journey/step-mode-choice.tsx` (NEW) — Focus/Regular screen; writes
  `setFocusMode` (use-focus-prefs, localStorage; Focus already the default). onContinue
  is awaited + resets `busy` in finally (retry works on API failure).
- `src/app/(journey)/journey/page.tsx` — added `modeChoice` Mode; `handleStart` now just
  stores the course + `setMode("modeChoice")`; NEW `handleModeChosen` completes onboarding
  (apiPost start + advance step 5) → `/dashboard?onboarding=1`. Auto-skip Step-0 for
  SINGLE_COURSE_TRACKS (sat/act/nursing) + when `?course=`/freeTrialCourse is set.
  nursing(TEAS) removed from the →/onboarding redirect (uses the unified journey now).
  TRACK_DEFAULT_COURSE gained `nursing:"TEAS"`. useSearchParams wrapped in <Suspense>.
- `src/app/(auth)/register/page.tsx` — credentials signup now routes to
  `/journey?course=<picked>` (was `/practice` warm-up, which BYPASSED the new screen —
  the REV's key catch). Google path still uses the warm-up callback (track/pickedCourse
  params) — FOLLOW-UP to unify.
- `src/app/(dashboard)/onboarding/page.tsx` — nursing now redirects → `/journey` (kills
  the dual-TEAS-onboarding the REV flagged).
- `src/app/(dashboard)/practice/page.tsx` — removed the redundant per-session
  "How do you want to study? Flexible/Focused" selector (Focus/Regular is set at onboarding).

## Verification
tsc clean; independent REV (found + fixed: signup bypass, dual-TEAS onboarding, stuck
button); build green; deployed A30.87; prod smoke all healthy (no 500s). NOT yet walked
with a real login (Prisma-WASM dev auth blocks local; user testing on prod).

## Known follow-ups
- Google OAuth signup still routes to the warm-up (not the new flow) — unify.
- Codex's First-Question Funnel panel (/admin?tab=value) now measures whether this
  simpler flow reduces the first-question bounce (Rifah/Sophie pattern).
