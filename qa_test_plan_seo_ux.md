# Comprehensive Test Plan — SEO, UX & Engagement Improvements
**Date:** 2026-03-21 | **Build:** Post Beta 2.2 SEO/UX sprint

---

## Pre-Test Setup
- Run `npm run dev` on localhost:3000
- Open Chrome DevTools (F12)
- Have mobile device simulation ready (375px iPhone SE, 390px iPhone 14)

---

## SECTION 1 — Schema.org JSON-LD (SEO Rich Snippets)

### Test Method
View page source (Ctrl+U) or Elements tab → search for `application/ld+json`

| # | Page | Check | Expected |
|---|------|-------|----------|
| 1.1 | `/ap-prep` | JSON-LD script tag present | `<script type="application/ld+json">` with `@type: "ItemList"` |
| 1.2 | `/ap-prep` | Course count | 10 items in `itemListElement` |
| 1.3 | `/ap-prep` | Each course has required fields | `name`, `description`, `provider.name="StudentNest AI"`, `isAccessibleForFree: true`, `offers` array |
| 1.4 | `/ap-prep` | `<title>` tag | "AP Exam Prep — AI Practice & Tutoring \| StudentNest AI" |
| 1.5 | `/ap-prep` | `og:title` meta tag | "AP Exam Prep \| StudentNest AI" |
| 1.6 | `/ap-prep` | `og:url` meta tag | "https://studentnest.ai/ap-prep" |
| 1.7 | `/sat-prep` | JSON-LD with 2 SAT courses | `@type: "ItemList"`, 2 items (SAT Math, SAT Reading & Writing) |
| 1.8 | `/sat-prep` | `<title>` tag | "SAT Prep — AI Practice & Score Tracking \| StudentNest AI" |
| 1.9 | `/act-prep` | JSON-LD with 4 ACT sections | `@type: "ItemList"`, 4 items (Math, English, Science, Reading) |
| 1.10 | `/act-prep` | `<title>` tag | "ACT Prep — AI Practice for All 4 Sections \| StudentNest AI" |
| 1.11 | `/clep-prep` | JSON-LD with 6 CLEP exams | `@type: "ItemList"`, 6 items with savings amounts in descriptions |
| 1.12 | `/clep-prep` | `<title>` tag | "CLEP Exam Prep — Earn College Credit with AI \| StudentNest AI" |
| 1.13 | `/clep-prep` | Savings in descriptions | Each course description mentions "save $1,200" (or $2,400 for Composition) |
| 1.14 | `/pricing` | FAQPage JSON-LD present | `@type: "FAQPage"` with `mainEntity` array |
| 1.15 | `/pricing` | FAQ count | 7 Question items |
| 1.16 | `/pricing` | FAQ content accuracy | Q1=multi-module, Q2=cancel, Q3=annual, Q4=refund (7-day), Q5=free limit, Q6=student discount, Q7=payment methods |
| 1.17 | `/pricing` | `<title>` tag | "Pricing — Free & Premium Plans \| StudentNest AI" |
| 1.18 | All prep pages | Provider URL | `"url": "https://studentnest.ai"` in every Course's provider |
| 1.19 | All prep pages | Offer prices | Free=$0, Premium=$9.99 with billingIncrement="P1M" |

### Google Rich Results Validation
| 1.20 | `/ap-prep` | Paste page URL into Google Rich Results Test | No errors; Course items detected |
| 1.21 | `/pricing` | Paste page URL into Google Rich Results Test | FAQPage detected with 7 questions |

---

## SECTION 2 — OG Image (Social Sharing)

### Test Method
Check `<meta property="og:image">` in page source, or use social debugger tools

| # | Page | Check | Expected |
|---|------|-------|----------|
| 2.1 | `/` (home) | `og:image` meta tag present | Points to `/opengraph-image` route |
| 2.2 | `/opengraph-image` | Direct URL access | Returns a 1200x630 PNG image |
| 2.3 | `/opengraph-image` | Image content | Shows "StudentNest AI" logo, tagline, 3 feature pills (22 Courses, AI Tutoring, Free to Start), "studentnest.ai" URL at bottom |
| 2.4 | `/opengraph-image` | Image style | Dark gradient background (slate/indigo), white/light text |
| 2.5 | Share `/` on Discord/Slack | Preview card appears | Large image card with title + description + image |
| 2.6 | Share `/ap-prep` on Discord | Preview card | Inherits root OG image + shows AP prep title/description |
| 2.7 | `twitter:card` meta tag | Value is "summary_large_image" | Large card format for Twitter/X shares |

---

## SECTION 3 — Mobile Sticky CTA

### Test Method
Open landing page in Chrome DevTools mobile simulation (375px width)

| # | Action | Check | Expected |
|---|--------|-------|----------|
| 3.1 | Load `/` on mobile (375px) | Initial state | NO sticky bar visible (hero CTAs in viewport) |
| 3.2 | Scroll down past hero (~600px) | Sticky bar appears | Fixed bottom bar with 2 buttons: "Start Free" (indigo) + "CLEP Prep" (emerald) |
| 3.3 | Tap "Start Free" button | Navigation | Goes to `/register?track=ap` |
| 3.4 | Tap "CLEP Prep" button | Navigation | Goes to `/register?track=clep` |
| 3.5 | Scroll back up to top | Sticky bar hides | Bar disappears when hero is visible again |
| 3.6 | Resize to desktop (>768px) | Bar hidden | `md:hidden` class hides the bar |
| 3.7 | Resize back to mobile (<768px) | Bar appears (if scrolled) | CSS media query responsive |
| 3.8 | Check z-index layering | No overlap with navbar | Navbar (z-50) sits above sticky CTA (z-40) |
| 3.9 | Dark mode | Visual check | Background blur + border visible in dark theme |
| 3.10 | Light mode | Visual check | Background blur + border visible in light theme |
| 3.11 | Rapid scrolling | No jank/lag | Passive scroll listener prevents jank |

---

## SECTION 4 — Touch-Friendly Answer Buttons

### Test Method
Open practice/mock-exam/diagnostic in mobile simulation or real device

| # | Page | Check | Expected |
|---|------|-------|----------|
| 4.1 | `/practice` — start MCQ session | Answer button height | Each option button >= 48px tall (`min-h-[48px]`) |
| 4.2 | `/practice` | Text readability | `leading-relaxed` line height on option text |
| 4.3 | `/practice` | Long option text | Text wraps properly, button expands vertically |
| 4.4 | `/practice` | Tap accuracy on mobile | Easy to tap correct option without misclicks |
| 4.5 | `/practice` | Selected state | Indigo border + bg when tapped |
| 4.6 | `/practice` | Correct answer feedback | Green border/bg on correct option |
| 4.7 | `/practice` | Wrong answer feedback | Red on selected wrong, green on correct, faded on others |
| 4.8 | `/mock-exam` — start timed exam | Same checks as 4.1-4.7 | Same behavior in mock exam context |
| 4.9 | `/diagnostic` — start diagnostic | Same checks | Same min-h-[48px] + leading-relaxed |
| 4.10 | `/diagnostic` | Answer selection highlight | Indigo border/bg on selected option |
| 4.11 | Desktop (1024px+) | No visual regression | Buttons look normal, not oversized |

---

## SECTION 5 — "StudentNest AI" Brand Consistency

### Test Method
Visual scan + Ctrl+F for "StudentNest" on each page

| # | Page | Location | Expected Text |
|---|------|----------|---------------|
| 5.1 | `/` (home) | Footer copyright | "© 2025 StudentNest AI. Your AI Study Partner." |
| 5.2 | `/` (home) | Footer trademark | "...endorses StudentNest." (entity name, OK as-is) |
| 5.3 | `/about` | Page heading | "About StudentNest AI" |
| 5.4 | `/about` | Body copy | "StudentNest exists to change that..." (OK — body copy uses short name) |
| 5.5 | Marketing layout footer | Copyright | "© 2026 StudentNest AI — independent educational platform." |
| 5.6 | `/ap-prep` | Trademark disclaimer | "not affiliated with StudentNest" (entity name, OK) |
| 5.7 | `/sat-prep` | Trademark disclaimer | Same pattern |
| 5.8 | `/act-prep` | Trademark disclaimer | Same pattern |
| 5.9 | `/clep-prep` | Trademark disclaimer | Same pattern |
| 5.10 | Root `<title>` | Browser tab | "StudentNest AI — AP, SAT, ACT & CLEP Exam Prep" |
| 5.11 | `og:site_name` | Meta tag | "StudentNest AI" |

---

## SECTION 6 — Daily Goal Nudge (GoalCard)

### Test Method
Log in as test user, navigate to `/dashboard`

| # | Action | Check | Expected |
|---|--------|-------|----------|
| 6.1 | Dashboard with NO goal set | GoalCard state | Dashed border button: "Set a target score" |
| 6.2 | Click "Set a target score" | Goal picker appears | 3 buttons: "Score 5", "Score 4", "Score 3" (AP track) |
| 6.3 | Click "Score 5" | Goal set + daily progress | Card shows "Your target: Score 5" + "Today: 0/10 questions" with empty progress bar |
| 6.4 | Answer 5 questions (practice) | Return to dashboard | "Today: 5/10 questions" with 50% filled progress bar |
| 6.5 | Answer 5 more (total 10) | Daily target reached | "Today: 10/10 questions" + green bar + "Done!" label + CheckCircle icon |
| 6.6 | Answer 15 total | Over target | "Today: 15/10 questions" + bar capped at 100% (no overflow) |
| 6.7 | Click X to clear goal | Goal removed | Returns to "Set a target score" dashed button |
| 6.8 | CLEP track user | Goal options | "Pass CLEP exam", "Score 60+", "Score 70+" |
| 6.9 | CLEP track user | Card colors | Emerald accent (not indigo) |
| 6.10 | AP track user | Card colors | Indigo accent |
| 6.11 | Switch course | Goal persists per course | Each course has its own `goal_{course}` in localStorage |
| 6.12 | Private browsing | localStorage fallback | Goal card works but goal won't persist (try-catch handles error) |
| 6.13 | Course filter | Daily count accuracy | Only counts questions from the currently selected course, not all courses |

---

## SECTION 7 — Landing Page Footer

| # | Check | Expected |
|---|-------|----------|
| 7.1 | "Sign Up Free" link in footer | Goes to `/register` (no track param — user chooses during onboarding) |
| 7.2 | All other footer links work | About → /about, Pricing → /pricing, Log In → /login, Terms → /terms, Privacy → /privacy |

---

## SECTION 8 — Cross-Page Regression

| # | Page | Check | Expected |
|---|------|-------|----------|
| 8.1 | `/` (home) | All CTAs work | "Start AP/SAT/ACT Prep", "Start CLEP Prep", etc. navigate correctly |
| 8.2 | `/` (home) | Interactive demo loads | AP/CLEP toggle works, answer feedback appears |
| 8.3 | `/` (home) | Testimonials visible | 3 testimonials rendered |
| 8.4 | `/` (home) | Comparison table | StudentNest vs ChatGPT vs Private Tutor table present |
| 8.5 | `/` (home) | "For Parents" section | 4 trust cards with parent-focused messaging |
| 8.6 | `/pricing` | Module tabs work | AP/SAT/ACT/CLEP tabs switch content correctly |
| 8.7 | `/pricing` | Monthly/Annual toggle | Prices switch ($9.99/mo ↔ $79.99/yr) |
| 8.8 | `/pricing` | Checkout forms POST | Forms submit to `/api/checkout?plan=monthly&module=X` |
| 8.9 | All prep pages | CTA buttons work | "Start Free" → `/register?module=X`, "See Pricing" → `/pricing` |
| 8.10 | All prep pages | Trademark disclaimers present | Bottom of each page |
| 8.11 | `/privacy` | Page renders | Full privacy policy with 11 sections |
| 8.12 | `/sitemap.xml` | Sitemap renders | XML with all public URLs |
| 8.13 | `/robots.txt` | Robots.txt renders | Allows `/`, disallows `/api/`, `/admin/`, dashboard routes |

---

## SECTION 9 — Build & Deploy Verification

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 9.1 | TypeScript | `npx tsc --noEmit` | No errors |
| 9.2 | Next.js build | `npx next build` | All 45 pages build, 0 errors |
| 9.3 | Static pages | Build output | `/ap-prep`, `/sat-prep`, `/act-prep`, `/clep-prep`, `/pricing`, `/privacy` all static (○) |
| 9.4 | OG image route | Build output | `/opengraph-image` listed as dynamic (ƒ) |
| 9.5 | Sitemap | Build output | `/sitemap.xml` listed as static (○) |

---

## Bugs Found & Fixed During Testing

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| B1 | Dynamic Tailwind classes in GoalCard (`bg-${accentColor}-500`) won't compile in production | CRITICAL | Replaced with static ACCENT class map object |
| B2 | `todayQuestionCount` query counted all courses, not just selected course | HIGH | Added `session: { course: selectedCourse }` filter |
| B3 | OG image used `position: "absolute"` (fragile in Satori renderer) | MEDIUM | Replaced with `marginTop: "auto"` flexbox pattern |
| B4 | Footer "Sign Up Free" link hardcoded `?track=ap` | LOW | Changed to `/register` (no track — user selects during onboarding) |

---

## Test Results Summary

| Section | Tests | Status |
|---------|-------|--------|
| 1. JSON-LD | 21 | Ready to verify |
| 2. OG Image | 7 | Ready to verify |
| 3. Mobile Sticky CTA | 11 | Ready to verify |
| 4. Touch-Friendly Buttons | 11 | Ready to verify |
| 5. Brand Consistency | 11 | Ready to verify |
| 6. Daily Goal Nudge | 13 | Ready to verify |
| 7. Footer Links | 2 | Ready to verify |
| 8. Cross-Page Regression | 13 | Ready to verify |
| 9. Build Verification | 5 | **PASSED** (tsc clean, build clean, 45 pages) |
| **Total** | **94** | |
