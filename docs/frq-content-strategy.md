# FRQ Content Strategy

Source strategy + volume mix + variant pipeline plan for the FRQ ingestion sprint.
Per user's 2026-04-25 directive — ship CB ingestion first, then variant generation,
then external sources only if needed.

## Volume mix target

| Tier | % of total | Source | Purpose |
|---|---|---|---|
| **Core** | 60% | College Board past releases (10-20 yrs/subject) | Authentic exam alignment |
| **Open structured** | 20% | OpenStax, CK-12, state exams (NYSED Regents, TX TEA) | Foundation → AP ramp |
| **Generated variants** | 20% | AI-generated from CB seeds | Targeted drilling, our differentiator |

## Sprint phases (sequenced, not parallel)

### Phase 1: CB extraction (in flight)
- ✅ 8 courses × ~4 years × ~6 FRQs ≈ 200 FRQs after extraction
- ✅ Includes rubrics + sample student responses (the real value)
- 🟡 Extraction script ready, smoke testing on AP Biology
- ⬜ Validation pass (rubric points sum, prompt non-empty)
- ⬜ DB seed to FreeResponseQuestion table

### Phase 2: Variant generation (NEXT — high leverage)
**Strategic insight from user:** "Turn 1 FRQ into 5-10 assets."

For each Phase-1 CB FRQ, generate:
1. Original (as-is from CB)
2. Easier scaffolded version (more guidance, broken-up parts)
3. Harder "twist" (additional stipulation, less hand-holding)
4. Unit-isolated subparts (extract part (a) as its own short-FRQ)
5. MCQ conversion (turn a calculation FRQ into an MCQ with worked options)
6. Common wrong-answer drill (focus on the trap a student typically falls into)
7. Rubric-based feedback template (for the scoring engine)

Tag each variant with `parent_frq_id` so we know provenance.
Tag with `difficulty_offset` so adaptive engine can serve in order.

**Net outcome:** 200 CB FRQs × 5 variants = 1000 high-quality FRQs.

### Phase 3: External structured sources (only if Phase 2 isn't enough)
**Tier 1 expansion (free, well-licensed):**
- OpenStax — end-of-chapter free response (strong for Physics/Bio/Calc)
- CK-12 FlexBooks — constructed-response questions
- NYSED Regents-style — Bio/Chem/Physics
- Texas TEA STAAR released items — early units

**Tier 2 expansion (international, format-adjacent):**
- Cambridge AICE
- IB exam past papers
- Use ONLY for "explain/justify/analyze" skill development

**Tier 3 (university outreach):**
- UC Scout
- Georgia Virtual School

### What to AVOID (per user)
- Random teacher worksheets (uncurated)
- Olympiad problems (wrong difficulty/format)
- Generic textbook FRQs (style mismatch)

## What we extract per FRQ (per user's CED-mapping insight)

```typescript
{
  // Identity
  course: ApCourse,
  unit: ApUnit | null,
  year: number,
  questionNumber: number,
  type: "FRQ" | "SAQ" | "LEQ" | "DBQ",

  // Content
  promptText: string,
  stimulus: string | null,
  parts: { letter: "a" | "b" | "c", text: string, points: number }[], // ← future

  // Scoring (THE real value per user)
  totalPoints: number,
  rubric: { step: string, points: number, keywords: string[], note: string }[],
  sampleResponse: string | null,

  // Pedagogy (per CED)
  skill: "Argue" | "Calculate" | "Justify" | "Design experiment" | "Interpret data" | "Apply concepts" | "Analyze sources" | "Construct argument",

  // Provenance
  source: "college_board_released" | "openstax" | "ck12" | "ai_variant",
  sourceUrl: string,
  parentFrqId: string | null, // for variants — points back to CB original
  variantType: "original" | "scaffold_easier" | "twist_harder" | "subpart" | "mcq_conversion" | null,
  difficultyOffset: -2 | -1 | 0 | 1 | 2 | null, // relative to parent
}
```

## Anti-pattern (per user)

> "More targeted FRQs, not more total FRQs."

If we just bulk-add 1000 random FRQs, students get overwhelmed + difficulty
becomes inconsistent + score gains weaken. The variant pipeline + skill
tagging is what makes this targetable.

## ⚖️ Legal + strategic guidance (locked 2026-04-25)

**The trap:** "Released materials = safe to redistribute" is partially true but incomplete.

**Generally safe:**
- Linking to official PDFs (CB-hosted)
- Using questions for instructional use
- Quoting portions with attribution
- Storing metadata + extracted structure + transformed versions

**Risky / avoid:**
- Re-hosting full PDFs at scale
- Packaging the entire archive as our own dataset
- Removing branding / attribution
- Monetizing direct copies without transformation

**apfrqs.com role:** discovery INDEX only — not a data source.
- ✅ Use it to find older years (2002–2018) that CB no longer indexes
- ✅ Use it to locate "removed" or hard-to-find exams
- ✅ Use it to identify gaps in our current coverage
- ❌ Do NOT scrape and re-host its PDFs
- ❌ Do NOT package its archive as our dataset
- → After discovery, pull from official CB URLs when available; if a PDF only exists on apfrqs.com, store extracted structured data + attribute back to original CB year/exam, never the raw PDF

## Why this matters more than just adding 100 FRQs

A library of 100 FRQs is just storage. The actual learning value comes from STRUCTURE.

**Step 2 (extract, not store):** Per FRQ, capture:
- Parts (a, b, c, d…)
- Atomic skill tags (per CED: "Hardy-Weinberg calculation", "Experimental design critique", not "FRQ #3 2011")
- Unit (mapped to current curriculum, not original-year unit)
- Rubric points (atomic + aligned to current scoring guidelines)

**Step 3 (transform):**
- Slight rewrite — same concept, fresh context
- Generate variants (easier scaffold + harder twist)
- Add data-interpretation layers to pre-2020 questions (which lack stimulus-based design)
- Modernize question framing where curriculum has shifted

**Step 4 (attribute):**
- Every FRQ has `source: "college_board_released"` + `sourceUrl: <original-CB-URL>` + `originalYear`
- UI shows "Source: College Board, AP Biology 2008 Exam"
- Link back to the original where it still exists

## Pipeline state today (2026-04-25)

```
[ Stage 1: Download ]   ✅ 47/62 PDFs (8 courses), 5 MB total
[ Stage 2: Extract ]    🛑 BLOCKED — GOOGLE_AI_API_KEY in .env returns API_KEY_INVALID
[ Stage 3: Validate ]   ⬜ Not built yet
[ Stage 4: Seed DB ]    ⬜ Not built yet
[ Stage 5: Variants ]   ⬜ Phase 2 work
[ Stage 6: External ]   ⬜ Phase 3 work
```

## ⚠️ User action needed to unblock Stage 2

The Gemini API key in `.env` returns `API_KEY_INVALID` from Google's
ListModels endpoint. This is a key-rotation / expiry issue on the Google
Cloud side, not a code issue. Until refreshed, no PDF extraction can run.

**To unblock:**
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key OR check if the existing one was deleted/disabled
3. Update `GOOGLE_AI_API_KEY` in:
   - Local `.env` (line 26 or wherever)
   - Cloudflare Pages secrets (production)
4. Re-run: `node scripts/frq-ingestion/02-extract.mjs`

**Fallback option:** Use Anthropic Claude (has PDF support via files API) —
~$15-20 one-time cost for the full extraction. Code change ~30 lines.
Would need user approval given billing impact.

Until either path resolves, the 47 downloaded PDFs sit in
`data/cb-frqs/{course}/` ready for extraction. Stage 1 work is preserved.
