# NurseHub Competitive Deep-Dive (2026-05-13)

Subject: [nursehub.com/teas](https://nursehub.com/teas/) and the broader NurseHub product family
Author: claude (deep-dive run 2026-05-13 evening)
Status: live; superseded only by re-runs after material competitor changes

This document is the source of truth for everything we know about NurseHub.
Read it before touching TEAS-related work, pricing decisions, marketing
copy, or any expansion BD strategy. Cross-product learnings derived from
this analysis live in `docs/cross-product-learnings-from-nursehub.md`.

---

## 1. Front-end / UX

**Stack signals**
- WordPress + LearnDash-class LMS plugin
- Cloudways hosting (image URL leak: `wordpress-1395366-5173141.cloudwaysapps.com`)
- Cloudflare in front (`/cdn-cgi/l/email-protection`)
- No native mobile app — web-only
- No visible analytics (no GA, Hotjar, Klaviyo, Mixpanel in public HTML) — server-side analytics or genuinely light tracking
- No Next.js / Vite / SPA architecture

**Page architecture**
- Tabbed content sections (TEAS / HESI / SimRN / NCLEP)
- Course → lesson → quiz hierarchy (classic LearnDash)
- Quiz pages gated behind login (`/teas-quiz/`, `/teas-test-prep/` returned 404 to unauthenticated probes)
- Free diagnostic is the only un-paywalled surface — lead magnet

**Testimonial pattern (worth mirroring)**
- 5 named testimonials with student photo, score, named school
- Schools cited: UT Health, Broward College, Chamberlain University, California State University, Illinois Valley Community College
- Plus star-rating block + external links to TikTok / YouTube / Facebook reviews
- "Payton" unnamed-last-name pattern + ★★★★★ for casual social-proof feel

**Performance ceiling**
- WordPress + Cloudways + heavy testimonial imagery → estimated LCP 2-3s on mobile
- WP page builder limits client-side performance
- This is a **competitive wedge for us** — Next.js + CF Pages + WebP gets sub-1s LCP

---

## 2. Backend

**Architecture inference**
- WordPress with LearnDash (or LifterLMS) plugin
- LearnDash courses → lessons → quizzes hierarchy in DB
- Separate registration endpoints per plan: `/register/premium/`, `/register/quarterly/`
- WP Stripe Gateway or LearnDash Stripe Integration likely
- No visible REST / GraphQL API surface
- Standard WordPress cookie auth

**Operational implications**
- Quiz state in `wp_learndash_*` tables or user meta
- Pure request/response — no SSE/WebSocket signals
- Question delivery is templated PHP, not API-driven SPA
- Cloudflare email obfuscation = anti-spam, not abuse / rate-limit story
- Per-plan separate URLs = clean UTM attribution

**Implications for us**
- WordPress fundamentally can't deliver adaptive routing, spaced repetition, real-time mastery scoring
- Their human Learner Success Team is the operational moat that replaces what AI could provide
- Their architecture forces them to be a "course-and-quiz" company, not an adaptive-learning company

---

## 3. Content + methodology

**Bank claims**
- 3,930 practice questions total
- 40 full-length test simulations
- 30+ hours of on-demand video lessons
- Per-section: Math 38Q (34 scored), Science 50Q (44), Reading 45Q (39), ELU 37Q (33) — mirrors real ATI TEAS structure

**Content authorship — the moat**

| Team member | Background | Role |
|---|---|---|
| Alex Hollis | Teach For America Mississippi Delta | Founder |
| Leigh | 25y RN + 15y nursing ed | Senior Manager of Nursing Education |
| Morgan | Attorney + former science teacher | Built new TEAS Science videos/lessons |
| Nicole | 10y education + instructional coach | Instructional design |
| Uday | 10y e-learning tech | UX |
| Bobby | Radio/video production | Learner Success + Marketing |
| Ana | RN + Product Designer | Healthcare + tech |

Real human authorship. Not AI-generated. Their content moat is **Leigh's 25 years of RN experience** providing the nursing-credentialed authority on every Science / A&P question.

**New TEAS 7 question types they explicitly teach (and we must support)**
1. Multiple Select ("select all that apply") — MUST HAVE v1
2. Fill in the Blank (no options provided) — MUST HAVE v1
3. Hot Spot (clickable image regions) — defer v2 (needs image-coordinate tooling)
4. Ordered Response (drag-and-drop sequence) — defer v2

**Pass-rate claims**
- "98% pass rate" on homepage
- "94% pass rate" on TEAS landing
- No published methodology; almost certainly a subset like "course completers who pass"
- Real industry base rate: ~60% of first-time TEAS takers pass

**Quality reception (from allnurses forum threads)**
- Verdict trends "harder than the actual exam" — most consistent reaction
- Some students reported real exam was "similar" or "slightly easier"
- Answer explanations universally praised
- No widespread accuracy complaints
- ATI's own materials get *more* complaints than NurseHub's

---

## 4. Pricing + moat

**Pricing table**

| Product | Monthly | Quarterly | Effective discount |
|---|---|---|---|
| TEAS 7 + HESI A2 (bundle) | $29.99 | $59.99 (3mo) | 33% off monthly rate |
| NCLEX Prep | $39.99 | $99.99 (3mo) | 17% off |
| SimRN | $14.99 | $29.99 (3mo) | 33% off |

**No free tier** — only free diagnostic tests (lead magnet).

**Pass Guarantee (THE moat)**
- Complete the course (criteria not fully published)
- Take the exam
- If you fail → 100% refund + they pay the ~$130 ATI retake fee
- Trust signal is enormous; replication costs them money but converts massively

**Other moats**
- 30+ hours human-produced video (production cost)
- 6-person team with nursing-credentialed lead (Leigh)
- University Partnerships channel (B2B distribution — dedicated nav item)
- 24/7 Learner Success team (operationally expensive)
- 50K+ cumulative students claim

**Scale signals**
- 6-person team named on Team page
- 50K+ cumulative student count
- Crunchbase listing exists (couldn't fetch funding details — likely bootstrapped or seed)
- LinkedIn presence
- TikTok + YouTube + Facebook active channels

---

## 5. What they don't do (our wedge surfaces)

NurseHub explicitly does not offer:
- Adaptive difficulty / dynamic question routing
- AI/ML question selection
- Spaced repetition
- Native mobile app
- AI tutor / on-demand explanation
- Multi-exam progress sync
- Real-time score prediction + state-cutoff calculator
- Confidence-weighted scoring
- Sage-class explanations on demand
- Question reports / community improvement loop

**Five of those we already have for AP/SAT/ACT.** TEAS would inherit them at near-zero engineering cost. **Our adaptive-AI surface is the largest wedge against the entire TEAS competitive market.**

---

## 6. The "nursehub.shop" claim — red flag, do NOT mirror

There's a sibling subdomain (`nursehub.shop`) claiming "Real 2026 Questions from completed TEAS and HESI exams." That's the kind of content-leakage claim ATI aggressively pursues legally. We must never approach this framing. Our copy is explicit: original questions modeled on the ATI TEAS 7 blueprint; no actual exam questions. Period.

---

## 7. Strategic implications saved as separate doc

See `docs/cross-product-learnings-from-nursehub.md` for the broad
applications across StudentNest + PrepLion (testimonial format, pass
guarantee model, bundle pricing, mobile-first PWA strategy, performance
moat, domain-specialist judges, university partnership channel, named
team page).

See `docs/TEAS-build-plan.md` for the TEAS-specific build plan now
updated with: new question type schema additions, nursing-educator
retainer, pass-guarantee line item.

---

## 8. Sources

- [nursehub.com/teas/](https://nursehub.com/teas/) — TEAS landing
- [nursehub.com/](https://nursehub.com/) — homepage with full product lineup
- [nursehub.com/team/](https://nursehub.com/team/) — team page (mirrors team table above)
- [Alex Hollis LinkedIn](https://www.linkedin.com/in/alexanderhollis/) — founder bio
- [allnurses forum — TEAS practice vs actual](https://allnurses.com/comparing-teas-practice-tests-vs-t698824/) — user reception
- [TikTok discovery — Are NurseHub TEAS similar to real](https://www.tiktok.com/discover/are-nursehub-teas-practice-tests-similar-to-teas-exam) — social signal
- [PrepScholar TEAS practice test roundup](https://blog.prepscholar.com/teas-practice-test) — independent ranking
