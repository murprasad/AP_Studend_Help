# scripts/lib — Shared seed-script helpers

## `_question-gates.mjs` — required for all question generation

Every seed/gen script that INSERTs questions MUST go through `runDeterministicGates()` from this module before INSERT. This is non-negotiable per
`feedback_validator_must_be_deterministic.md`.

### Pattern

```js
import { runDeterministicGates, normalizeQuestion } from "./lib/_question-gates.mjs";

// ... inside your generation loop ...
for (const q of arr) {
  normalizeQuestion(q);          // mutates q in-place: correctAnswer "B) X" → "B", difficulty "Easy" → "EASY"
  q.course = COURSE;              // shared gates need course to pick option count (5 vs 4)
  const gate = runDeterministicGates(q);
  if (!gate.ok) {
    failed++;
    failReasons[gate.gate] = (failReasons[gate.gate] || 0) + 1;
    if (!firstErr) firstErr = `${gate.gate}: ${gate.reason}`;
    continue;
  }
  // safe to INSERT
}
```

### What the gates cover (do NOT re-implement inline)

| Gate | Catches |
|---|---|
| `structure` | Empty stem, missing correctAnswer, short explanation (<40 chars) |
| `options-count` | 4 vs 5 options (per-course CB-spec, including College Math/Spanish/French/German 4-opt exceptions) |
| `options-prefix-dup` | "A) A) text" double-prefix bug |
| `options-duplicate` | Unicode-normalized duplicate options (catches curly quotes, ∪/U, etc.) |
| `options-missing-prefix` | Options without A)/B) letter prefix |
| `options-partial-prefix` | Inconsistent letter prefixes |
| `options-mixed-types` | Yes/No coexisting with algebraic — CB style violation |
| `option-contains-hint` | Reasoning leaked inside option text |
| `correctAnswer-index` | correctAnswer points past end of options |
| `explanation-letter-mismatch` | Gregory's bug: "B is correct" but stored is "C" |
| `confession-phrase` | "closest match", "given the options", etc. |

### When to add NEW gates

Add to `_question-gates.mjs`, NOT to individual seed scripts. Then all scripts auto-benefit.

### Cross-product

This file is mirrored to `/c/Users/akkil/project/AP_Help/scripts/lib/_question-gates.mjs`. Keep them in sync.
