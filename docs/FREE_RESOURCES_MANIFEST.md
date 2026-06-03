# Free Resources Manifest — SAT / ACT Fidelity Pipeline

Inventory of free, license-clean sources we can mine for CB-fidelity question generation. Cross-references `docs/FIDELITY_ARCHITECTURE.md` Phase 5.

**Hard rule:** never copy CB or ACT proprietary questions. Use ONLY public-domain or CC-licensed content. Always render attribution at point-of-use when license requires.

---

## Tier 1 — Official format references (we DO NOT copy questions, we mimic FORMAT only)

These are CB/ACT's own public documents. They are copyrighted, but format/convention is not copyrightable in US law.

| Source | URL | What we use | What we DON'T |
|---|---|---|---|
| **CB Digital SAT Practice Tests 1–4** | satsuite.collegeboard.org/sat/practice-preparation/practice-tests | Question shape, stimulus density per topic, distractor patterns, explanation style. PDFs already in `data/official/SAT/`. | Verbatim text |
| **CB Bluebook app** | bluebook.app.collegeboard.org | Live UI/UX reference for screenshot-diff gate. Visit, screenshot, mimic. | App code, content |
| **CB Assessment Framework for Digital SAT** | satsuite.collegeboard.org (PDF) | Domain weights, skill taxonomy, item specs. PDF in `data/official/SAT/`. | Items |
| **ACT Free Practice Tests** | act.org/content/act/en/products-and-services/the-act/test-preparation | Question shape, time pressure, distractor patterns, ACT Science data presentation. | Items |
| **PSAT/NMSQT Sample Items** | satsuite.collegeboard.org/psat-nmsqt | Format reference for PSAT_MATH and PSAT_RW. | Items |

---

## Tier 2 — Public domain content (USE FREELY, attribute when prudent)

### US federal government works (17 USC §105 — public domain)

| Source | URL | Use for |
|---|---|---|
| **NASA** | nasa.gov, climate.nasa.gov, data.nasa.gov | SAT_R&W science passages; ACT_Science data displays; SAT_PSDA word problems |
| **NOAA** | noaa.gov, climate.gov, ncei.noaa.gov | Climate data tables; weather scatter plots; ACT_Science |
| **USGS** | usgs.gov, data.usgs.gov | Earth science passages; ACT_Science data; SAT_MATH stat problems |
| **BLS (Bureau of Labor Statistics)** | bls.gov | Real economic data for SAT_MATH word problems |
| **Census** | census.gov, data.census.gov | Demographic data for SAT_PSDA + ACT_MATH |
| **NCES** | nces.ed.gov | Education statistics for word problems |
| **CDC WONDER** | wonder.cdc.gov | Public health data for SAT_PSDA + ACT_Science |
| **FRED (St. Louis Fed)** | fred.stlouisfed.org | Economic indicators time-series |
| **NHTSA** | nhtsa.gov | Transportation data for word problems |
| **EPA AirNow** | airnow.gov, aqs.epa.gov | Environmental data for ACT_Science |
| **Federal Reserve Bank publications** | federalreserve.gov | Economic narratives for SAT_R&W |
| **CIA World Factbook** | cia.gov/the-world-factbook | Country statistics for word problems |

### Project Gutenberg (public domain)

| Use case | Detail |
|---|---|
| SAT_R&W literary passages | Pre-1928 novels and stories; trim to 50–150 word passages |
| ACT_Reading prose fiction | Same source, longer passages permitted (ACT uses 700-word passages) |
| ACT_Reading humanities | Pre-1928 essays |

URL: gutenberg.org/ebooks/

### Open Government Data (data.gov, data.govt.nz, data.gov.uk)

| Source | Use for |
|---|---|
| data.gov | US datasets across every domain |
| data.gov.uk | Same for UK (some CC BY 4.0) |
| World Bank Open Data | Global development indicators (CC BY 4.0) |

### Wikipedia & Wikimedia Commons

License: CC BY-SA 4.0 (must attribute, must license derivatives same way)

| Use case | Detail |
|---|---|
| SAT_R&W informational passages | Trim Wikipedia articles to 50–150 words on a topic |
| ACT_Reading social science / humanities | Trim Wikipedia articles to longer passages |
| Wikimedia Commons images | Many CC-licensed scientific diagrams (verify per-image) |

---

## Tier 3 — Creative Commons content

### OpenStax (CC BY 4.0)

Anchor for SAT_MATH + ACT_MATH content modeling. Free with attribution.

| Textbook | Topics it covers | SAT/ACT mapping |
|---|---|---|
| Algebra and Trigonometry | Linear/quad/poly/exp/log functions, systems, sequences | SAT_MATH Algebra + Advanced Math; ACT_MATH |
| College Algebra | Functions, exponents, polynomials | Same |
| Intermediate Algebra | Linear/quad equations, factoring | SAT_MATH Algebra; ACT_MATH |
| Prealgebra 2e | Ratios, percentages, basic geometry | SAT_PSDA; ACT_MATH |
| Introductory Statistics | Probability, sampling, inference | SAT_PSDA; ACT_Science data |
| College Physics | Mechanics, energy, waves | Real-data sources for word problems |
| Biology 2e, Chemistry 2e | Domain knowledge | ACT_Science context background |
| Microbiology, Anatomy | Domain knowledge | ACT_Science |
| Principles of Macro/Microeconomics | Supply/demand graphs, real data | SAT_PSDA word problems |

URLs: openstax.org/subjects

**How we use:** lift exercise STEMS (re-phrase), copy real-data tables (with attribution), use chapter walkthroughs as topic difficulty reference.

### Our World in Data (CC BY 4.0)

Curated datasets + interactive charts across every imaginable topic.

URL: ourworldindata.org

| Use case | Detail |
|---|---|
| SAT_PSDA stimuli | Real-world data tables + scatter plots |
| ACT_Science | Climate, energy, health time-series data |
| SAT_R&W informational passages | Article snippets paired with their data |

### OER Commons (mixed CC)

URL: oercommons.org

Curate SAT/ACT prep packs published under CC. Verify license per-resource.

### Khan Academy (free, CB-endorsed SAT prep partner)

URL: khanacademy.org/sat, khanacademy.org/test-prep

**License nuance:** Khan content is "free to use" but not all CC-licensed; specifically the SAT prep partnership content is CB+Khan jointly produced. Use as:
- Difficulty/topic reference (reverse-engineer their skill matrix)
- Style reference for explanation depth
- Their question stems → DO NOT copy

### PhET Interactive Simulations (CC BY 4.0)

URL: phet.colorado.edu

Use as:
- Visual style reference for science stimuli
- Data sources (run a simulation, capture data, build a question)

### CommonLit (free for educators; per-passage license varies)

URL: commonlit.org

Reading passages with comprehension Qs. Verify per-passage license before use; many are CC BY-NC-SA.

---

## Tier 4 — Competitor references (READ-ONLY; never copy content)

We do NOT copy competitor content. We use them to calibrate format/rigor/UX.

| Competitor | Free access | What to learn |
|---|---|---|
| **Bluebook (CB official app)** | Free download | THE primary UI/UX reference for SAT |
| **Khan Academy SAT** | Free | Difficulty calibration, skill taxonomy alignment |
| **UWorld SAT Prep** | Free sample Qs on signup | Distractor quality, explanation depth |
| **Magoosh SAT/ACT** | Free trial + sample | Video explanation style; per-Q rubric format |
| **Princeton Review** | Free practice test with account | "Process of elimination" framing |
| **Kaplan SAT/ACT** | Free diagnostic | Topic-by-topic study plan UX |
| **PrepScholar** | Free blog + sample Qs | Difficulty writeups |
| **1600.io** | Free YouTube channel | SAT-specific explanation methodology |
| **Mr. D Math** | Free YouTube | ACT-specific math approaches |

---

## How resources flow into the fidelity pipeline

```
                ┌─────────────────────────────────────────────────┐
                │  Federal data (NASA/NOAA/USGS/BLS/Census)       │
                │  CC content (OpenStax/OWiD/Wikipedia)           │
                │  Public domain text (Project Gutenberg)         │
                └────────────────────┬────────────────────────────┘
                                     ▼
                          ┌──────────────────────┐
                          │ Ingestion scripts    │
                          │ scripts/ingest-*.mjs │
                          └──────────┬───────────┘
                                     ▼
                ┌────────────────────┴───────────────────┐
                ▼                                        ▼
   ┌──────────────────────────┐         ┌────────────────────────────┐
   │ data/stimulus-corpus/    │         │ data/passage-corpus/       │
   │   - charts/              │         │   - literary/              │
   │   - tables/              │         │   - informational/         │
   │   - geometric/           │         │   - science/               │
   │   (structured JSON for   │         │   (text + attribution)     │
   │    SVG library)          │         │                            │
   └──────────────┬───────────┘         └─────────────────┬──────────┘
                  │                                       │
                  ▼                                       ▼
        ┌──────────────────┐                  ┌──────────────────┐
        │ stage2-stimulus  │                  │ stage2-stimulus  │
        │   .ts (math)     │                  │   .ts (R&W)      │
        └────────┬─────────┘                  └────────┬─────────┘
                 │                                     │
                 └─────────────────┬───────────────────┘
                                   ▼
                  ┌────────────────────────────────┐
                  │ stage3-question.ts             │
                  │ (Claude Sonnet 4.5 / GPT-4o)   │
                  │ writes Q grounded on stimulus  │
                  └────────────────┬───────────────┘
                                   ▼
                          (rest of pipeline)
```

---

## Per-source ingestion plan (P5 work)

Effort estimate per script: ~1 day each, parallelizable.

| Script | Source | Output | Effort |
|---|---|---|---|
| `scripts/ingest-openstax-math.mjs` | OpenStax Algebra & Trig | `data/stimulus-corpus/openstax-algebra-trig.json` | 1d |
| `scripts/ingest-nasa-climate.mjs` | climate.nasa.gov data API | `data/stimulus-corpus/nasa-climate-tables.json` | 1d |
| `scripts/ingest-noaa-weather.mjs` | NOAA NCEI API | `data/stimulus-corpus/noaa-weather.json` | 1d |
| `scripts/ingest-bls-data.mjs` | BLS public-data API | `data/stimulus-corpus/bls-economic.json` | 1d |
| `scripts/ingest-census.mjs` | Census API | `data/stimulus-corpus/census-demographic.json` | 1d |
| `scripts/ingest-fred.mjs` | FRED public-data API | `data/stimulus-corpus/fred-economic-timeseries.json` | 1d |
| `scripts/ingest-our-world-in-data.mjs` | OWiD GitHub CSVs (CC BY 4.0) | `data/stimulus-corpus/owid-*.json` | 1d |
| `scripts/ingest-gutenberg.mjs` | Project Gutenberg API | `data/passage-corpus/gutenberg-literary.json` | 1d |
| `scripts/ingest-wikipedia-passages.mjs` | Wikipedia API | `data/passage-corpus/wikipedia-informational.json` | 2d |
| `scripts/ingest-cdc-wonder.mjs` | CDC WONDER API | `data/stimulus-corpus/cdc-public-health.json` | 1d |

Total: ~10 days to ingest all Tier 2/3 sources. Once corpora exist, the fidelity pipeline never starves for authentic stimuli.

---

## Attribution rendering

Every Q that uses external data renders an attribution caption per its license requirement.

```tsx
{question.sourceAttribution && (
  <p className="text-xs text-muted-foreground mt-2">
    Data adapted from {question.sourceAttribution.name} (
    <a href={question.sourceAttribution.url} target="_blank" rel="noopener noreferrer">
      source
    </a>
    )
    {question.sourceAttribution.license === "CC BY 4.0" && " · CC BY 4.0"}
    {question.sourceAttribution.license === "CC BY-SA 4.0" && " · CC BY-SA 4.0"}
    {question.sourceAttribution.license === "Public domain" && " · Public domain"}
  </p>
)}
```

Schema already supports `sourceBook`, `sourceUrl`, `sourceLicense` per existing Question model.

---

## Compliance checklist (per ingestion)

- [ ] License confirmed (public domain / CC BY / CC BY-SA)
- [ ] Attribution metadata captured in ingestion output
- [ ] Source date stamped (data freshness for science passages)
- [ ] No login walls / robots.txt violations during scrape
- [ ] Bulk-rate-limit respect for federal API endpoints (use exponential backoff)

---

## Not in this manifest (deliberately excluded)

- **DSST source materials** — per `feedback_preplion_no_dsst_focus` memory rule
- **CLEP-specific** — separate manifest in PrepLion repo
- **AP-specific** — AP already has its own CED ingestion in `data/cb-spec/AP_*.json`
