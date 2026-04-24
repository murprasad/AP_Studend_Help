# UX Backlog — after current testing/fix marathon completes

Items deliberately deferred until the persona test suite is green and the
April bug bundle ships. Do NOT pull forward unless user explicitly approves.

## UX-1 — Full-screen mode on every dashboard subpage (except /dashboard itself)

**Date added:** 2026-04-24
**Motivation:** Reduce clutter. Let users work in a focused, distraction-free
view while using a feature (practice, mock-exam, analytics, etc). Dashboard
itself stays normal (shows cards, streak, daily goal — the overview).

**Behavior:**
- Every authed sub-page except `/dashboard` renders in full-screen mode:
  sidebar hidden, header collapsed to just logo + "Return to Dashboard" link.
- Clicking "Dashboard" (the link, or navigating to `/dashboard`) exits
  full-screen mode and restores the regular sidebar + header.
- State is per-route, not a toggle — switching to another authed sub-page
  remains full-screen.

**Implementation notes (when the work lands):**
- `(dashboard)/layout.tsx` branches on `pathname === "/dashboard"` — render
  sidebar only for dashboard; otherwise the slimmer header with "Return to
  Dashboard" CTA.
- Need to verify every sub-page works without sidebar nav (e.g. mock-exam
  already hides the sidebar? double-check).
- Add matrix rows for full-screen vs normal view in Section 10.4.
- Visual regression baselines need to be retaken.

**Why deferred:** Testing the existing feature set must come first. This is
a UI restructure; shipping it before the 8-bug backlog is clean would stack
new test surface on top of unverified old surface.
