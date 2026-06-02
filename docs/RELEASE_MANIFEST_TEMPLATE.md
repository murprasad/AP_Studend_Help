# Release Manifest Template

Copy this template to `data/release-manifests/<tag>.md` for every release.
The promote script will refuse to run if any required gate is `pending`.

Companion to:
- `docs/QUALITY_PROCESS.md` — gate definitions (G1-G6)
- `docs/RELEASE_CHECKLIST.md` — pre-deploy technical checks (A.1-A.4)

---

## Frontmatter (YAML)

```yaml
---
release_tag: beta-X.Y.Z          # SN: beta-X.Y.Z   PL: AXX.Y.Z
product: SN                      # SN | PL
commit: <sha>
release_date: 2026-MM-DD
g1_po: pending                   # pending | approved
g2_dev: pending
g3_rev: pending
g4_qa: pending                   # MUST be approved before g5
g5_rm: pending
g6_sre: pending                  # filled in after promote
qa_walk_log: data/qa-walks/YYYY-MM-DD-<change-id>.md
---
```

---

## G1. PO — Change Spec

**What is changing?**

(one paragraph)

**Why now?**

(business / user / bug-fix rationale)

**Success criteria** — specific user-observable outcomes:

- [ ] (outcome 1)
- [ ] (outcome 2)

**Rollback plan:** revert to tag `<prior-tag>`. Time-to-restore: __ min.

---

## G2. DEV — Implementation

- [ ] `npx tsc --noEmit` clean
- [ ] Unit/integration tests added or updated (list specs)
- [ ] No new unowned TODO/FIXME
- [ ] Commit message cites change-spec + lists files touched

**Files touched:**

```
src/...
tests/...
```

---

## G3. REV — Independent Diff Review

- [ ] Scope matches PO spec; no drive-bys
- [ ] Cross-cutting change? `Plan` / `code-review` agent run — paste verdict: __
- [ ] No allowlisting new failing tests (per `failing-test-is-signal-not-noise`)
- [ ] Legal/trademark notices preserved (marketing/footer/layout)
- [ ] JWT-vs-DB desync risk checked (auth/session/cookie)
- [ ] SW cache name bumped if client-state contract changed
- [ ] Shared-component change: every consumer verified

**Reviewer notes:**

---

## G4. QA — Persona Walkthrough (LOAD-BEARING)

**Log path:** `data/qa-walks/YYYY-MM-DD-<change-id>.md`

- [ ] Fresh-user persona walked (incognito, new email): PASS / FAIL — _notes_
- [ ] Affected-track persona walked (track: __): PASS / FAIL — _notes_
- [ ] Existing-user persona walked (saved-state check): PASS / FAIL — _notes_
- [ ] All identified bugs fixed (or change blocked back to DEV)

**Server-only change?** justify walk waiver here: ________

---

## G5. RM — Release Gate

- [ ] `npm run pages:deploy:staging` PASSED — preview URL: __
- [ ] Zero NEW failing tests outside documented chronic-flake allowlist
- [ ] Any new allowlist entry has dated `_note` + cited commit + P3 task
- [ ] QA Walk Log path in frontmatter
- [ ] Tag created: `<tag>`
- [ ] `npm run pages:promote` run; production smoke green

---

## G6. SRE — Post-Promote Verification

- [ ] Production smoke from `pages:promote` green
- [ ] 30-minute watch — no new errors in logs/sentry
- [ ] No user-reported defect within 24h

**Post-promote notes:**

---

## Sign-off

By committing this manifest with all required boxes checked, I confirm each gate was actually executed as documented (not checked from memory).
