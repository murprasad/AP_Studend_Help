# Test Plan — NextSessionNudge (Post-Session Incomplete-Loop Nudge)

**Feature:** Post-session summary card that surfaces the weakest unit +
active streak as a reason to return tomorrow. Retention-engineered around
incomplete-loop psychology. StudentNest only (for now).

**Files touched:**
- `src/components/practice/next-session-nudge.tsx` (new)
- `src/app/(dashboard)/practice/page.tsx` (insert + import)

**Deploys affected:** StudentNest only. PrepLion untouched.

---

## 1. Functional tests (positive paths)

- [ ] F1: Authenticated student finishes a practice session → summary
      screen renders → card appears below SessionDeltaCard
- [ ] F2: Card shows weakest-unit name (from /api/coach-plan response)
- [ ] F3: Card shows missRatePct as an integer (not NaN, not decimal)
- [ ] F4: Card shows streak days when `streakDays > 0`
- [ ] F5: "Preview tomorrow's session" link has valid `/practice?mode=focused&unit=X&course=Y`

## 2. Negative / edge tests (3× ratio per feedback policy)

- [ ] N1: `/api/coach-plan` returns `weakestUnit: null` → card renders NULL
- [ ] N2: `/api/coach-plan` returns 401 → card renders NULL (silent fail)
- [ ] N3: `/api/coach-plan` returns 500 → card renders NULL (silent fail)
- [ ] N4: `/api/user` returns 401 → streak defaults to 0, card still renders if weakestUnit exists
- [ ] N5: `/api/user` returns 500 → streak defaults to 0
- [ ] N6: Network timeout on `/api/coach-plan` → no crash, card stays hidden
- [ ] N7: streakDays === 0 → orange streak banner HIDDEN, card still renders
- [ ] N8: `missRatePct` is 0 → card still renders (extreme edge but legal)
- [ ] N9: `unitName` is empty string → card renders but text may be awkward — verify no crash
- [ ] N10: `course` prop is empty string → URL encoding handles it, link still safe
- [ ] N11: Component unmounts mid-fetch → no setState-on-unmounted warning
- [ ] N12: Multiple quick re-renders of parent → Promise.all doesn't double-apply state

## 3. Integration tests

- [ ] I1: `/api/coach-plan?course=AP_WORLD_HISTORY` returns a populated
      weakestUnit object for an authenticated user with practice history
- [ ] I2: `/api/user` returns streakDays in `user.streakDays`
- [ ] I3: Link `/practice?mode=focused&unit=X&course=Y` resolves to
      the practice page without 404
- [ ] I4: Component still works when `coach-plan` and `user` race
      (either can resolve first)

## 4. E2E (real browser as a user)

- [ ] E1: Sign in → start practice → complete → scroll to summary →
      see NextSessionNudge between SessionDeltaCard and stats card
- [ ] E2: Click "Preview tomorrow's session" → lands on practice with
      focused unit pre-selected
- [ ] E3: Log out and back in on a fresh account → no practice history
      → card is null (gracefully hidden)
- [ ] E4: Kill network mid-summary-load → card hides, rest of summary
      still renders

## 5. FMEA — Failure Mode & Effects

| Failure | Effect | Severity | Mitigation |
|---|---|---|---|
| /api/coach-plan hang (>10s) | Card never renders, user waits | LOW (doesn't block summary) | No timeout added; card just stays null. Summary renders around it. |
| Malformed JSON from /api/coach-plan | setState throws | MEDIUM | `.catch(() => setLoaded(true))` swallows; card hides. |
| Prisma Neon hiccup during /api/user | streakDays 0, card still renders weakest unit | LOW | Card already degrades gracefully. |
| weakestUnit has special chars | URL encoding fails | LOW | `encodeURIComponent(weakestUnit.unit)` handles. |
| Large streak number (999+) | UI layout break | LOW | Number renders inline; no truncation needed. |
| `streakDays` negative (data bug) | "-5-day streak" renders | LOW | Already guarded by `streakDays > 0` check. |
| Component mounted on PrepLion page | Card fetches StudentNest endpoints | N/A | Not imported on PrepLion; import check. |

## 6. Release checklist

- [ ] R1: TypeScript compiles (`npx tsc --noEmit`) → 0 errors on touched files
- [ ] R2: `opennextjs-cloudflare build` succeeds
- [ ] R3: PrepLion codebase untouched (no accidental leak)
- [ ] R4: Existing SessionSummary rendering still works with card null
- [ ] R5: No new required props on NextSessionNudge without default
- [ ] R6: Git diff review → only expected files modified
- [ ] R7: StudentNest Sage Coach still loads (no chain-break from imports)
- [ ] R8: StudentNest dashboard still loads (PrimaryActionStrip + friends intact)

## 7. Post-deploy smoke test (tomorrow)

- [ ] P1: `curl https://studentnest.ai/` → 200
- [ ] P2: Sign in, complete practice session, observe card renders
- [ ] P3: Check Network tab: `/api/coach-plan` + `/api/user` both fire
- [ ] P4: Zero new JS errors in Console

## Rollback

If broken: `git revert <commit-sha>` → `npm run pages:build` → `wrangler pages deploy`.
No schema changes; no DB migrations needed. Fully reversible.
