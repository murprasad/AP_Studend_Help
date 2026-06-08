# Quality Process v2 — Built-In Quality (BIQ) + Role-Based Gates for SN + PL

**One standard for both products.** Same gates run on every change before it reaches studentnest.ai or preplion.ai.

> Memory anchor: mirrors `memory/feedback_quality_process_v1.md` + `memory/feedback_rca_for_every_defect.md`. Edits must stay in sync between `AP_Help/docs/QUALITY_PROCESS.md` and `PrepLion/docs/QUALITY_PROCESS.md`.

---

## BIQ — Built-In Quality (HARD REQUIREMENT)

**Every defect or bug — internal (we found it) OR external (a user/customer found it) — triggers the BIQ loop. No exceptions.** Quality is built in, not inspected in. The point is not to "fix the bug"; it is to make the *class* of bug impossible to ship again.

### BIQ loop (run for every defect)
1. **Tech RCA** — 5-Why to the technical root cause (not the symptom).
2. **Process RCA — convene the team.** The role that *should* have caught it weighs in: what happened from my lens, was my gate accountable, what is the root cause from my lens. For a **systemic / repeat / customer-facing** defect, convene **all six roles** (PO/DEV/REV/QA/RM/SRE) — use parallel role subagents. For a **routine, single-owner** defect, the owning role + REV weigh in (lightweight). Either way the output is honest accountability, not reassurance.
3. **Accountability** — name the gate(s) that failed and the degree. Cluster failures ⇒ env/fixture/process, not one person. Accountability is about fixing the *gate*, not blaming.
4. **Corrective actions** — **ICA** (immediate fix, ship now) · **ECA** (contain the blast radius / sibling instances) · **PCA** (permanent: the gate change that makes the class impossible).
5. **Wire the lesson to the role** — add the PCA as a concrete, testable checklist item on that role's gate (below) AND, if general, to `memory/feedback_*`.
6. **Update this process-flow doc** — the defect + its gate patch is appended to the **Defect Ledger** (bottom). If no process existed for the area, create one; if it existed, fix what's broken.

### Process flow (text)
```
defect (internal/external)
   → Tech RCA (5-Why)
   → Process RCA (convene role team; weigh-in + accountability)
   → ICA ship now │ ECA contain │ PCA gate-change
   → wire PCA to the failing role's gate checklist (+ memory if general)
   → append to Defect Ledger; bump this doc
   → verify the new gate would have caught the original defect
```

---

## Independent Verification Agents (HARD REQUIREMENT — added 2026-06-07)

**The author of a change CANNOT self-declare it "done", "verified", or "live".** An *independent* agent (separate context, adversarial mandate) must pass it. This rule exists because the author keeps substituting code-reasoning ("the condition is there, it'll work") for actual observation, and shipping gaps the user then catches. On 2026-06-07 an independent audit immediately found HIGH defects (duplicate primary CTA + a dead button on PL) that the author missed and whose own QA-walk script was broken (tested the wrong page, couldn't even authenticate).

### The roster
| # | Agent | Mandate | Maps to gate |
|---|---|---|---|
| 1 | **Requirements-Conformance Auditor** | Take the requirement VERBATIM; verify every clause is built (clause-by-clause ✅/❌/partial). Catches thin-slice-claimed-as-done. | G1/PO |
| 2 | **Adversarial Code Reviewer** | Skeptically hunt bugs / edge-cases / dead code / races / inconsistencies in the diff. Assume bugs exist. | G3/REV |
| 3 | **QA Persona Walker** | EXECUTE the authed journey in a real browser; assert OBSERVED behavior (click, don't read). Use a WORKING harness. | G4/QA (load-bearing) |
| 4 | **PL=SN Parity Auditor** | Diff the two products feature-by-feature; flag divergence. | G3/REV (cross-product) |
| 5 | **Process/BIQ Compliance Auditor** | Verify each change actually passed G1–G6; flag skipped gates. | meta |
| 6 | **Live-Prod Verifier** | Independently confirm prod matches claims (200 + content + no 500s + behavior). | G6/SRE |

### The gate
- Nothing is **"done"** until **Agent #2 (REV) + Agent #3 (QA Walk) both pass independently.**
- A **release** additionally requires **Agent #5 (BIQ Compliance)** sign-off and **Agent #6 (Live-Prod Verify)** post-deploy.
- Any **cross-product** change additionally requires **Agent #4 (Parity)**.
- The agents are spawned in a **separate context** (the user may spawn them for true independence). The author's own assertion is never sufficient.
- **QA-walk harness rule:** the walk must actually authenticate (use the REAL form controls — e.g. Radix `<Select>` via `getByRole('option')`, not `select[name=…]`), drive the full redirect chain to the target state (a fresh user is redirected to onboarding — handle it, don't single-hop), assert on a page whose behavior is controlled by the feature under test (not a page that auto-changes for other reasons), and **hard-fail** instead of `.catch(()=>{})`-swallowing a broken step.

---

## Question-Quality Tri-Agent Protocol (HARD REQUIREMENT — added 2026-06-07)

**Every time we have a question-quality issue, THREE agents are engaged — no soloing.** The author
coordinates; the agents do the work and the monitor independently confirms it. Mandatory for any
bad-question class (figure-missing, circular explanation, contamination, wrong answer, off-style):

| Agent | Role | Mandate on a quality issue |
|---|---|---|
| **1. Generation-Engine Agent** | improve how questions are MADE | Fix the generator (`src/lib/ai.ts` prompt/logic) so the defect can't be produced — emit a figure when one is claimed, or rephrase to not need it; trace every change to the defect. |
| **2. Validation-Engine Agent** | improve how questions are GATED | Strengthen the deterministic gate (`render-hazard-validator.ts`, `deterministic-question-gates.ts`) so the defect is BLOCKED at approval; fail-closed; precise (no false positives). |
| **3. Independent Process-Monitor Agent** | oversight | Independently confirm (1)+(2) close the defect, the gate blocks + the generator complies, BIQ/RCA + G1–G6 were followed, no regressions. Reports pass/fail. |

Rules:
- **Deterministic-first:** the gate is deterministic; LLM judgment is the last layer, never the first.
- **Verify, don't assume — both directions:** confirm a defect is real before mass-acting (a noisy
  detector that flags GOOD questions is itself a defect), AND confirm a required asset (figure/passage)
  is actually present before approving.
- **Retroactive + forward:** fix new generation (gate + generator) AND sweep the existing bank.
- The Monitor (Agent 3) is the load-bearing sign-off — the author's "it's fixed" is never sufficient.

---

## Why this exists — defect clusters that exposed gaps

**Cluster 1 (2026-06-02):** admin reset, dead landing tiles, SAT track, Khan URL rot, popup jump, missing trademark, 23 stale tests. Common cause: **QA persona walkthrough skipped**.

**Cluster 2 (2026-06-06):** the QA gate from v1 caught **zero** of these — the *user* was QA:
| Defect | Root cause | Gate(s) at fault |
|---|---|---|
| D1 Figure-render: `data:image/svg+xml;utf8,` broke in browsers; 1,732 broken images | string-asserted in Node, never browser-rendered; non-standard scheme unreviewed | DEV, REV, QA, SRE |
| D2 Score-confusion: 781 (sidebar) / 45 (hero) / 765 (analytics) — one engine, 3 surfaces, 2 scales | no single source-of-truth for "the student's score"; no composite-coherence review | DEV, REV, QA, PO |
| D3 Card-flip: primary card non-deterministic (capped ↔ Today's Set) | 5 cards each fetch own "answered today"; no single cap owner | DEV, REV, QA |
| D4 Military-trial gap: `/clep-military` promises 30-day free; only referrals got it | marketing promise never wired to a code path or test | PO, DEV, REV |
| D5 Claimed-not-live: PL focus parity committed to a branch, never promoted (`/focus-friendly` 404) | "committed" treated as "done"; no branch-in-main / verify-live gate | RM, PO, REV |
| D6 Meta: load-bearing QA gate caught none of D1–D5 | G4 run as a checklist, scoped to "the change," never the composite screen, no proof-of-execution | QA (owner), RM (didn't enforce) |

**The fix is not more gates — it is making the existing gates *execute* and *block*.** Soft-warns became hard blocks; QA became a real browser walk with artifacts; "done" means "verified live in prod."

---

## Roles + their gates (lessons from Cluster 2 wired in **bold**)

| Role | Mandate | Outputs |
|---|---|---|
| **PO** | Define change + why + success criteria + rollback | Change-spec paragraph |
| **DEV** | Implement; no scope creep | Code + tests + clean typecheck |
| **REV** | Independent eye on the diff | Review verdict |
| **QA** | Walk the change as a real user (LOAD-BEARING) | Persona Walkthrough Log w/ artifacts |
| **RM** | Gate the deploy | Release Manifest |
| **SRE** | Post-deploy monitoring + incident response | Smoke log + Defect Ledger entry |

### G1. PO Gate
- [ ] Change spec: what / why / success criteria / rollback (commit/tag to revert to)
- [ ] **Definition of Done = "verified LIVE in prod via URL/DB check," not "committed" or "merged"** (D5)
- [ ] **Multi-component or marketing-tied change → cross-spec coherence audit AT SPEC TIME** (lists all related specs; declares one coherent outcome). If it touches a marketing promise, the spec cites the exact claim + a user-state success criterion (D2, D4)
- [ ] PO does not allow promote until G4 (QA walk) is complete

### G2. DEV Gate
- [ ] `npx tsc --noEmit` clean; relevant tests added/updated; commit cites the change-spec + files
- [ ] **Visual / data-URI / image output is verified to RENDER in a real (headless) browser or decoded, not just string-asserted** (e.g. base64 SVG must `atob` → contain `<svg`) (D1)
- [ ] **User-facing state that appears on >1 surface (score, daily cap, streak, readiness) comes from ONE shared source-of-truth (hook/endpoint), not independent per-component fetches** (D2, D3)
- [ ] **Any marketing/promise-bearing behavior has a linked code path + a test asserting it** (D4)

### G3. REV Gate — independent review of the diff
- [ ] Scope matches spec; cross-cutting changes ran `Plan`/`code-review` first
- [ ] **Failing CI tests are NOT allowlisted** — fix, or delete obsolete tests with cited reason
- [ ] **Composite-screen coherence: count score scales (≤1) + primary CTAs (exactly 1) on any touched user screen** (D2, D3)
- [ ] **Marketing-promise ↔ code-path cross-check** for landing/pricing/billing/marketing copy changes (D4)
- [ ] **Release-state clarity: confirm the work is on `main` AND deployed — "committed to a branch" ≠ "done"** (D5)
- [ ] **Flag non-standard encodings / data-URI schemes / browser-fragile output** (D1)
- [ ] Legal/trademark preserved; JWT-vs-DB desync checked; SW/cache invalidation considered

### G4. QA Gate — Persona Walkthrough (LOAD-BEARING)
**Real browser. Real clicks. Documented log WITH ARTIFACTS proving the walk ran.** Log at `data/qa-walks/YYYY-MM-DD-<change-id>.md`.
- [ ] **Fresh user** (incognito) signs up + walks the journey end-to-end
- [ ] **Affected-segment persona** — if the change targets a segment (military, free, a track, ADHD), sign up AS THAT persona and **verify the entitlement/behavior in the DB/UI**, not just the copy (D4)
- [ ] **Composite-screen coherence check** on any touched screen: **≤1 score scale visible, exactly 1 primary CTA, RELOAD TWICE and assert the screen is deterministic** (no flip) (D2, D3)
- [ ] **Focus-session lifecycle walked END-TO-END** — for any Focus-Mode change, enter Focus → run a SHORT practice session → **complete it** → land on the completion/feedback screen. Stopping at the dashboard/minimal-view is NOT a Focus walk (D7)
- [ ] **Focus minimalism** — every Focus surface walked + asserted minimal (no mode-chooser, settings collapsed, count ≤10, one primary CTA), per `docs/FOCUS_MINIMALISM_CONTRACT.md`. Run `scripts/_qa-walk-focus-minimalism.mjs` — checking ONLY the dashboard is NOT sufficient; the practice SETUP, in-session, and completion surfaces must all be asserted (D8)
- [ ] **Render-stability, not just presence** — on the completion/feedback screen (and any ticker/animation-adjacent screen), HOLD the screen ~3s and assert the key element did NOT mount/unmount and is present EXACTLY ONCE (no flicker, no duplicate). `toBeVisible()` at an instant is insufficient (D7)
- [ ] **Visual render check** — open a representative question with a figure and confirm it renders (no broken-image/alt fallback), across 2 browsers (D1)
- [ ] **Post-promote, walk the LIVE prod URL** (not just staging) for the changed surface (D5)
- [ ] **Log must include observations/screenshots proving execution** — intent ≠ evidence (D6)
- [ ] **Any identified bug is a blocker** — back to DEV; no promote

### G5. RM Gate
- [ ] `pages:deploy:staging` passes; zero NEW failures off the chronic-CF-cold-start allowlist
- [ ] **HARD BLOCK (not soft-warn) if the QA walk log is missing/stale or the Release Manifest is absent** (D6) — set `ENFORCE_QUALITY_GATES=1`
- [ ] **Pre-promote: assert the release commit is an ancestor of `main` (`git merge-base --is-ancestor`) — branch-only work cannot promote** (D5)
- [ ] **Post-promote: RM verifies the specific changed surface is live on the prod URL (200 + expected content) before sign-off** (D5)
- [ ] Manifest committed at `data/release-manifests/<tag>.md`; tag created; `pages:promote` run

### G6. SRE Gate (post-promote)
- [ ] Production smoke green; **30-minute watch**
- [ ] **Synthetic route canary: every route in the manifest (incl. NEW ones) returns 200 + expected substring** (D5)
- [ ] **Render-health probe: sample N prod questions; assert stimulus images decode** (D1)
- [ ] **Entitlement-invariant probe: a military signup has a trial; tiers map to correct limits** (D4)
- [ ] **Any user-reported defect within 24h → BIQ loop opened, gate attributed, this doc updated** (D6)

---

## Accountability matrix — Cluster 2 (worked example)
| Defect | Primary | Secondary | PCA (wired above) |
|---|---|---|---|
| D1 | DEV | REV, SRE | G2 browser-render verify; G3 flag non-std encodings; G6 render-health probe |
| D2 | DEV/PO | REV, QA | G2 single-source-of-truth; G3+G4 composite-coherence (≤1 scale) |
| D3 | DEV | REV, QA | G2 single cap owner; G4 reload-twice determinism |
| D4 | PO | DEV, REV | G1 marketing↔spec; G2 promise↔code+test; G6 entitlement probe |
| D5 | RM | PO, REV | G5 branch-in-main + verify-live; G1 DoD=live; G3 release-state |
| D6 | QA | RM | G4 artifacts + composite + prod walk; G5 hard-block on missing QA log |

---

## Enforcement
| Layer | Mechanism |
|---|---|
| Durable rules | `memory/feedback_*` (loaded every session via MEMORY.md) |
| Repo docs | This file + `RELEASE_CHECKLIST.md` |
| Deploy gate | `scripts/pre-release-check.js` (QA-walk freshness + manifest) — **must run with `ENFORCE_QUALITY_GATES=1` so these HARD BLOCK** |
| Promote gate | `scripts/deploy-promote.js` — branch-in-main check + parses manifest; refuses if any gate pending |
| Continuous | route canary + render-health + entitlement probes (SRE); external-URL audit cron |

---

## Defect Ledger
Append every BIQ-processed defect: `date · defect · root cause · gate(s) fixed · PCA`.
- 2026-06-06 · D1 figure-render (`;utf8,` SVG) · Node-only test, non-std scheme · G2/G3/G6 · base64 encoder + `isRenderableImageUrl` gate + render-health probe
- 2026-06-06 · D2 score-confusion · no single score source · G2/G3/G4 · unify to Projected-SAT-400-1600 + composite-coherence gate *(ICA in progress)*
- 2026-06-06 · D3 card-flip · 5 independent cap fetches · G2/G4 · single cap-state owner *(ICA in progress)*
- 2026-06-06 · D4 military-trial gap · promise unwired · G1/G2/G6 · grant on `gradeLevel==="Military"` + entitlement probe
- 2026-06-06 · D5 PL focus claimed-not-live · committed≠deployed · G5/G1/G3 · branch-in-main + verify-live gate
- 2026-06-06 · D6 QA caught none · checklist theater · G4/G5 · artifacts + composite + prod walk + hard-block
- 2026-06-07 · D7 Focus-completion feedback FLICKER (sprint-ticker re-render race) · Focus session lifecycle never walked end-to-end + tests assert presence not render-stability · G4 · Focus-lifecycle walk + render-stability assertion; tests `tests/focus-session-feedback-stability.spec.ts` + `tests/unit/focus-feedback-stability.test.ts` (PrepLion: docs/BIQ_FOCUS_FEEDBACK_FLICKER_2026-06-07.md)
- 2026-06-08 · D8 Focus strips SOME surfaces but not others (dashboard one-action + 20-question count + practice-setup buffet — 3 user reports) · no holistic Focus-minimalism contract + Focus QA walk only checked the dashboard · G4 · `docs/FOCUS_MINIMALISM_CONTRACT.md` (per-surface HIDDEN/KEPT spec, both repos) + `scripts/_qa-walk-focus-minimalism.mjs` (walks EVERY Focus surface: dashboard + practice-setup + in-session + completion; asserts no mode-chooser, settings collapsed, count ≤10, one primary CTA; hard-fails) + G4 checklist line. Walk is designed to FAIL today on the un-stripped practice setup so it catches the class.

---

## Both products, same standard
`PL = SN`. Mirror every edit between `AP_Help/docs/QUALITY_PROCESS.md` and `PrepLion/docs/QUALITY_PROCESS.md`.

## Last updated
2026-06-06 — v2: BIQ hard requirement (every defect, internal or external) + 6-role Process-RCA on Cluster 2; role lessons wired into G1–G6; accountability matrix; Defect Ledger.
