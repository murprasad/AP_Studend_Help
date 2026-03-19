# QA Test Plan — StudentNest Beta 1.5

**Date:** March 2026
**Scope:** Beta 1.5 — AI Knowledge Check, Disclaimer Cleanup, Analytics Comprehension Stat
**Tester:** QA / Dev
**Build:** `npm run build` → `npm run pages:deploy`

---

## Defects Found & Fixed (Beta 1.5 cycle)

| ID | Severity | Component | Description | Fix |
|----|----------|-----------|-------------|-----|
| D1 | Medium | `knowledge-check.tsx` | Race condition: if user sent new message while questions were loading, `setState("answering")` still fired after reset | Added `snapshot` guard — discard fetch result if `tutorResponse` changed |
| D2 | Low | `sidebar.tsx` | Disclaimer text at `text-[9px] text-muted-foreground/40` was invisible in light mode (near-zero contrast) | Removed from sidebar entirely — About page + marketing footer are sufficient |
| D3 | Low | `about/page.tsx` | Version badge showed "Beta 1.41" not "Beta 1.5" | Updated badge |
| D4 | Low | `about/page.tsx` | Disclaimer card used amber/yellow warning styling — visually alarming, poor UX | Replaced with subtle `text-[11px] text-muted-foreground/70` footer section |
| D5 | Low | `(marketing)/layout.tsx` | Footer disclaimer lacked nav links; hard to find About/Pricing from public pages | Added footer nav row (Contact · About · Pricing) |

---

## Legal Evaluation — Disclaimer Placement

**Question:** Is a disclaimer required on every authenticated screen?

**Answer:** No. Under US trademark law (Lanham Act, 15 U.S.C. § 1125), the obligation is to avoid *likelihood of confusion* with the trademark owner. Disclaimer placement requirements:

| Location | Required? | Rationale |
|----------|-----------|-----------|
| Landing page footer | ✅ Yes | Public-facing; potential customers may confuse the product with an official College Board service |
| Pricing page footer | ✅ Yes | Commercial transaction context — high-risk for confusion |
| About page (full text) | ✅ Yes | Primary legal disclosure location; complete trademark attribution |
| Dashboard sidebar | ❌ No | Authenticated users; they registered knowingly; sidebar disclaimer was invisible anyway |
| Every dashboard page | ❌ No | Not required — About page link is accessible from sidebar nav |
| Auth pages (login/register) | ⚠️ Optional | Low-risk; user is in registration flow; omitted for now |

**Conclusion:** About page (full) + marketing footer (condensed) = sufficient US legal protection.

---

## Test Areas

### 1. AI Knowledge Check (new feature)

| # | Test Case | Expected | Pass/Fail |
|---|-----------|----------|-----------|
| 1.1 | Ask Sage any question; wait for response | "Check your understanding" button appears below follow-up chips | |
| 1.2 | Click button before Sage finishes responding | Button only appears when `!isStreaming` | |
| 1.3 | Click "Check your understanding" | Spinner + "Generating questions…" for ~1-2s | |
| 1.4 | Questions load | Shows "Question 1 of 3" with 4 option buttons and progress dots | |
| 1.5 | Select correct answer | Green ✓ icon on chosen option, explanation shown, "Next question" button | |
| 1.6 | Select wrong answer | Red ✗ on chosen option, green ✓ on correct option, explanation shown | |
| 1.7 | Complete all 3 questions | Score badge "X / 3" + message appears | |
| 1.8 | Score 3/3 | "Perfect! You've mastered this concept." | |
| 1.9 | Score 2/3 | "Good understanding — review the one you missed" | |
| 1.10 | Score 0-1/3 | "Let's revisit this concept — try asking Sage a follow-up" | |
| 1.11 | Send new message after completing quiz | Knowledge check resets to idle (button reappears) | |
| 1.12 | Click button, then immediately send new message | Loading state resolves to idle (not to answering) | |
| 1.13 | Check DB after completion | `tutor_knowledge_checks` row created with correct score, answers, course | |
| 1.14 | Mobile layout | Button + quiz renders correctly in single-column mobile view | |
| 1.15 | Groq unavailable (simulate by bad key) | Falls back to Pollinations; questions still load (~5s) | |
| 1.16 | Both providers fail | Button returns to idle silently (no crash, no error modal) | |

### 2. Analytics — Tutor Comprehension Card

| # | Test Case | Expected | Pass/Fail |
|---|-----------|----------|-----------|
| 2.1 | Visit analytics with 0 checks taken | Comprehension card does NOT appear | |
| 2.2 | Complete 1+ knowledge checks, visit analytics | "Tutor Comprehension" card appears with % and count | |
| 2.3 | Score 3/3 on all checks | Shows 100% | |
| 2.4 | Mix of scores (e.g. 1+2+3 = 6/9) | Shows 67% | |
| 2.5 | Change course in analytics | Card reflects that course's checks only | |

### 3. Disclaimer Cleanup

| # | Test Case | Expected | Pass/Fail |
|---|-----------|----------|-----------|
| 3.1 | Open sidebar in dark mode | No disclaimer text visible in sidebar footer | |
| 3.2 | Open sidebar in light mode | No disclaimer text visible in sidebar footer | |
| 3.3 | Visit /about | Full disclaimer at bottom as subtle gray text (not amber card) | |
| 3.4 | Visit /about in light mode | Disclaimer text is readable (muted-foreground/70 contrast OK) | |
| 3.5 | Visit landing page footer | Condensed disclaimer + footer nav links (Contact · About · Pricing) | |
| 3.6 | Visit landing page footer in light mode | Disclaimer text visible (not washed out) | |
| 3.7 | Version badge on /about | Shows "Beta 1.5" | |

### 4. Regression — Core Features

| # | Test Case | Expected | Pass/Fail |
|---|-----------|----------|-----------|
| 4.1 | AI Tutor — ask question (streaming) | Response streams, follow-up chips appear | |
| 4.2 | AI Tutor — non-streaming fallback | Response loads, follow-up chips appear | |
| 4.3 | Practice — start MCQ session | Session loads with questions | |
| 4.4 | Practice — submit answer | Correct/wrong feedback, XP updated | |
| 4.5 | Mock exam — start and complete | Timer counts down, score calculated | |
| 4.6 | Analytics — mastery chart | Bar chart loads for selected course | |
| 4.7 | Study plan — load | Plan displays (static if <20 answers) | |
| 4.8 | Dark/light mode toggle | Theme switches, persists on reload | |
| 4.9 | Course switcher (sidebar) | Changes course globally across all pages | |
| 4.10 | Google OAuth login | Signs in, creates/finds user, redirects to dashboard | |
| 4.11 | Credentials login | Signs in with email+password | |
| 4.12 | Admin page (/admin) | Loads for ADMIN role, 403 for STUDENT | |

### 5. Cross-Course Spot Check (Knowledge Check)

| Course | Ask topic | Questions generated | Pass/Fail |
|--------|-----------|---------------------|-----------|
| AP World History | Silk Road trade networks | ✓ 3 MCQs | |
| AP Calculus AB | Derivatives | ✓ 3 MCQs | |
| AP Biology | Cell respiration | ✓ 3 MCQs | |
| SAT Math | Linear equations | ✓ 3 MCQs | |
| ACT Science | Data interpretation | ✓ 3 MCQs | |

---

## Build & Deploy Checklist

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → clean (no TS/module errors)
- [ ] `npx prisma db push` → schema in sync (already done)
- [ ] `npm run pages:deploy` → CF Pages deploy succeeds
- [ ] Visit https://studentnest.ai/about → Beta 1.5 badge visible
- [ ] Visit https://studentnest.ai → footer disclaimer present
- [ ] Open dashboard sidebar → no disclaimer text
- [ ] Ask Sage a question → "Check your understanding" button appears

---

## Sign-off

| Check | Status |
|-------|--------|
| All P0/P1 defects fixed | ✅ |
| TypeScript clean | ✅ |
| Build clean | pending deploy |
| Manual smoke test | pending |
