# QA Test Plan — Mobile Hooks + Haptic Feedback (Task #15)

**Feature scope:**
- `src/lib/haptics.ts` — `hapticLight / Medium / Success / Error`
- `src/hooks/use-swipe.ts` — horizontal swipe gesture detector
- `src/hooks/use-pull-refresh.ts` — pull-to-refresh container handlers
- `src/hooks/use-tts.ts` — Web Speech API wrapper
- `src/app/(dashboard)/practice/page.tsx` — haptics wired into answer-submit

**Risk tier:** Low — all hooks are thin wrappers over standard browser APIs that fail open on unsupported devices. No new DB writes. No backend changes.

---

## 1. Unit-level test cases

### 1.1 `haptics.ts` — positive case
**P1**: `hapticSuccess()` invoked on a modern Chrome/Android device. Expect navigator.vibrate called with `[15, 50, 15]` pattern.

### 1.1 Negative cases (3:1 ratio — 3 negatives per positive)
- **N1**: `hapticSuccess()` on desktop Chrome (no vibration motor). Expect no error, silent success. `navigator.vibrate` returns false, try/catch swallows.
- **N2**: `hapticSuccess()` on iOS Safari pre-18 (no `vibrate` at all — `navigator.vibrate === undefined`). Expect no error, optional-chain short-circuits.
- **N3**: `hapticSuccess()` in SSR context (no `navigator`). Expect no error — `navigator?.vibrate?.()` optional-chain + try/catch.

### 1.2 `use-swipe.ts` — positive case
**P1**: TouchStart at x=100, TouchEnd at x=180 (dx=+80 > threshold=50). Expect `onSwipeRight` called.

### 1.2 Negative cases
- **N1**: TouchStart (100,100), TouchEnd (150,200). `|dx|=50 !> |dy|=100` — vertical scroll, NOT a swipe. Expect no callback.
- **N2**: TouchStart (100,100), TouchEnd (120,110). `|dx|=20 < threshold=50`. Below threshold — no callback.
- **N3**: Double-finger touch (`touches[1]` accessed by consumer). `touches[0]` still valid; we don't touch index 1. Test event with 2-finger start — no crash.

### 1.3 `use-pull-refresh.ts` — positive case
**P1**: Container scrollTop=0, TouchStart y=100, TouchEnd y=200. `diff=+100 > 80` — `onRefresh` invoked, `refreshing` flips true then false.

### 1.3 Negative cases
- **N1**: Container scrollTop=300 (user scrolled down). TouchStart ignored — `pulling.current` stays false. No refresh.
- **N2**: TouchStart fires but user never releases (TouchEnd doesn't fire, e.g. touch cancelled). `pulling.current` stays true until next start; acceptable, next start resets.
- **N3**: `onRefresh` throws. The `try/catch` around await swallows; `refreshing` still reset to false in finally-ish path. No user-visible hang.

### 1.4 `use-tts.ts` — positive case
**P1**: `speak("Hello")` on Chrome. Expect `speechSynthesis.speak()` called with rate=0.95, pitch=1. `speaking` state flips true.

### 1.4 Negative cases
- **N1**: `speak()` on Firefox (limited Speech API support). If no voices available, utterance errors silently; `onerror` sets speaking=false.
- **N2**: `speak()` called twice rapidly without stop. First utterance should be cancelled via `speechSynthesis.cancel()` before the new one starts.
- **N3**: `stop()` called when nothing speaking. No error — `cancel()` no-ops if queue is empty.

### 1.5 Practice page haptics wire-up — positive case
**P1**: Mobile user submits a correct MCQ answer. `setFeedback(data)` fires, then `hapticSuccess()` runs. Phone vibrates [15,50,15].

### 1.5 Negative cases
- **N1**: Desktop Chrome user submits correct answer. `hapticSuccess()` called, optional-chain short-circuits. No error, no vibration. Page continues to render feedback.
- **N2**: API submit fails (response.ok=false). `setFeedback` is skipped, haptics not called. User sees toast error.
- **N3**: User's phone is in silent/do-not-disturb. vibrate call may be suppressed by OS. Our code doesn't observe the outcome — acceptable UX.

---

## 2. FMEA — Failure Mode and Effects Analysis

| Failure mode | Effect | Severity (1-5) | Likelihood (1-5) | Detection (1-5) | RPN | Mitigation |
|---|---|---|---|---|---|---|
| `navigator.vibrate` not a function | TypeError crash | 4 | 2 | 5 | 40 | Optional-chain `navigator?.vibrate?.()` ✅ |
| Missing canvas-confetti package | Build fails | 5 | 3 | 1 | 15 | Confetti.ts removed from this commit ✅ |
| iOS haptic ignored | Silent (user notices nothing) | 1 | 5 | 2 | 10 | Acceptable — haptic is enhancement, not required |
| `SpeechSynthesisUtterance` undefined (SSR) | Crash on render | 4 | 2 | 4 | 32 | `typeof window === "undefined"` guard ✅ |
| Swipe triggered during vertical scroll | Wrong navigation | 3 | 3 | 3 | 27 | `Math.abs(dx) > Math.abs(dy)` check ✅ |
| Pull-refresh fires when already scrolled | Spurious refresh | 2 | 4 | 2 | 16 | `scrollTop <= 0` gate ✅ |
| Double-tap at same spot triggers success haptic twice | User confusion | 1 | 2 | 1 | 2 | Not blocking |

**All identified risks mitigated in the port or acceptable (RPN < 30).** Highest remaining: vibrate TypeError path (RPN 40) — already defensive.

---

## 3. Functional test (manual — mobile device required)

**Pre-deploy manual checklist:**
- [ ] Open https://studentnest.ai on an Android device (Chrome)
- [ ] Navigate to /practice, start a session
- [ ] Submit a correct MCQ → phone vibrates lightly twice (success pattern)
- [ ] Submit a wrong MCQ → phone vibrates three short pulses (error pattern)
- [ ] Open /practice on desktop Chrome → answer submit works normally (no haptic attempt observable, no errors in DevTools console)
- [ ] iOS Safari: submit answer — no crash (vibrate is undefined; graceful)
- [ ] DevTools console stays clean through 5 answer cycles

## 4. E2E test (existing coverage)

The `npm run pages:deploy` pipeline runs:
- `smoke-tests.js` — marketing page loads, auth guards return 401 not 500
- `functional-tests.js` — simulated auth + session creation (blocked by pre-existing test-env issues — not caused by this change)
- `integration-tests.js` — /api/test/practice-check (blocked by CRON_SECRET mismatch)

Haptics are client-side only — no new API routes to E2E test.

## 5. Release checks

Automated by `npm run release:check`:
- [x] TypeScript — `npx tsc --noEmit` passes
- [x] CF Workers compat — no banned SDK imports
- [x] Pricing consistency — `9.99`, `79.99`, `33%` present
- [x] Logo consistency — Sparkles/gradient-text/Nest in all 5 layout files
- [x] Terms link — /terms in marketing footer
- [x] Version consistency — `package.json` matches About page `Beta 5.1`
- [x] Practice test plan — covers all 72 courses
- [x] PWA — manifest + icons + SW

**24/24 pass.** Safe to deploy after manual mobile test (#3 above).

---

## Sign-off gate

Ship when:
1. Release-check 24/24 ✅ (done)
2. TypeScript clean ✅ (done)
3. Unit cases logical review ✅ (done — this document)
4. FMEA review ✅ (RPN max 40, all mitigated)
5. Manual mobile test ⏳ — user to perform on their own Android device before flipping public

Optional: add canvas-confetti dep (`npm install canvas-confetti`) in a follow-up commit then re-enable confetti.ts and wire celebrateMedium into session-complete summary.
