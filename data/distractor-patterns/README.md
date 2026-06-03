# Distractor psychology catalog

One JSON file per skill. Each file lists *named mistake categories* that CB-style distractors fall into for that skill.

**Why this exists:** generator was emitting numerically-adjacent or grammatically-odd distractors. CB distractors are tied to specific student mistakes — each wrong answer corresponds to a misconception or procedural error. To match CB rigor, every distractor must be pulled from a named category in the catalog.

**How the pipeline uses it:**

```
stage4-distractors.ts
  for each skill of the blueprint:
    open data/distractor-patterns/{skill-slug}.json
    pick 3 DIFFERENT mistake categories
    for each mistake category:
      synthesize a distractor that exhibits that mistake on this question's stimulus
  reject if 3 distinct categories were not used
```

**File naming:** `{exam}-{domain}-{skill-slug}.json` (kebab-case).

Examples:
- `sat-math-linear-eq-1var.json`
- `sat-math-slope-interpretation.json`
- `act-math-quadratic-equations.json`
- `sat-rw-craft-and-structure-purpose.json`

**Schema:**

```json
{
  "skill": "Linear functions — slope interpretation",
  "exam": "SAT_MATH",
  "domain": "ALGEBRA",
  "source": "data/official/SAT/sat-practice-test-4-digital.pdf",
  "mistakeCategories": [
    {
      "id": "slope-vs-intercept-confusion",
      "name": "Confusing slope with y-intercept",
      "description": "Student picks the y-intercept value as if it represented the rate of change.",
      "studentExample": "On a line with slope 20 and intercept 50, says 'the rate is 50'.",
      "synthesisCue": "Output a value or interpretation that uses the y-intercept where the slope is asked, or vice versa."
    },
    {
      "id": "intercept-as-slope",
      "name": "Treating the starting value as the per-unit rate",
      "description": "Student treats the value at x=0 as the slope.",
      "studentExample": "On a line starting at 50 thousand subscribers, says 'gains 50 thousand per month'.",
      "synthesisCue": "Phrase the wrong distractor as 'gained X per unit' where X is actually the intercept."
    },
    {
      "id": "slope-as-endpoint",
      "name": "Quoting an endpoint as if it were the rate",
      "description": "Student selects a point on the line and presents it as the slope.",
      "studentExample": "Picks (20, 250) and says 'after 20 months the value is 250'.",
      "synthesisCue": "Describe a specific (x, y) point rather than rate of change."
    }
  ]
}
```

**Where the catalog comes from:**
- Read official CB SAT Practice Test 1-4 (PDF in `data/official/SAT/`)
- For each released item, identify what mistake each wrong option models
- Cluster across items in the same skill → that's the catalog for that skill
- Cross-reference with Khan Academy SAT skill explanations (free, CB-endorsed)

**Initial seed:** `sat-math-slope-interpretation.json` — derived from CB Practice Test 4 question on streaming subscribers (used in `_proof-fidelity-sample.ts`).

Build out the rest by reading CB Practice Tests 1-4 and grouping released wrong-option archetypes per skill.
