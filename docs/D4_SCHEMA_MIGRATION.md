# D4 Phase 1 — Schema migration (draft, not yet applied)

**Status:** ready to apply. Run `npx prisma db push` after pasting the
blocks below into `prisma/schema.prisma`. The schema additions are
**additive only** — existing PracticeSession rows are unaffected, and
the new fields default to null.

This is Phase 1 of D4 (Digital SAT adaptive mock-exam). The full plan
is in `docs/SPRINT_D4_DESIGN.md`.

---

## What to add to `prisma/schema.prisma`

### 1. Enums

```prisma
enum SatSection {
  READING_WRITING
  MATH
}

enum SatModuleDifficulty {
  BASE   // Module 1 (all students) and the mid-route Module 2
  HARD   // Module 2 served to high performers (≥70% on Module 1)
  EASY   // Module 2 served to lower performers (<50% on Module 1)
}
```

### 2. `SatModule` — pre-built 27-question modules

```prisma
model SatModule {
  id             String              @id @default(cuid())
  section        SatSection
  difficulty     SatModuleDifficulty
  /// Ordered list of Question.ids (length 27).
  questionIds    String[]
  totalQuestions Int                 @default(27)
  /// Human-readable label for admin/debugging (e.g. "Math Mod 1 #3").
  label          String?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  attempts       SatModuleAttempt[]

  @@index([section, difficulty])
  @@map("sat_modules")
}
```

### 3. `SatModuleAttempt` — one row per module the student answered

```prisma
model SatModuleAttempt {
  id                  String          @id @default(cuid())
  practiceSessionId   String
  practiceSession     PracticeSession @relation(fields: [practiceSessionId], references: [id], onDelete: Cascade)
  satModuleId         String
  satModule           SatModule       @relation(fields: [satModuleId], references: [id])
  /// 1 or 2.
  moduleNumber        Int
  correctCount        Int             @default(0)
  /// Total raw score in this module — used by the scaling table.
  rawScore            Int             @default(0)
  startedAt           DateTime        @default(now())
  completedAt         DateTime?

  @@index([practiceSessionId])
  @@index([satModuleId])
  @@map("sat_module_attempts")
}
```

### 4. PracticeSession additions

```prisma
model PracticeSession {
  // ... existing fields ...
  satCurrentModuleId   String?
  satModule1AttemptId  String?
  satModule2AttemptId  String?
  /// Computed routing decision: BASE | HARD | EASY (null for non-SAT or pre-Module-2).
  satModule2Route      SatModuleDifficulty?
  /// Final scaled score (200-800) computed at session-complete.
  satScaledScore       Int?
  /// Add the back-relations for the module attempts.
  satModuleAttempts    SatModuleAttempt[]
}
```

---

## Apply

```bash
cd C:\Users\akkil\project\AP_Help
npx prisma db push
```

This will create the two new tables + add the four new columns to
`practice_sessions`. No data loss; existing rows get NULL in the new
columns. Run during a quiet window — Neon's HTTP transport doesn't
need migrations to be timed, but pages routing during the push might
briefly see "Schema is being updated" errors. Push takes ~3s.

---

## After this Phase 1 lands

The next pieces of D4 (per `SPRINT_D4_DESIGN.md`) are:

**Phase 2 — Routing logic in `POST /api/practice/[sessionId]`** (~3 days)
- On Module 1 completion: compute `correctCount / 27` and route → BASE / HARD / EASY.
- Load + persist the Module 2 row + return `satCurrentModuleId` in the API response.

**Phase 3 — UI** (~3 days)
- New `MockExamModulePager` component to handle Module 1 → 2 transition with a brief "Section break" screen.
- Replace the single-section timer with per-module timers (32 min R&W, 35 min Math).

**Phase 4 — Scoring + verification** (~2 days)
- Build `SCALING_TABLE[section][mod2Difficulty][rawTotal] → scaledScore` from CB's published Bluebook practice test scoring docs.
- Verify against ≥3 known practice tests with reference scores.

**Phase 5 — Flag rollout** (~3 days)
- Feature-flag the new SAT mock. Beta with murprasad+e2e-test1 and 5 invited users. Roll to 100% after 1 week clean.

---

## Question bank prerequisites

D4 cannot ship without ~8 calibrated 27-Q modules per section × 2 sections = **216 minimum SAT questions** with reliable difficulty tags. The current SAT pools need an audit:

```sql
-- How many SAT questions do we have, tagged by difficulty?
SELECT course, difficulty, COUNT(*) FROM questions
WHERE course IN ('SAT_MATH', 'SAT_READING_WRITING')
  AND "isApproved" = true
GROUP BY course, difficulty
ORDER BY course, difficulty;
```

If counts are below 27 of any (course, difficulty) combination, run the existing AI generation pipeline to backfill before starting Phase 2.

---

## Rollback

The migration is additive. To roll back:

```prisma
// Remove sat* fields from PracticeSession
// Drop SatModule + SatModuleAttempt models
```

Then `npx prisma db push --accept-data-loss` (only needed because dropping the tables removes their rows). The four new columns on `practice_sessions` would be dropped with default = NULL so no risk to existing rows.
