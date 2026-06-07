# Demand-Cycle Surge Readiness + Customer Discovery — Strategy
*StudentNest (AP/SAT/ACT/PSAT) + PrepLion (CLEP/ACCUPLACER) · 2026-06-07*

Two halves: **(A)** a timing-driven readiness/quality/pricing/marketing playbook keyed to each
exam's demand cycle, and **(B)** a wired customer-discovery system that continuously surfaces real
user pain points and maps them to fixes. Sources for all exam dates: official CB/ACT pages (see
`memory/project_demand_cycle_and_customer_discovery_2026-06-07.md` for the cited URL list).

---

## PART A — Demand-Cycle Playbook

### A1. The core insight (user's framing, confirmed by research)
Demand for exam prep **leads the test date by 1–3 months** and **collapses immediately after**.
So the product must be *content-complete and infra-ready BEFORE the surge window opens*, not during
it. Three demand shapes:

| Exam group | Demand shape | Driver |
|---|---|---|
| **AP** | One sharp annual spike, late-Mar → early-May, peak the 2 weeks before exams | Fixed May exam window |
| **SAT / ACT** | Multiple spikes/year (summer-intensive ramp + each of ~7–8 test dates) | Rolling national dates |
| **PSAT** | Single Oct spike (+ small spring PSAT 10/8-9) | School-administered October |
| **CLEP / ACCUPLACER (PL)** | Flatter, **counter-cyclical**: bumps Aug & Jan | College enrollment cycles, not test dates |

**Strategic consequence:** PrepLion's CLEP/ACCUPLACER demand (Aug & Jan enrollment) fills the exact
troughs when StudentNest is quiet (Jan, early summer). The two products are a natural revenue +
infra-load hedge — market them counter-cyclically on purpose.

### A2. 2025-26 exam calendar (verify exact Saturdays against official pages before locking ads)
- **SAT (digital):** ~8 US national dates — Aug 23, Sep 13, Oct 4, Nov 8, Dec 6 (2025); Mar 14, May 2, Jun 6 (2026). Reg deadline ~2–3 wks prior; scores ~2–3 wks after.
- **ACT (online national since Apr 2025; Science now optional):** Sep 6, Oct 25*, Dec 13 (2025); Feb 7, Apr 11, Jun 13, Jul 11 (2026). Reg ~5 wks prior; MC scores ~2 wks. (*verify fall Saturdays)
- **PSAT/NMSQT:** Oct 1–31, 2025 window (Sat option Oct 11); scores ~mid-Nov. PSAT 10: Mar–Apr 2026.
- **AP:** May 4–8 & 11–15, 2026 (late-testing May 18–22). **Scores: Jul 6, 2026.**
- **CLEP:** year-round on-demand; instant scores (essay exams 2–3 wks).
- **ACCUPLACER:** year-round, college-scheduled; demand clusters pre-term (Jul–Aug, Dec–Jan).

### A3. Month-by-month operating calendar
Legend: 🟥 stacked-surge / capacity risk · 🟩 PrepLion counter-cyclical carry · ⬆ ramp content+ads now

| Month | In pre-exam surge | Action |
|---|---|---|
| **Jan** | SAT(Mar) ramp · 🟩 CLEP/ACCUPLACER spring-enroll | Push PL hard; begin SAT-March content top-up |
| **Feb** | SAT Mar, ACT Apr · ⬆ AP review build starts | Pre-stage AP review (peak is 8 wks out) |
| **Mar** | SAT(Mar 14), PSAT-spring, AP ramp | SAT score-release retake upsell (Mar 27) |
| **Apr** | 🟥 **AP peak, SAT May, ACT Apr/Jun** | Freeze risky deploys; infra headroom; ad budget peak |
| **May** | 🟥 **AP exams, SAT(May 2), ACT, SAT-Jun ramp** | Capacity-critical; gen crons pre-warmed; no migrations |
| **Jun** | SAT(Jun 6), ACT(Jun 13) | Summer-intensive ramp begins; collect AP feedback |
| **Jul** | ACT(Jul 11) · **AP scores Jul 6** | 🔔 Biggest single re-engagement moment (AP scores) |
| **Aug** | 🟥 **SAT(Aug 23) summer-peak · 🟩 CLEP/ACCUPLACER fall-enroll** | Both products hot; content must be green by Aug 1 |
| **Sep** | SAT(Sep 13), ACT | Fall junior-testing push |
| **Oct** | 🟥 **SAT(Oct 4), ACT, PSAT(Oct)** | Capacity risk; PSAT→SAT conversion funnel live |
| **Nov** | SAT(Nov 8) | Taper; build Dec/Mar retarget lists |
| **Dec** | SAT(Dec 6), ACT · 🟩 CLEP/ACCUPLACER spring ramp | SAT score cascade → retake upsell |

**Capacity-risk months to engineer for: April, May, August, October.** Pre-stage content + ad spend
+ infra scaling **4–8 weeks ahead** of each.

### A4. Readiness axis (infra — own this BEFORE the surge)
- **Infra is unblocked:** CF Workers Paid ($5/mo, 10 MiB) is live. Before each 🟥 month: (1) pre-warm
  question-gen so the surging exam's bank is green; (2) verify AI-provider rate limits + DB pool
  headroom; (3) **deploy freeze** during the exam window itself (no migrations in May/Oct).
- **Surge-readiness checklist** (run T-6 weeks before each surge month): bank coverage green for the
  surging exam · cron throughput tested at 2× · error budget / SRE gate clean · landing + pricing
  pages match current dates · re-engagement emails staged.

### A5. Quality axis
- The surging exam's bank must be **content-complete AND CB-fidelity green before its window opens** —
  ties directly to the CB-fidelity mega-goal (`project_cb_fidelity_megagoal_2026-06-05`).
- Trough months (Jan, Jun) are the **quality-work windows**: re-sweep, gap-fill, fidelity audits when
  student traffic is lowest, so peak months ship from a known-good bank.

### A6. Pricing axis
- **Surge = capture, do NOT discount into demand.** High-intent buyers near a test date convert at
  full price. Reserve discounts for **troughs** (win-back, annual-plan pushes in Jan/Jun).
- **Deadline-anchored urgency** (honest, not fake): "SAT is in 3 weeks — lock your prep now."
- **Score-release upsell:** retake/annual offers triggered at each score-release date (esp. AP Jul 6,
  SAT Oct–Dec cascade).
- Counter-cyclical: lean **PrepLion annual** offers into Jan & Aug enrollment bumps.

### A7. Marketing axis
- **Timing beats budget.** SEO + ad ramp must lead the test date by the prep lead-time (1–3 mo):
  SAT/ACT content & ads live by **June–July**; AP-review by **Feb–Mar**; PSAT→SAT by **Sept**.
- **Two annual re-engagement super-moments:** AP score day (Jul 6) and the Oct–Dec SAT score cascade —
  pre-build retaker/upsell flows.
- **PSAT→SAT funnel:** Oct PSAT-takers are the highest-intent SAT-prep pipeline; capture in Nov–Dec.

---

## PART B — Customer-Discovery System ("find real pain, fit our solution")

### B1. The gap (verified in code, 2026-06-07)
We already capture raw signal but never turn it into discovery:
- `SessionFeedback` (`prisma/schema.prisma:667`) stores thumbs ±1 + free-text + context
  ("completion"|"abandon") — but **only prompts on thumbs-down/abandon**, and nothing clusters it.
- `/api/practice/feedback` writes it; `/api/admin/feedback` lists it raw.
- Reddit crawl scripts (`scripts/crawl-reddit-exam-subs.mjs`, `reddit-gap-analyzer.mjs`,
  `extract-reddit-tips.mjs`) pull external signal — but feed *content gaps*, not *product pain*.
- **No layer ranks pain points, closes the loop, or expands capture beyond thumbs-down.**

### B2. The system — Capture → Cluster → Surface → Act → Close
A continuous loop across three signal sources:

1. **In-app explicit** (highest fidelity): expand capture beyond thumbs-down.
   - Add a **1-tap "What got in your way?" micro-prompt** on abandon AND on every Nth session
     (not just thumbs-down) with fixed categories (Too hard · Too easy · Confusing wording ·
     Looked broken/missing image · Too repetitive · Pacing/time · Wanted more explanation · Other+text).
   - Add a lightweight **NPS / "would you recommend?"** prompt at a WIN moment (after a high-score
     session), never mid-frustration. (Convert-on-win pattern, `project_conversion_drop_off_fixes`.)
2. **In-app behavioral** (no user effort): mine telemetry for *implicit* pain — where users abandon
   (which unit/question), rage-repeat, or drop after a render-broken question.
3. **External** (market-wide): the existing Reddit crawl — real complaints students post about prep
   tools and specific exams.

**Cluster:** a deterministic pain-point **taxonomy** (keyword buckets) first, with optional LLM
theme-tagging as the LAST layer (per `feedback_validator_must_be_deterministic` — deterministic
first, LLM never the only judge). Output = ranked pain points with frequency, exam, and example quotes.

**Surface:** a weekly **Discovery Report** (`data/discovery-reports/pain-points-<date>.{json,md}`) +
an admin "Voice of Customer" panel. Top 5 pain points each week become candidate work items.

**Act → Close the loop:** each top pain point gets an owner + a fix (BIQ/RCA per
`feedback_rca_for_every_defect`); the report tracks whether last week's pain points moved this week.

### B3. What's wired now (this commit)
- **`scripts/discovery-aggregate.mjs`** (SN; PL parity to follow) — read-only DB mine of
  `SessionFeedback` (free-text + abandon rows, last 90d) → deterministic taxonomy bucketing →
  ranked `data/discovery-reports/pain-points-<date>.{json,md}`. This is the **Cluster→Surface**
  engine. Cron-wireable (weekly) once validated. Run: `node scripts/discovery-aggregate.mjs`.

### B4. Roadmap (next, in priority)
1. **Expand capture** — micro-prompt component on abandon + every Nth session (both products).
2. **Behavioral mining** — add abandon-point + render-broken-exposure to the aggregator.
3. **Unify Reddit** — fold `reddit-gap-analyzer` output into the same Discovery Report.
4. **Surface** — admin "Voice of Customer" panel reading the latest report.
5. **Cron + close-loop** — weekly cron; week-over-week pain-point trend; owner assignment.
6. **NPS at win-moments** — convert-on-win prompt.

### B5. Success metric
A weekly report the owner can read in 2 minutes that answers: *"What are the top 5 things hurting
our users right now, on which exam, and did last week's fixes move the needle?"*
