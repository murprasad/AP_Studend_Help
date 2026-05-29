# Pass Probability Engine + Today's Set — PRD

**Date:** 2026-05-28
**Author:** Murali (PO) + multi-role review
**Repos:** PrepLion (primary) → StudentNest (mirror after PL validation)
**Status:** Approved /goal — implementation queued behind active PL + SN deploys

---

## 1. Vision (Product Owner)

PrepLion and StudentNest will differentiate in a crowded exam-prep market by importing the
proven medical-exam playbook (UWorld NCLEX, AMBOSS USMLE, NBME Step) into CLEP/SAT/AP/DSST/ACT:

> **The single promise:** "Tell me what to do TODAY for 15 minutes, and I'll pass."

This is the only promise that competitors don't make. Khan Academy, Magoosh, Princeton
Review, Bluebook all compete on feature breadth. UWorld and AMBOSS compete on *trusted
calibrated pass probability* — and dominate. Nobody in K-12 / college-credit prep does
this. That's the wedge.

### 1.1 Success criteria

- **Conversion lift:** Free → Pass Plan conversion rate 3-5x current baseline within 60
  days post-launch. Current baseline ≈2% on PL.
- **D7 retention:** New-user D7 returning rate ≥40% (vs Khanmigo's published ≤15%).
- **Calibration trust:** ≥80% of users whose predicted pass% was ≥75% who later took
  the real exam report passing (ground truth via passing-day survey).
- **Engagement loop:** Median session count per active user ≥3 sessions/week.
- **Word of mouth:** ≥10% of users share a pass-day artifact (cert/score card).

### 1.2 Anti-goals (what we are NOT doing)

- We will NOT compete on question bank size. Cap visible bank surface.
- We will NOT add a Socratic chatbot as a primary surface. Sage stays a *recovery*
  surface bound to wrong answers.
- We will NOT replace mock exams with adaptive simulations (Bluebook does this; not our
  wedge).
- We will NOT chase voice/oral tutoring as flagship.

### 1.3 Pass Plan user protection (CRITICAL)

Existing Pass Plan and Fast Track users MUST NOT lose functionality. Specifically:
- Full mock exam access remains.
- Full question bank access remains.
- All current routes remain navigable.
- Pass Probability + Today's Set are **additive surfaces** on the dashboard, not
  replacements. Power users can still drill specific units, choose count, etc., via the
  existing /practice page (kept behind a "More options" affordance).

---

## 2. The Loop (UX flow)

```
   ┌──→ Take a Mock OR Diagnostic                  (entry point on first visit)
   │         ↓
   │    Score → Pass Probability widget renders   (HERO on /dashboard)
   │         "You're at 73% (±6%) likely to pass.
   │          Three days at +1%/day puts you at 76%."
   │         ↓
   │    Today's Set                                (the only primary CTA)
   │         "15 mins. 12 questions. Targets your 3 weakest concepts."
   │         ↓
   │    Each Q: answer → Confidence Self-Rate     (1-5) → feedback
   │         (Brainscape's CBR pattern)
   │         ↓
   │    Wrong → bound Sage Coach inline           (recovery surface, not primary)
   │         ↓
   │    Session end: pass% delta visible          (+1.2% today → 74.2%)
   │         ↓
   │    Tomorrow's Set queued                     (push notification opt-in)
   │         ↓
   └────  Repeat. Pass probability ticks up daily. Visible.
```

---

## 3. Technical Architecture (Tech Lead)

### 3.1 Data model additions

```prisma
// Per-question concept tagging (multi-tag).
// Existing Question.unit is too coarse. Concepts let us route misses to specific
// remediation tracks.
model QuestionConcept {
  id          String  @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  conceptKey  String   // e.g. "sociology:functionalism", "algebra:quadratic_formula"
  weight      Float    @default(1.0)  // primary tag = 1.0; secondary = 0.5

  @@index([conceptKey])
  @@index([questionId])
  @@map("question_concepts")
}

// Per-question response now includes confidence rating.
// Add to existing StudentResponse model:
model StudentResponse {
  // ... existing fields ...
  confidenceSelf Int?   // 1-5 Likert (Brainscape CBR). null for legacy rows.
}

// Daily pass-probability snapshot per (user, course).
// Cheap to compute on-demand; this row exists so we can show day-over-day deltas
// and seed the Today's Set generator.
model PassProbabilitySnapshot {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          ExamCourse
  passProbability Float    // 0-1
  confidenceInterval Float  // ±X, 0-1
  sampleSize      Int       // n questions answered in window
  computedAt      DateTime @default(now())
  modelVersion    String    @default("v1.0")
  /// JSON: { topConceptsToFix: [{ concept, currentMastery, deltaIfMastered }, ...] }
  driverFactors   Json?

  @@unique([userId, course, computedAt])
  @@index([userId, course])
  @@map("pass_probability_snapshots")
}

// "Today's Set" cached plan per (user, course, day).
// Generated nightly by cron + lazy regenerate on demand if user finishes the set.
model DailyPracticePlan {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      ExamCourse
  forDate     DateTime  // YYYY-MM-DD at user's tz, stored as UTC midnight
  /// Ordered Question IDs, length 10-15
  questionIds String[]
  /// Concepts targeted by this set
  conceptKeys String[]
  /// Predicted pass% delta if completed
  expectedDeltaPct Float?
  completedAt DateTime?
  servedAt    DateTime @default(now())

  @@unique([userId, course, forDate])
  @@index([userId, forDate])
  @@map("daily_practice_plans")
}
```

### 3.2 Pass Probability formula (v1 — keep simple, calibrate later)

Start with a transparent formula. Sophisticated IRT comes later when we have
≥500 ground-truth pass/fail labels.

```
passProbability(user, course) =
    0.6 * recent_mock_score_normalized
  + 0.3 * recent_drill_accuracy_normalized
  + 0.1 * concept_coverage_normalized
  - friction_penalty       # streak gaps, abandoned sessions
```

Where:
- `recent_mock_score_normalized`: most recent ≤3 mock exam % correct, ramped against
  course-specific pass threshold (50% for CLEP, 75% for SAT, etc.)
- `recent_drill_accuracy_normalized`: last 30 drill responses, exponential decay
- `concept_coverage_normalized`: fraction of concepts where mastery ≥0.70
- `friction_penalty`: 0.02 per abandoned session in last 7d (capped at 0.10)

Confidence interval: `±(0.20 / sqrt(sampleSize / 10))`, capped at ±0.15.

When `sampleSize < 10`: don't show pass%. Show "Take diagnostic to get your number."

### 3.3 Today's Set generator

```
generateTodaysSet(user, course):
  yesterdayMisses = StudentResponse[isCorrect=false, last 24h, course].questionIds
  conceptsToFix = top 3 concepts by (driverFactor * mastery_gap_size)
  candidates = Question[
    isApproved=true,
    course=course,
    QuestionConcept.conceptKey IN conceptsToFix,
    id NOT IN questionsAnsweredInLast14Days
  ]
  set = sample(candidates, 12)
      .ordered_by(spaced_rep_priority(conceptsToFix))
  return DailyPracticePlan{questionIds: set, conceptKeys: conceptsToFix}
```

Spaced repetition uses **SM-2** with **CBR multiplier**: each card's interval is
multiplied by `(1 + (confidence_self - 3) * 0.15)`. So self-rated "very confident"
(5) extends interval 30%, "guessing" (1) shortens 30%. This is Brainscape's pattern,
adapted.

### 3.4 API surface

```
GET  /api/pass-probability?course=X        → { passProb, ci, sampleSize, drivers[] }
GET  /api/todays-set?course=X              → { plan: DailyPracticePlan, alreadyDone: bool }
POST /api/todays-set/regenerate?course=X   → forces refresh (rate-limit 1/hr per course)
POST /api/practice/[sessionId]             → existing route, accepts new `confidenceSelf` field
POST /api/journey/passday                  → user reports real exam outcome (for calibration)
```

### 3.5 Cron jobs

- `/api/cron/snapshot-pass-probability` — runs daily at 02:00 UTC, computes a
  snapshot for every active user (lastActiveDate within 30d).
- `/api/cron/generate-todays-sets` — runs daily at 03:00 UTC, builds the
  DailyPracticePlan rows for the day for active users.
- Lazy fallback in API: if no plan exists for today, generate on first GET.

### 3.6 Cloudflare Workers constraints (recap)

- All DB writes that affect post-response state MUST be `await`ed (CF terminates
  unfinished promises). Lesson learned from `beb4421`.
- Single DB ops only (no `$transaction`).

---

## 4. UI/UX (Design + PO)

### 4.1 Dashboard hero (new)

Replace existing "Practice / Mock / Flashcards / Sage" tile grid with a single
prominent Pass Probability widget on top + a single primary CTA below.

```
┌─────────────────────────────────────────────────────────┐
│  CLEP Introductory Sociology                            │
│                                                          │
│            73%   (±6%)                                  │
│        likely to pass                                   │
│                                                          │
│  ▲ +1.2% since yesterday                                │
│  3 more days like today → 76%                           │
│                                                          │
│  Driver: Functionalism (62% → drill to lift +3%)        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ► Today's Set                                           │
│     15 mins · 12 questions · 3 weakest concepts         │
│     [ Start now ]                                       │
└─────────────────────────────────────────────────────────┘

   More options →     (collapsed; reveals existing /practice picker)
```

When `sampleSize < 10`:
```
┌─────────────────────────────────────────────────────────┐
│  Take a 9-Q diagnostic to get your pass probability.    │
│  [ Start diagnostic ]                                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Confidence-Based Repetition

Inside the practice flow, after the user picks an answer but BEFORE submit feedback:

```
   How sure are you?
   ○ Guessing  ○ Maybe  ○ Pretty sure  ○ Confident  ○ Certain
```

5 buttons, single tap. Optional (skippable). Persist as `StudentResponse.confidenceSelf`.

### 4.3 Sage = recovery surface only

- Remove "Sage Live Tutor" from main sidebar slot (or demote to under "More").
- After a missed Q, show inline:
  > **"Want Sage to explain why?"**  [ Ask Sage ]
- This is the only path to Sage from the practice flow. Direct /ai-tutor URL still
  works for power users.

### 4.4 Pass-day cert (organic marketing)

On the user's first `passProbability ≥0.75` after a mock, OR on user-reported real
exam pass:
```
┌────────────────────────────────────────────────────┐
│  🦁  PrepLion                                       │
│                                                     │
│  Mia Fourreaux                                     │
│  CLEP Introductory Sociology                       │
│  Predicted score: 67 (passing = 50)                │
│  Studied 11 days · 23 practice sets                │
│                                                     │
│  preplion.ai                                       │
└────────────────────────────────────────────────────┘
        [ Share on social ]  [ Download PNG ]
```

---

## 5. Migration / Rollout (Tech Lead + EM)

### 5.1 Feature flag

```
NEXT_PUBLIC_PASS_PROB_ENGINE=true   # new dashboard UX
NEXT_PUBLIC_TODAYS_SET=true         # new daily plan CTA
NEXT_PUBLIC_CBR=true                # confidence self-rate
```

Default OFF for first deploy. Enable per repo + cohort.

### 5.2 Pass Plan user safety

- The new dashboard is ADDITIVE — old options reachable via "More options" panel.
- Pass Plan users get the SAME pass-probability widget but with a Pass-Plan
  "Mock unlimited" CTA right under Today's Set.
- No existing route is removed. Flashcards, Mock Exam, Diagnostic, Analytics, Study
  Plan, Resources, Sage all remain in the sidebar.

### 5.3 Phased rollout

| Phase | Scope | Gate |
|---|---|---|
| **P0** | Schema migration (`prisma db push` on both repos), all new tables empty | typecheck + 0 regressions |
| **P1** | Pass Probability API endpoint + snapshot cron — no UI yet | API smoke test against 5 known users; output sanity |
| **P2** | Dashboard hero widget behind flag, opt-in via query `?passprob=1` | 1 internal user sees it for 24h |
| **P3** | Today's Set generator + cron | sample 5 users; verify 12 Qs per set, no repeats from last 14d |
| **P4** | Today's Set UI on dashboard (still flag-gated) | internal sees it; manual click-through |
| **P5** | CBR widget in practice flow | unit test + manual; no impact on isCorrect logic |
| **P6** | Sage demotion from sidebar | confirm /ai-tutor still works direct |
| **P7** | Flip flags to true for 10% cohort | watch /api/cron/snapshot-pass-probability logs for errors |
| **P8** | 100% rollout | monitor conversion, D7 |
| **P9** | Mirror to SN | only after PL ships clean for 7 days |

### 5.4 Backward compatibility

- Existing `/practice/[sessionId]` API unchanged at the response level — only an
  optional `confidenceSelf` field is accepted.
- Legacy `StudentResponse` rows (no `confidenceSelf`) are treated as "Pretty sure"
  (3) for SM-2 multiplier.

---

## 6. QA Strategy (QA Lead)

### 6.1 Test coverage matrix

| Surface | Unit | Integration | E2E (Playwright) |
|---|---|---|---|
| Pass-prob formula | ✅ 12+ scenarios | — | — |
| Snapshot cron | ✅ idempotency | ✅ run-twice = same row | — |
| Today's Set generator | ✅ 10+ inputs | ✅ no recent dupes | — |
| /api/pass-probability | — | ✅ auth + 3 plans | — |
| /api/todays-set | — | ✅ lazy generate | — |
| CBR widget | ✅ render + submit | — | ✅ rate → next Q |
| Dashboard hero | — | — | ✅ widget visible, delta correct |
| Pass Plan compatibility | — | ✅ /mock-exam still 200 | ✅ Pass Plan user sees new + old |

### 6.2 Edge cases to cover

- New user (0 responses): widget says "Take diagnostic."
- User with only 1 mock attempt + 0 drills: confidence interval ±0.15.
- Course switch: pass% snapshots are per-course (no cross-contamination).
- Today's Set when user has answered all approved Qs in their weak concepts:
  fall back to oldest mistakes from any concept.
- DST / timezone: forDate uses UTC midnight; users in PT see "today's set" refresh
  at 5pm local. Acceptable for v1; future improvement.
- CBR skipped: confidenceSelf stays null; SM-2 uses default multiplier 1.0.

### 6.3 Regression sweeps

- Run existing PL integration suite (37 tests) — must remain 37/37 green.
- Run existing SN broader test suite — must remain green.
- Run `tests/student-walkthroughs-2026-05-28.spec.ts` — 3 scenarios must pass.
- New: `tests/pass-probability.spec.ts` — 5 scenarios for the hero widget.
- New: `tests/todays-set.spec.ts` — 3 scenarios for the daily plan.

### 6.4 Pass Plan user verification

Manual E2E:
- Log in as `murprasad+pass2@gmail.com`.
- /dashboard: see Pass Probability widget + Today's Set + ALL existing sidebar items.
- /mock-exam: starts, returns 88-Q session, completes.
- /flashcards: existing route works.
- /ai-tutor: still accessible direct.
- /practice (no quickstart): existing picker reachable from "More options."

---

## 7. Data calibration plan (Data Lead)

### 7.1 Ground truth collection

Add to journey + post-exam survey:
```
POST /api/journey/passday
  { course, examDate, scaledScore?, passed: boolean }
```

Email cron 30 days post-trial-end + 7 days post-stated-exam-date asks users:
> "Did you take your exam? How did you score?"

Store in `ExamResult` table:
```prisma
model ExamResult {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  course       ExamCourse
  examDate     DateTime
  scaledScore  Int?
  passed       Boolean
  reportedAt   DateTime @default(now())

  @@index([userId, course])
}
```

### 7.2 Calibration retrospective

Monthly cron compares snapshot prediction at `examDate - 7d` vs `passed`:
- Bucket users into deciles by predicted pass%.
- Compute Brier score per decile.
- If decile bucket 70-80% has actual pass rate <50% or >95%, recalibrate weights.

We'll have enough ground truth (~30 users) within 90 days of launch.

### 7.3 V2: Item Response Theory

Once we have ≥500 labeled responses per concept, switch the formula's third term
to IRT-derived theta. Out of scope for v1.

---

## 8. Pricing + business (PO)

### 8.1 Conversion levers (built into the UX)

- **Free user, pass% ≥70%:** "You're on track. Lock it in with Pass Plan to keep
  going past your trial."
- **Free user, pass% <50%:** "Pass Plan unlocks the full path to your number."
- **Pass Plan user, pass% ≥75%:** "Ready to book your exam? Here's your cert."

### 8.2 Pass Guarantee tightening

Current: "If you don't pass, refund."
New: "If your predicted pass% is ≥75% the week you take the exam AND you don't
pass, refund." Adds calibration trust, lowers our risk.

### 8.3 No price change v1

---

## 9. Implementation sequencing (EM)

```
Day  Task                                                       Owner    Gate
─────────────────────────────────────────────────────────────────────────────
1    Schema migration + db push (PL+SN)                         Eng      typecheck green
1    Pass-prob formula module (lib/pass-probability.ts)         Eng      12 unit tests
2    /api/pass-probability endpoint                             Eng      integration test
2    snapshot cron + admin trigger                              Eng      manual fire
3    DailyPracticePlan schema + generator module                Eng      12 unit tests
3    /api/todays-set endpoint                                   Eng      integration test
4    Dashboard hero widget (flag off)                           Eng      visual check
4    Today's Set CTA (flag off)                                 Eng      visual check
5    CBR widget in practice page                                Eng      e2e
5    Sage demotion from sidebar                                 Eng      e2e
6    Internal flag flip — 1 user                                EM       24h obs
7    10% cohort flag flip                                       EM       48h obs
9    100% PL flag flip                                          EM       7d obs
16   Mirror to SN                                               Eng      same sequence
23   100% SN flag flip                                          EM       —
30   Cert + share feature                                       Eng      e2e
60   Calibration retrospective + v2 formula tune                Data     —
```

Total: ~3 weeks PL, +1 week SN, +1 week certs.

---

## 10. Risks (all roles)

| Risk | Mitigation |
|---|---|
| Pass probability looks wrong to users | Show CI; cap at "calculating" for <10 responses |
| Schema migration on prod Neon DB | Additive only; rollback by dropping tables |
| Pass Plan user complaints about new UX | Add "Use classic view" link for first 30d |
| Today's Set runs out of questions | Fall back to older mistakes + AI generate if course is thin |
| Sage removal angers existing users | Keep `/ai-tutor` reachable from header user-menu |
| Cron failures = stale snapshots | Lazy fallback on GET regenerates |
| Calibration is wildly off at launch | Predictor labeled "BETA"; survey on every exam result |

---

## 11. Open questions for PO

1. CLEP and DSST courses — same UI? (assumed yes)
2. SAT — Pass Probability shown as "Likely to score 1200+" or numerical score? (TBD)
3. Pass-day cert: enable share-on-X (Twitter) by default or opt-in? (assumed opt-in)
4. Mobile PWA: pass% widget on lockscreen? (out of scope v1)

---

## Appendix A — Research sources (Secret Sauce)

- Khanmigo 15% usage / 2026 redesign: https://www.kidsaitools.com/en/articles/khanmigo-review-2026
- Dan Meyer Khanmigo critique: https://danmeyer.substack.com/p/khanmigo-doesnt-love-kids
- UWorld pass probability: https://nursing.uworld.com/nclex/self-assessment/
- AMBOSS USMLE predictor: https://www.amboss.com/us/usmle/score-predictor
- Bluebook practice vs real: https://www.thetestadvantage.com/public/blog-details/255
- Brainscape CBR: https://notetube.ai/blog/best-spaced-repetition-apps
- Duolingo retention (47%→28% churn): https://www.trypropel.ai/resources/duolingo-customer-retention-strategy

---

## Appendix B — Decision log

- 2026-05-28: PRD approved by user. Implementation queued behind PL deploy `bc07jb2tj`
  and SN deploy `bhdq1jq0f`. /goal active.
- Phase ordering: PL first (smaller, more controlled), then SN mirror.
- v1 formula stays transparent. IRT deferred to v2 when ground truth exists.
- Sage demotion is a hard call; mitigated by keeping /ai-tutor reachable via direct URL.
