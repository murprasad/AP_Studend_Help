# Test Plan — Student-Report Auto-Quarantine (#62)

**Feature:** When a question accumulates 3 unique-user reports, auto-flip
`isApproved=false` so it stops serving. Direct defense against repeat
Reddit-style complaints (the 2026-04-19 AP CSP incident motivation).

**Files touched:** `src/app/api/questions/[id]/report/route.ts` on BOTH repos.

**Threshold:** `AUTO_QUARANTINE_THRESHOLD = 3`

## 1. Functional

- [ ] F1: 1st report → reportedCount = 1, isApproved stays true
- [ ] F2: 2nd report (different user) → reportedCount = 2, isApproved stays true
- [ ] F3: 3rd report (different user) → reportedCount = 3, **isApproved → false**, response includes `autoQuarantined: true`
- [ ] F4: Question stops serving on next /api/practice call (filter where isApproved=true excludes it)

## 2. Negative 3:1

- [ ] N1: Same user reports same Q twice → reportedCount stays at previous, no increment, no quarantine trigger
- [ ] N2: Report with empty reason → 400 Bad Request
- [ ] N3: Report on non-existent question ID → find returns null, no quarantine attempt
- [ ] N4: Unauthenticated report → 401
- [ ] N5: Report a question that's already isApproved=false → still records the report, no double-quarantine
- [ ] N6: Simultaneous 3 reports from 3 users (race) → reportedCount increments consistently (raw SQL atomic UPDATE), quarantine fires at least once (may fire multiple times — idempotent, update to false stays false)
- [ ] N7: Question reportedCount manually set to 100 via admin → next report triggers quarantine correctly
- [ ] N8: `console.log` fails in CF Worker env → report still succeeds
- [ ] N9: DB write fails mid-flow → upsert already recorded the report; quarantine update fails gracefully

## 3. Integration

- [ ] I1: `/api/questions/{id}/report` accepts { reason, details } POST body
- [ ] I2: Response shape: `{ success, reportId, autoQuarantined }`
- [ ] I3: After quarantine, `/api/practice?course=X` returns other Qs (one fewer in pool)
- [ ] I4: QuestionReport table populated correctly on every call

## 4. E2E (manual walkthrough)

- [ ] E1: Log in as user1, find a test question, submit report with reason "wrong_answer" → success, count=1
- [ ] E2: Log in as user2, report same question → success, count=2, not quarantined
- [ ] E3: Log in as user3, report same question → success, count=3, **response `autoQuarantined: true`**, question disappears from practice pool
- [ ] E4: Log in as user4, report same question → recorded but auto-quarantine already done; returns normally

## 5. FMEA

| Failure | Effect | Severity | Mitigation |
|---|---|---|---|
| Race on reportedCount (3 concurrent reports) | Count skips past 3 | LOW | Quarantine is idempotent; isApproved flipped to false stays false |
| Haiku sweep later re-approves an auto-quarantined Q | Good Q stuck off | LOW | Admin can manually re-approve via `/admin/questions` if false positive |
| Threshold too low (3) | Good Qs pulled by 3 brigadiers | MEDIUM | Threshold can be raised; admin can re-approve; log trail in QuestionReport |
| CF Workers log fails | auto-quarantine still works but no console trail | LOW | `console.log` is non-blocking |
| Prisma update throws in auto-quarantine block | Report saved but Q not quarantined | MEDIUM | Response still returns success; report record exists for retry |

## 6. Release checklist

- [ ] R1: TS clean on both AP_Help + PrepLion
- [ ] R2: CF build succeeds on both
- [ ] R3: Deploy both repos
- [ ] R4: Existing reports still accept (didn't break the contract)
- [ ] R5: Admin views: `/api/admin/quality-metrics` still returns data

## 7. Post-deploy smoke

- [ ] P1: `/api/questions/abc123/report` unauth → 401 (both repos)
- [ ] P2: Check Question model still queryable (`SELECT COUNT(*) FROM questions WHERE "reportedCount" > 0`)

## Rollback

`git revert <sha>` on each repo → redeploy. No schema change; fully reversible.

## Threshold tuning guidance

If quarantine rate looks too aggressive in production (false positives):
- Raise `AUTO_QUARANTINE_THRESHOLD` to 5
- OR require all 3 reports to have distinct `reason` values
- OR weight reports by user tenure (paid user reports count more)

Log grep for tuning: `grep "auto-quarantine" /var/log/...` — count per day / course.
