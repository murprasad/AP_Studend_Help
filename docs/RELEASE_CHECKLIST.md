# StudentNest Release Checklist

Source of truth for what has to hold before every `npm run pages:deploy`.
When a regression teaches us a new lesson, add a numbered item below so it
can't catch us again.

---

## Before every deploy

1. **Clean bundle.** `npm run pages:build` now calls `pages:clean` first —
   wipes `.open-next/`, `.cf-deploy/`, and `.next/`. Do not comment it out.
   (See incident 2026-04-18 at the bottom of this doc.)

2. **`npx tsc --noEmit`** passes. Must exit 0.

3. **Schema migrations applied.** If `prisma/schema.prisma` changed since
   the last deploy, run `npx prisma db push` against prod BEFORE the
   deploy runs (so the deployed code doesn't try to read columns that
   don't exist yet).

4. **Env vars exist** on Cloudflare Pages for every secret referenced
   at runtime: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`,
   `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

5. **Service worker strategy reviewed.** `public/sw.js` is network-only
   as of v5. If you switch to cache-first for any route, bump the
   `CACHE_NAME` version string so old clients purge their cache on
   activation. Cache-first + stale cache = users stuck on broken bundle.
   (See incident 2026-04-18.)

6. **`_routes.json` covers all public/ files.** `scripts/prepare-cf-deploy.js`
   currently excludes `/sw.js`, `/manifest.webmanifest`, `/favicon.ico`,
   `/robots.txt`, `/sitemap.xml`, `/og-image.svg`, `/icons/*`, `/fonts/*`,
   `/images/*` from the worker route. When adding new static files to
   `public/`, add them to the exclude list or they'll 404 through the
   worker handler.

7. **Prisma generate uses the engine (no `--no-engine` flag)** on
   production builds. `--no-engine` makes the client require a
   `prisma://` URL (Accelerate); our prod uses a direct Neon HTTP URL.
   The flag will silently poison the deploy — server components throw
   at request time. (See incident 2026-04-18.)

8. **Post-deploy smoke** — visit at least `/`, `/login`, `/dashboard`
   (expect 307 redirect to signin when unauth), and `/api/auth/csrf`
   (expect 200). If any of these return 400 or 500 you've likely
   deployed a stale/mixed bundle — redeploy with `pages:clean` first.

9. **Post-deploy service worker check** — `curl https://studentnest.ai/sw.js`
   should return 200 and match `public/sw.js` byte-for-byte. If it's 404
   or stale, `_routes.json` regressed.

---

## Before every release (tag cut)

10. **Requirements ledger updated** — every new REQ-### has an entry in
    `docs/REQUIREMENTS_LEDGER.md`.

11. **Test plan rerun** — `docs/COMPREHENSIVE_TEST_PLAN.md` Section A
    (Real Student Journey) walked end-to-end on a reset test user
    (`murprasad+std@gmail.com`). Admin `/admin?tab=test-users` → Reset
    before each walk.

12. **Negative/positive test ratio** — any new feature ships with ≥3
    negative tests per positive test (project policy).

13. **Git tag at a deployable commit** — do not tag a commit where
    `.cf-deploy/` would contain mixed artifacts.

---

## Incident log (why each rule above exists)

### 2026-04-18 — Stale bundle → NextAuth ERR_FAILED

**Symptom:** user reported `https://studentnest.ai/dashboard` → ERR_FAILED
in Chrome (including Incognito). `/api/auth/csrf` returned 400.

**Root cause:** Multiple `npm run pages:deploy` runs during the session
did NOT rebuild cleanly. `.cf-deploy/` contained a mix of an ancient
`_worker.js` (Mar 12) alongside newer Next.js server functions. The
worker loaded first and couldn't resolve NextAuth API handler routes,
so every `/api/auth/*` request returned 400.

The pre-release-check script returned exit 0 despite silent prisma
generate failures earlier in the session (Windows DLL-lock EPERM
during concurrent bulk-gen jobs), so the pipeline shipped a stale
bundle several times in a row.

**Fix (mechanical):** `pages:build` now starts with `pages:clean` —
`rm -rf .open-next .cf-deploy .next`. Every build is guaranteed fresh.

**Fix (detective):** rule #8 post-deploy smoke — catches a stale
bundle within 30 seconds of deploy completion.

**Don't try to avoid re-generating by using `prisma generate --no-engine`.**
That's what caused rule #7. The `--no-engine` flag only works with
Prisma Accelerate (`prisma://` URLs); our prod uses direct Neon HTTP.
If you hit the DLL-lock, either wait for the bulk-gen job to finish,
or `mv node_modules/.prisma/client/query_engine-windows.dll.node
    node_modules/.prisma/client/query_engine-windows.dll.node.old`
to free the file name (Windows allows rename of in-use files) and
re-run `prisma generate`.

---

## Emergency recovery

Site is down (ERR_FAILED, 500s, infinite loops):

1. Verify the symptom. `curl -I https://studentnest.ai/` — if the root
   returns anything but 200, the deploy is bad.
2. `curl https://studentnest.ai/api/auth/csrf` — if not 200, NextAuth
   didn't survive the deploy. Almost always a stale bundle.
3. Clean rebuild locally:
   ```bash
   cd C:/Users/akkil/project/AP_Help
   rm -rf .open-next .cf-deploy .next
   mv node_modules/.prisma/client/query_engine-windows.dll.node node_modules/.prisma/client/query_engine-windows.dll.node.old  # if gens are holding it
   npm run pages:build
   npx wrangler pages deploy .cf-deploy --project-name=studentnest --commit-dirty=true
   ```
4. Re-run the smoke test (rule #8).
5. If the issue is a cached broken SW on existing users' browsers,
   bump `CACHE_NAME` in `public/sw.js` and redeploy — the new SW's
   activate handler purges all old caches.
