# OpenStax Ingest Plan — 2026-05-08

**Goal:** Build a copyright-clean seed bank for AP/SAT/ACT courses by ingesting OpenStax end-of-chapter questions, with proper CC BY 4.0 attribution. AI is then used only to *personalize* a seed (rephrase, swap names/numbers) — never to invent.

**Status:** Scaffolding only. No ingest run until ensemble gate (Beta 9.9, PR #11/#25) is validated in prod and the user gives the go-ahead.

## Why OpenStax (not CB / Khan)

| Source | License | Commercial republication? | Decision |
|---|---|---|---|
| OpenStax | CC BY 4.0 | ✅ with attribution | **Use as seed corpus** |
| CB AP/SAT releases | © All rights reserved | ❌ | Reference-only for generator (already in `data/official/AP/CED/`) |
| Khan Academy | mostly CC BY-NC-SA | ❌ NonCommercial blocks $9.99 product | Skip |
| Wikipedia | CC BY-SA | ⚠️ ShareAlike viral clause | Skip for primary seed |
| OpenIntro Statistics | CC BY-SA 3.0 | ⚠️ ShareAlike | Backup only |

## Book → AP/SAT/ACT Course Mapping

**Strong coverage** (OpenStax has a dedicated AP-aligned textbook):

| OpenStax Book | URL slug | Maps to | Est. EOC Qs |
|---|---|---|---|
| College Physics for AP Courses 2e | college-physics-ap-courses-2e | AP_PHYSICS_1, AP_PHYSICS_2 | ~1500 |
| Biology for AP Courses | biology-ap-courses | AP_BIOLOGY | ~1200 |
| Calculus Volume 1 | calculus-volume-1 | AP_CALCULUS_AB | ~800 |
| Calculus Volume 2 | calculus-volume-2 | AP_CALCULUS_BC | ~800 |
| Chemistry 2e | chemistry-2e | AP_CHEMISTRY | ~1000 |
| Introductory Statistics 2e | introductory-statistics-2e | AP_STATISTICS | ~600 |
| Psychology 2e | psychology-2e | AP_PSYCHOLOGY | ~700 |
| U.S. History | us-history | AP_US_HISTORY | ~400 |
| Principles of Economics 3e | principles-economics-3e | (no AP econ on platform) | — |
| American Government 4e | american-government-4e | AP_US_GOVERNMENT | ~350 |
| Environmental Science | (no OpenStax book) | AP_ENVIRONMENTAL_SCIENCE | — (use textbook alternates) |
| World History (Vol 1+2) | world-history-volume-1, -volume-2 | AP_WORLD_HISTORY | ~600 |
| College Algebra 2e | college-algebra-2e | SAT_MATH (partial — algebra) | ~500 |
| Algebra & Trigonometry 2e | algebra-trigonometry-2e | ACT_MATH (partial) | ~600 |

**Weak coverage** (OpenStax has no aligned book — fall back to ensemble-only generation):
- AP_HUMAN_GEOGRAPHY (no OpenStax book — use AAG-licensed alternates if available)
- AP_COMPUTER_SCIENCE_PRINCIPLES (CSP — code curriculum doesn't fit OpenStax format well)
- ACT_ENGLISH, ACT_READING, ACT_SCIENCE, SAT_READING_WRITING (verbal/passage-based — needs different sourcing)

## Pipeline Architecture

1. **`scripts/openstax/download-textbooks.mjs`** — fetches `https://openstax.org/details/books/{slug}` PDF for each book in the table above. Caches under `data/openstax/<slug>/textbook.pdf`.
2. **`scripts/openstax/extract-questions.mjs`** — pdf-parse + regex/heuristic. EOC sections start with "Section Quiz" / "Conceptual Questions" / "Numerical Problems" / "Critical Thinking Questions" depending on the book. Output: `data/openstax/<slug>/extracted.json` array of `{ chapter, sectionTitle, questionText, choices?, answer?, page }`.
3. **`scripts/openstax/map-to-units.mjs`** — given extracted JSON + the `COURSE_REGISTRY` for the target course, classify each question into a `unit` enum. Heuristic: chapter title fuzzy-match against unit names.
4. **`scripts/openstax/seed-from-openstax.mjs`** — writes to `Question` table with:
   - `isAiGenerated: false`
   - `source: "OpenStax"`, `sourceBook`, `sourceChapter`, `sourcePage`, `sourceLicense: "CC BY 4.0"`
   - Attribution footer required at render time: *"Adapted from OpenStax {book}, CC BY 4.0"*
5. **Personalization (later, optional)**: AI variant generator that takes a seed, swaps numbers/names, and emits N variants — each variant must still pass the ensemble gate before approval.

## Schema Changes Required

`Question` table needs new columns (nullable, additive):
```prisma
source         String?   // "OpenStax" | null (null = AI-generated)
sourceBook     String?   // "College Physics for AP Courses 2e"
sourceChapter  String?   // "Chapter 5: Newton's Laws"
sourcePage     Int?
sourceLicense  String?   // "CC BY 4.0"
sourceUrl      String?   // canonical link back to openstax.org
```

Migration: `npx prisma db push` (additive, no data loss).

## UI Changes Required

`src/components/practice/practice-card.tsx` (or equivalent) — when `question.source === "OpenStax"`, render a small attribution chip: *"Adapted from OpenStax {sourceBook}, CC BY 4.0"* with link to the source URL. Required by the CC BY license.

## Cost / Time Estimate

- Download all 14 books: ~30 min one-time (PDFs are 50-200 MB each)
- Extract with pdf-parse: ~2 hours engineer time per book to tune regex per book's EOC format
- Total ingest engineering: ~1 week for the 7 well-covered AP courses
- DB writes: cheap (one row per question)
- Ensemble validation of seeds: ~1500 questions × $0.020 = $30 to validate the OpenStax-Physics seed bank

## When to start

After Beta 9.9 ensemble PRs (#11, #25) are merged + promoted + validated in prod (≥24h with stable rejection rate). Then run download → extract → seed → ensemble-validate → flip `isApproved=true` for the ones that pass.

## Open questions

- Do we want to retire the existing 7,870 AI-generated questions once OpenStax seeds are in, or layer them?
- Per-question attribution UI: chip vs footer vs full citation page?
- Personalization variants: enable from day 1, or ship raw OpenStax seeds first and add variants in Beta 10?
