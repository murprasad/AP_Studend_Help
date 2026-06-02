# QA Persona Walkthrough Template

Copy this file to `data/qa-walks/YYYY-MM-DD-<change-id>.md` and fill out as you walk the change. The pre-release-check (G4) gate looks for a fresh log here (≤24h old).

> See `docs/QUALITY_PROCESS.md` Gate G4 for when a walk is required.

---

```yaml
---
walk_date: 2026-MM-DD
change_id: <commit-sha or feature-slug>
walker: <name or "Claude (DEV+QA hat)">
staging_url: https://staging.studentnest.pages.dev   # or PL preview
product: SN                                          # SN | PL
personas_walked: [fresh-user, affected-track, existing-user]
verdict: PASS                                        # PASS | FAIL | BLOCKED-BY-INFRA
---
```

---

## What's the change?

(one paragraph — pulled from the Release Manifest G1)

---

## Personas

### 1. Fresh user (anonymous → registered → first session)

- **Browser:** incognito (no cookies/localStorage)
- **Email:** `qa-walk-fresh-<ts>@test.studentnest.ai`
- **Track:** _AP / SAT / ACT / PSAT / CLEP_

Walk steps:

| # | Action | Expected | Observed | Pass/Fail |
|---|---|---|---|---|
| 1 | Visit landing | Hero + 4 product tiles | | |
| 2 | Click tile relevant to change | Lands on /<track>-prep | | |
| 3 | Click "Start free" / register CTA | /register loads | | |
| 4 | Sign up with fresh email | Lands on /journey | | |
| 5 | Pick course relevant to change | Diagnostic starts | | |
| 6 | Answer 1-2 Qs | Submit succeeds | | |
| 7 | Reach dashboard | No error toasts | | |
| 8 | Start a practice | Q renders | | |
| 9 | Submit answer | No "unable to submit" | | |

### 2. Affected-track persona

If the change touches a specific track, repeat the fresh-user walk on THAT track end-to-end. Don't skip just because the AP walk passed.

### 3. Existing user (saved state check)

- **Test user:** `murprasad+std@gmail.com` (AP slot) or one of the `+sat`, `+act`, `+appass` slots
- Sign in, walk dashboard → practice → submit, verify saved state intact

---

## Findings

### Pass

(list what worked as expected)

### Fail / blockers

(any bug found → must be fixed before promote, OR change blocked back to DEV)

### Surprises (non-blocking)

(things that surprised you — even positive — worth flagging)

---

## Network observations

(any 4xx/5xx in the DevTools network panel? List + status code)

---

## Console errors

(any pageerror or console.error in the browser? List first 5)

---

## Screenshots / video

(optional but encouraged — paste paths or links)

---

## Verdict

- [ ] PASS — change is safe to promote
- [ ] FAIL — change has user-impacting bugs, BLOCK promote
- [ ] BLOCKED-BY-INFRA — walk couldn't complete due to tooling issues (document why, escalate; do NOT use this as a default)

## Rollback plan

(if FAIL after promote — exact command + estimated time-to-restore)
