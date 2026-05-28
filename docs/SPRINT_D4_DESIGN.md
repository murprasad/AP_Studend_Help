# Sprint D4 — Digital SAT adaptive mock-exam (design)

**Status:** queued, design doc only. Implementation = ~10-12 day sprint.
**Trigger:** design audit P0 #4 SN, student walkthrough audit identified
"Digital SAT mock is a linear MCQ list" — but real Bluebook moved to
adaptive 2-module format March 2024. r/SAT veterans will spot this.

---

## What "Digital SAT adaptive" means in 2024+

The College Board Bluebook app delivers each section (Reading & Writing,
Math) as **two modules**:

1. **Module 1** — 27 questions, mixed difficulty. ALL students see the
   same module.
2. **Module 2** — 27 questions. Difficulty determined by student's
   performance on Module 1:
   - High performers → harder Module 2 (more questions in the upper
     scaled-score range, fewer easy questions).
   - Low/mid performers → easier Module 2 (more questions in the
     lower-mid scaled-score range).

This is **module-adaptive**, not item-adaptive (CAT). Item order
within a module is fixed; only the routing decision adapts.

Scaling:
- Reading & Writing: 200-800
- Math: 200-800
- Total: 400-1600

---

## Current SN mock-exam shape

`src/app/(dashboard)/mock-exam/page.tsx` is a single linear array
(`questions: ExamQuestion[]`) with one section. The student does Q1,
Q2, …, Qn in order. No routing decision. No second-module branch.
The PATCH score-estimate logic doesn't know about Bluebook's adaptive
scaling.

The audit flagged it: "Charging Premium for 'Full Section' of a
defunct format is the credibility risk most likely to spawn r/SAT
complaints."

---

## Target architecture

### Data model

New tables:
```prisma
model SatModule {
  id          String   @id @default(cuid())
  section     SatSection // ENUM: READING_WRITING | MATH
  difficulty  SatDifficulty // ENUM: BASE | HARD | EASY
  questionIds String[] // ordered list of Question ids
  totalQuestions Int @default(27)
}

model SatModuleAttempt {
  id                  String   @id @default(cuid())
  practiceSessionId   String
  practiceSession     PracticeSession @relation(...)
  moduleId            String
  module              SatModule @relation(...)
  moduleNumber        Int      // 1 or 2
  correctCount        Int      @default(0)
  startedAt           DateTime @default(now())
  completedAt         DateTime?
}
```

PracticeSession gains:
- `satCurrentModuleId: String?`
- `satModule1AttemptId: String?`
- `satModule2AttemptId: String?`

### Question bank requirements

For each SAT section we need at minimum:
- 1 × Module 1 (27 questions, ~10 easy / 10 medium / 7 hard)
- 1 × Module 2 BASE (27 questions, calibrated to mid-range scaled score)
- 1 × Module 2 HARD (27 questions, calibrated to upper scaled score)
- 1 × Module 2 EASY (27 questions, calibrated to lower scaled score)

So minimum **4 modules × 2 sections = 8 modules × 27 questions = 216 calibrated questions per full SAT mock**.

For variety + retake support, ideally 3 × of each module = **~650 questions per full SAT mock**.

### Routing logic

Reducer logic (server-side, in PATCH /api/practice/[sessionId]):

```typescript
function routeToModule2(module1Result: { correctCount: number; totalQuestions: number }): SatDifficulty {
  const accuracy = module1Result.correctCount / module1Result.totalQuestions;
  // College Board's published cutoffs are not public, but consensus from
  // r/SAT analysis: ~70%+ → HARD module, ~50-70% → BASE, <50% → EASY.
  if (accuracy >= 0.70) return "HARD";
  if (accuracy >= 0.50) return "BASE";
  return "EASY";
}
```

### Scoring

After Module 2 completes, scaled-score is computed from a lookup table
that depends on BOTH which module the student took AND their raw
score in that module:

```typescript
function scaledScore(section: SatSection, mod2Difficulty: SatDifficulty, mod1Raw: number, mod2Raw: number): number {
  // Lookup table per (section, mod2Difficulty) — produces a 200-800 scaled score
  // based on total raw correct across both modules. Calibrated from CB's
  // published practice test scoring tables.
  return SCALING_TABLE[section][mod2Difficulty][mod1Raw + mod2Raw];
}
```

---

## Migration plan

### Phase 1 — schema + question seed (3 days)
1. Add `SatModule` + `SatModuleAttempt` tables via `prisma db push`.
2. Build a tagging script that classifies existing SAT questions by
   difficulty (likely uses existing `difficulty` field if reliable,
   else AI-classifies via Haiku).
3. Group questions into 27-Q modules. Manual curation pass for at
   least the 8 minimum modules.

### Phase 2 — API + routing (3 days)
1. Update POST `/api/mock-exam` to:
   - For non-SAT courses: existing linear path.
   - For SAT courses: load Module 1 + initialize SatModuleAttempt.
2. Update PATCH `/api/practice/[sessionId]` POST (submit answer):
   - On Module 1 completion: compute accuracy + route → load Module 2 +
     return updated `currentModuleId`, `moduleNumber: 2` to client.
3. PATCH (complete session): scaled-score uses lookup table.

### Phase 3 — UI (3 days)
1. New `MockExamModulePager` component handles the Module 1 → Module 2
   transition with a brief "Section break — Module 2 starting" screen.
2. Per-module timer (32 min for R&W, 35 min for Math) — replace the
   single session timer.
3. Mid-exam paywall (the existing Q5 paywall) needs reconsideration —
   for paid users, just no paywall; for free, paywall at end of
   Module 1 with "see your Module 2 routing decision + projected score"
   as upsell.

### Phase 4 — scoring + verification (1-2 days)
1. Build the lookup table from CB's published Bluebook scoring docs.
2. Verify against a known-difficulty calibration test (give a paid user a
   known set, compare app's scaled score to CB's official guide).

### Phase 5 — flag rollout (3 days)
1. New SAT mock is feature-flagged.
2. Beta with murprasad+e2e-test1 and 5 invited users.
3. Compare scaled scores vs known CB practice test results.
4. Roll out at 100%.

---

## Risks + rollback

- **Scaling table accuracy**: if our scaled-score formula is off by 50+
  points, r/SAT will roast us harder than the linear format would.
  Mitigation: triple-check against CB's published guide before rollout.
- **Question bank classification**: if our difficulty tags are wrong,
  Module 1's adaptive routing miscalibrates. Mitigation: hold a 100-Q
  calibration set + cross-check against CB-published practice tests.
- **Existing PracticeSession schema accommodation**: adding nullable
  fields is safe; existing non-SAT sessions ignore them.

---

## Estimated effort

| Phase | Days |
|---|---|
| 1 schema + seed | 3 |
| 2 API + routing | 3 |
| 3 UI | 3 |
| 4 scoring + verification | 2 |
| 5 flag rollout | 3 |
| **Total** | **~14 days** |

---

## Companion work — ACT also needs a similar audit

ACT format is still paper-and-pencil + digital-but-linear; not adaptive.
So ACT mock-exam in its current shape (linear) is actually correct for
ACT. The "wrong format" claim from the student walkthrough audit only
applies to SAT.

This refactor should be scoped narrowly to SAT_MATH + SAT_READING_WRITING
courses. ACT and PSAT stay linear.
