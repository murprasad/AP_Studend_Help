# Quality Process v1 — Role-Based Gates for SN + PL

**One standard for both products.** Same gates run on every change request before it reaches studentnest.ai or preplion.ai.

> Memory anchor: this doc mirrors `memory/feedback_quality_process_v1.md`. Edits must stay in sync between AP_Help/docs and PrepLion/docs.

---

## Why this exists — gap audit from recent defects

| Defect (user-reported) | Role that should have caught it | Why it didn't |
|---|---|---|
| SN admin reset doesn't produce new-user state | QA — walk admin reset → re-login → onboarding | No QA walk of admin-reset feature pre-release |
| SN landing tile clicks dead (SAT/AP/PSAT) | QA — click each landing tile + REV — block unjustified allowlists | DEV batched failing E2E tests as "stale" without REV-level scrutiny |
| SN SAT track end-to-end broken | QA — full fresh-user SAT walk | No persona walk before promote |
| PL Jimmy hit broken Khan URL on Sociology Unit 5 | SRE — external-link rot monitoring | No periodic external-URL audit |
| PL SessionFeedback popup jumping between phases | QA — submit session → observe feedback dialog behavior | No interaction walk of post-session UX |
| PL trademark missing from landing footer | REV — chrome/layout changes get legal checklist | Reviewer-role checklist absent |
| PL 23 stale tests accumulated on master before deploy attempt | CI — every commit must run the full test suite | Tests only run at staging-deploy time |

**Common pattern:** the *QA persona walkthrough* — actually using the product as a real user in a real browser — was skipped on nearly every defect.

---

## Roles

| Role | Mandate | Outputs |
|---|---|---|
| **PO** Product Owner | Define the change + why + success criteria + rollback | Change-spec paragraph |
| **DEV** Developer | Implement; no scope creep | Code + tests + clean typecheck |
| **REV** Reviewer | Independent eye on the diff | Review verdict using checklist |
| **QA** QA Engineer | Walk the change as a real user | Persona Walkthrough Log at `data/qa-walks/YYYY-MM-DD-<change-id>.md` |
| **RM** Release Manager | Gate the deploy | Release Manifest signed at `data/release-manifests/<tag>.md` |
| **SRE** Site Reliability | Post-deploy monitoring + incident response | 30-min smoke log; defect tracker entry |

---

## Gates (must pass in order)

### G1. PO Gate
- [ ] Change spec exists: what / why / success criteria / rollback
- [ ] Rollback plan documented (which commit/tag to revert to)

### G2. DEV Gate
- [ ] `npx tsc --noEmit` clean
- [ ] Relevant unit/integration tests added or updated
- [ ] No new TODO/FIXME without an issue tracking it
- [ ] Commit message cites PO change-spec + names files touched

### G3. REV Gate — independent review of the diff
- [ ] Scope matches PO change-spec (no drive-by changes)
- [ ] Cross-cutting changes (schema, shared hooks, route handlers, deploy scripts, layout/chrome) had `Plan` or `code-review` agent run before merge
- [ ] **Failing tests in CI are NOT being allowlisted** — investigate + fix or delete obsolete tests with cited commit reason
- [ ] Legal/trademark notices preserved on marketing/footer/layout changes
- [ ] JWT-vs-DB desync risk checked for any auth/session/cookie change
- [ ] Cache-name / SW invalidation considered for client-state changes
- [ ] Cross-product changes: shared component touched → both repos verified

### G4. QA Gate — Persona Walkthrough (LOAD-BEARING)
**Real browser. Real clicks. Documented log.** This is the gate that catches what automated tests miss.

For every release touching user-facing surface:
- [ ] **Fresh user persona** — incognito, no cookies; sign up new email; walk the change's user journey end-to-end
- [ ] **Affected-track persona** — if change touches a specific track (AP/SAT/ACT/PSAT/CLEP), full fresh-user walk on THAT track including practice → submit → result
- [ ] **Existing-user persona** — sign in as established user; verify change doesn't break saved state
- [ ] Log every observation (positive AND negative) in `data/qa-walks/YYYY-MM-DD-<change-id>.md`
- [ ] **Any identified bug is a blocker** — back to DEV; no promote

Server-only change (no user-facing surface): walk waived but QA log must document why.

### G5. RM Gate
- [ ] `npm run pages:deploy:staging` passes
- [ ] Zero NEW failing tests not in the documented chronic-CF-cold-start allowlist
- [ ] Any allowlisted test has a dated `_note` citing the specific commit that removed the asserted behavior + P3 task to delete/rewrite
- [ ] QA Walk Log from G4 referenced in Release Manifest
- [ ] Release Manifest committed at `data/release-manifests/<tag>.md`
- [ ] Tag created (`beta-X.Y.Z` SN / `AXX.Y.Z` PL)
- [ ] `npm run pages:promote` run

### G6. SRE Gate (post-promote)
- [ ] Production smoke from `pages:promote` is green
- [ ] **30-minute watch** — monitor logs/sentry; nothing new firing
- [ ] User-reported defect within 24h → triage P0, root-cause to gate that missed it, update this doc

---

## Defect feedback loop

Every user-reported defect triggers:
1. **Root cause** — which gate missed it (G1–G6)?
2. **Process patch** — what specific check would have caught it? Add to that gate's checklist
3. **Memory entry** — if the lesson is general, write it to `memory/`

---

## Enforcement

| Layer | Mechanism |
|---|---|
| Durable rules | Memory entries in `memory/feedback_*` (read at every session start via MEMORY.md) |
| Repo docs | This file + `RELEASE_CHECKLIST.md` (version controlled) |
| Deploy gate | `scripts/pre-release-check.js` checks for `data/qa-walks/*` newer than prior tag AND `data/release-manifests/<tag>.md` exists |
| Promote gate | `scripts/deploy-promote.js` parses Release Manifest YAML; refuses if any G1–G5 gate is `pending` |
| Continuous | Nightly external-URL audit cron; Mon/Wed/Fri fresh-user smoke cron via GH Actions |

---

## Both products, same standard

`PL = SN`. Nothing here is product-specific. Edits must mirror between `AP_Help/docs/QUALITY_PROCESS.md` and `PrepLion/docs/QUALITY_PROCESS.md`.

---

## Last updated
2026-06-02 — v1 written in direct response to user goal after defect cluster (admin reset, tile clicks, SAT track, Khan URL, popup jump, trademark, stale tests) exposed missing QA persona walkthrough as the load-bearing gap.
