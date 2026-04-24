# Security audit — API endpoint authorization gaps (2026-04-24)

## Context
Probed all 58 enumerable `/api/*` endpoints anonymously against
`https://studentnest.ai`. Goal: confirm every route returns 401/403/405 for
anonymous callers unless there's a legitimate reason to be public.

## Findings

### ✅ Correctly gated (49 routes)
All user-scoped, admin, and cron routes return 401/403/405 for anonymous.

### ✅ Intentionally public (6 routes)
| Route | Reason |
|-------|--------|
| `/api/auth/providers` | NextAuth requires unauthed access |
| `/api/auth/csrf` | NextAuth CSRF token distribution |
| `/api/leaderboard` | Public top-10 (2026-04-24 fix — personal rank gated) |
| `/api/feature-flags` | Client needs flags before sign-in |
| `/api/ai/status` | Public health probe |
| `/api/sage-coach/health` | Public health probe |

### 🔴 Real gaps requiring fix

#### SEC-1 — `/api/sage-coach/probe` — cost / resource abuse (HIGH)
Anonymous GET can trigger OpenRouter + Groq calls (step=3,4) and DB writes
(step=5). An attacker could run up AI-provider bills.
**Status:** ✅ FIXED in uncommitted edit — now gates on CRON_SECRET like
other diagnostic endpoints.
**File:** `src/app/api/sage-coach/probe/route.ts`

#### SEC-2 — `/api/auth/check-verified` — user enumeration (MEDIUM)
`GET /api/auth/check-verified?email=anyone@example.com` returns
`{verified: true|false}`. Attacker can enumerate which emails are
registered + verified in our system. Signal:
- `{verified: true}`  → email is registered AND verified
- `{verified: false}` → email is registered-unverified OR not registered
Both responses return in < 500ms, bulk enumeration trivial.

**Constraint:** this endpoint is polled by the /register page waiting for
the verification email — can't fully lock. Need rate-limit per IP.

**Planned fix:** add `rateLimit(ip, "auth:check-verified", 10)` per minute.
Legitimate users: 1–3 polls during verify. Attackers: effectively blocked
after 10 emails/min per IP.
**File:** `src/app/api/auth/check-verified/route.ts`
**Status:** ⏳ pending

#### SEC-3 — `/api/user/conversion-signal` — API contract drift (LOW)
Anonymous call returns `{responseCount: 0, hasDiagnostic: false, hasTrial: false}`
(a 200 with placeholder) instead of 401. No actual data leak — the numbers
are invariant for anonymous callers. But it breaks the "user-scoped routes
return 401" convention the rest of the auth API follows.

**Planned fix:** return `401 {error: "Unauthorized"}` for anonymous.
**File:** `src/app/api/user/conversion-signal/route.ts`
**Status:** ⏳ pending

### ⚪ Intentional-but-worth-documenting

#### `/api/daily-quiz-track` (email attribution pixel)
Anonymous GET returns a 1×1 transparent GIF (for `event=open`) or JSON
(for `event=answer`). Must be public because email clients fetch the
pixel without cookies. Implicit auth via random UUID email tokens.
**Verdict: CORRECT, no fix needed.** Added comment clarifying.

## Deploy plan

User direction: fix real findings, deploy in evening.

1. ✅ **SEC-1** sage-coach/probe — already edited, ready to commit
2. ⏳ **SEC-2** check-verified rate-limit — small change, next
3. ⏳ **SEC-3** conversion-signal 401 — trivial, last

All three can ship in one commit OR three small commits (user preference:
one at a time).

## Crash-recovery notes

If the work is interrupted:
- Current uncommitted changes: `src/app/api/sage-coach/probe/route.ts`
  (CRON_SECRET gate added)
- To verify uncommitted state: `git diff src/app/api/sage-coach/probe/route.ts`
- The audit findings above are authoritative; re-running the probe
  (see repro commands below) will reconfirm.

### Repro commands
```bash
# Probe any single endpoint anonymously
curl -s -o /dev/null -w "%{http_code}\n" https://studentnest.ai/api/sage-coach/probe?step=1

# Bulk probe
for p in /api/auth/check-verified /api/user/conversion-signal /api/daily-quiz-track /api/sage-coach/probe; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' "https://studentnest.ai$p") $p"
done
```
