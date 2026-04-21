# Test Plan — DailyGoalCard re-inclusion on dashboard

**Feature:** Re-add existing `DailyGoalCard` to the new clean dashboard
layout. This is already-deployed code; the only change is including it in
`dashboard-view.tsx` (dropped during the PrepLion-port simplification).

**Files touched:** `src/components/dashboard/dashboard-view.tsx`

**Deploys affected:** StudentNest only.

## 1. Functional

- [ ] F1: Dashboard renders → DailyGoalCard appears between OutcomeProgressStrip and MicroWinCard
- [ ] F2: Card fetches /api/daily-goal?course=X on mount
- [ ] F3: Pre-signal user → card shows "first session" nudge, not fake +0.0
- [ ] F4: Post-signal user → card shows Qs answered / target + progress bar

## 2. Negative 3:1

- [ ] N1: /api/daily-goal 401 → card hides or shows empty
- [ ] N2: /api/daily-goal 500 → card hides gracefully
- [ ] N3: Empty response → no crash
- [ ] N4: Missing course param → silent fail
- [ ] N5: Network timeout → card eventually hides
- [ ] N6: Rapid course switch → no double-fetch race
- [ ] N7: `targetQs: 0` edge case → card handles
- [ ] N8: `progressPercent > 100` → bar caps correctly

## 3. Integration

- [ ] I1: /api/daily-goal returns expected shape (targetQs, answeredToday, progressPercent, hasSignal)
- [ ] I2: New dashboard renders without extra padding/gap issue (TypeScript check)

## 4. E2E

- [ ] E1: Sign in → navigate to /dashboard → scroll → see DailyGoalCard below OutcomeProgressStrip
- [ ] E2: Complete a practice question → refresh dashboard → answeredToday count increments
- [ ] E3: Card is visible but not intrusive — the 7-card clean layout stays recognizable

## 5. FMEA

| Failure | Effect | Severity | Mitigation |
|---|---|---|---|
| /api/daily-goal hang | Card shows loading forever | LOW | Card's own error handling; doesn't block other cards |
| Daily-goal math wrong (0 questions needed) | "Done already" state | LOW | Existing code handles |
| Server clock drift | Wrong "today" count | LOW | Not our problem; existing behavior |
| Component breaks on unit "ACCUPLACER" | Non-AP code path | LOW | Component was in production before; tested |

## 6. Release

- [ ] R1: TS clean (`tsc --noEmit`) on dashboard-view.tsx
- [ ] R2: CF Pages build succeeds
- [ ] R3: PrepLion files untouched (git diff check)
- [ ] R4: Other 7 cards still render (InviteParentCard, ResumeCard, etc.)

## 7. Post-deploy smoke

- [ ] P1: curl / → 200, /dashboard → 307
- [ ] P2: Sign in, /dashboard loads, DailyGoalCard visible
- [ ] P3: No new console errors
