# Customer Pain Research — Real Messages, Ranked (Dec 2025 – Jun 2026)
*2026-06-07 · from actual Reddit/forum threads, not assumptions · SN (SAT/ACT) + PL (CLEP)*

**Method honesty (read first):** Two researchers READ real messages and quoted them verbatim with
permalinks + dates.
- **CLEP** (PL): reached real r/clep threads via Redlib/safereddit mirrors + r.jina.ai (direct
  reddit.com was 403-blocked). 15 in-window messages across 12 threads.
- **SAT/ACT** (SN): **Reddit was fully unfetchable** in this environment (403/CAPTCHA on reddit +
  all mirrors; PullPush dies past May 2025). The SAT/ACT data is from **College Confidential**
  (`talk.collegeconfidential.com`, fully fetchable, 13 dated in-window threads) — real student +
  parent voice but **more parent-heavy** than Reddit. Blunt "$X/hr not worth it" price quotes are
  therefore under-represented for SAT/ACT. To get the Reddit student layer we'd need an
  authenticated Reddit API path (flagged for follow-up).

---

## PART 1 — CLEP (PrepLion). Ranked pain.

1. **"Free prep (Modern States) doesn't match the real exam"** (most-repeated, 6 msgs). Students use
   Modern States for the free voucher, find it "way easier than the practice tests," "only the bare
   bones," "comes up short," then under-perform. *("Modern States course was way easier than the
   practice tests and only gives you the bare bones" — r/clep, ~Jun 2026.)*
2. **Practice questions don't match the real exam → false confidence** (5 msgs). *"the test seemed
   easy and I finished fairly quickly… very disappointed when I saw my score"* (48, needed 50).
3. **Can't gauge readiness / how long to study** (4 msgs). *"what's a realistic amount of time for me
   to study before I could pass?"*
4. **Failing despite real studying** (4 msgs). *"I don't think this is a test you can pass just by
   memorizing definitions."*
5. **Remote-proctoring logistics/inconsistency** (3 msgs) — non-content but real friction.
6. **Hard to find free, realistic practice exams** (3 msgs).

**CLEP preferences:** Modern States (voucher only, not sufficient) · **Peterson's** + **official CB
practice test** (the readiness gauge serious students buy) · free-clep-prep.com · YouTube (mixed) ·
**AI drilling on missed questions is emerging and praised** (*"using ChatGPT to drill me"* → 72 vs
OP's 48; *"AI-generated study sheets from missed practice questions"*).

**CLEP willingness-to-pay:** strongly **free-first** (the free voucher is the whole anchor; many
"never paid"). But a clear narrow paid band: **~$25** for a *realistic* practice test / course
(official CB test, Saylor "$25 bucks"). No one quoted a subscription price. Implication: we compete
against *free voucher + free guides*, so price must be low and the value (exam-matched practice +
readiness signal + real explanations) unmistakable.

## PART 2 — SAT/ACT (StudentNest). Ranked pain.

1. **Score plateau — stuck near the top, can't break the last 30–90 pts** (most common). 1410–1510 /
   ACT 30–33 who "studied everything." The ask is **targeted weak-area diagnosis, not more volume** —
   every responder said "find your weak area, drill that."
2. **Digital-format anxiety (new Digital ACT + Digital SAT)** — freshest, most product-relevant.
   *Daughter "high 20s on digital ACT English/Reading vs 36 & 35 on paper"*; tutors "strongly advised
   against the digital version"; *"practice tests show a clear performance drop in digital format."*
   Plus digital-SAT testing-center tech failures.
3. **Scarcity of realistic *adaptive* practice beyond Bluebook** — students explicitly want
   *"adaptive practice tests… interface matching the Bluebook app, rather than PDFs."* Only ~7 free
   Bluebook tests exist; big companies gate theirs behind tutoring contracts.
4. **Pacing / running out of time** (esp. digital SAT Module 2).
5. **Motivation / consistency / burnout** — prescribed fix is a consistent structured plan.
6. **"Is more prep worth it?"** — diminishing returns at 1550+.
7. **Don't-know-what-to-study / which book** — constant entry point.

**SAT/ACT preferences:** **Official CB/ACT + Khan dominate** ("other sources are often too easy or
too difficult"). Bluebook (default) · **Erica Meltzer** (most-recommended author) · Official ACT "red
book" · College Panda · Manhattan 5lb · Desmos+TI-84. **Method they believe in:** timed full-length
practice, then *analyze why every wrong answer was wrong.*

**SAT/ACT willingness-to-pay:** free-first (exhaust Khan/Bluebook before paying). Tutoring seen as
effective-but-last-resort and gated behind packages/contracts (*"require paid enrollment or tutoring
contracts"*). Sweet spot = **1400–1500 SAT / ACT 30–33 plateau student** who burned through free
material, balks at $X00 tutoring, would pay a **modest subscription for "tutoring-like targeting
without the contract"** → maps to the **$9.99/mo** positioning.

---

## What the messages mean for us (don't assume — this is what they said)

**The single biggest cross-product finding:** the dominant unmet need on BOTH products is
**realistic, exam-fidelity practice + weak-area targeting + a readiness signal + real per-question
explanations.** Volume is NOT the pain; *fidelity and targeting* are.

This independently validates three things already in motion:
1. **CB/ACT-fidelity mandate** ([[feedback_sn_sat_equals_cb_sat]], [[project_cb_fidelity_megagoal_2026-06-05]])
   — "third-party is too easy/too hard" is the explicit objection that kills trial conversion. Our
   whole pitch lives or dies on fidelity.
2. **The circular-explanation BIQ** (today) — students explicitly praise *"AI drilling on missed
   questions"* and *"analyze why every wrong answer was wrong."* Our explanations ARE that feature;
   the 33%-circular defect was directly undermining the #1 thing power users value.
3. **Readiness/pass-probability signal** — "can't tell if I'm ready / fail by a few points" (CLEP #2-3)
   and plateau-diagnosis (SAT #1) are both **readiness-signal** problems. The Pass-Probability engine
   is aimed exactly here.

**Fresh wedge to act on (NEW):** **digital-format pain** for SAT/ACT — measurable score drops on the
new Digital ACT + scarcity of Bluebook-like adaptive practice. A "looks-and-feels-like-Bluebook,
adaptive, weak-area-targeted" practice experience is an under-served, high-intent wedge for the
1400–1500 plateau student. Ties to the SAT=CB digital-format work.

**Pricing read:** both audiences are free-first; the paid band is **low (~$25 one-time anchor for
CLEP / modest subscription for SAT-ACT)**. $9.99/mo is correctly positioned, but conversion is
**fidelity-gated**, not price-gated — fix fidelity + explanations + readiness before pushing price.

## Follow-ups
- Get the **Reddit student layer for SAT/ACT** (authenticated Reddit API) — current SAT/ACT data is
  CC/parent-skewed.
- Feed these ranked pains into the interview script (`docs/CUSTOMER_DISCOVERY_INTERVIEWS_2026-06-07.md`)
  and the pain→fit map.
- Re-run quarterly (demand-cycle aware — see `docs/DEMAND_CYCLE_STRATEGY_2026-06-07.md`).
