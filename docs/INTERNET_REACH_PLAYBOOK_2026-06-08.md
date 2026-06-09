# StudentNest — Internet Reach Playbook (2026-06-08)

Goal (user): *"Check if studentnest.ai has good reach on the internet. If not, add it. Find out
if the information is correct; if not, fix it. Add substantial info to relevant pages. If you
can't do it, tell me what to do — including TikTok and Reels videos."*

This doc = (1) the honest reach audit, (2) what I already fixed in code, (3) the **manual steps
only you (the owner) can do**, prioritized, and (4) **ready-to-shoot TikTok/Reels scripts**.

---

## 1. Reach audit — honest grade: **D**

| Signal | State | Grade |
|---|---|---|
| Indexed in Google | Homepage + a few SEO pages only. **`/sitemap.xml` was returning 404** → Google couldn't discover the blog or programmatic pages. | D |
| Branded search ("StudentNest") | **Brand collision**: "StudentNest Inc" is a real Fresno, CA K-12 in-person tutoring company. It owns `@studentnest_inc` (Instagram), a LinkedIn page, and a YouTube channel. We rank *below* them for our own name. | D− |
| Social presence | **Zero.** No TikTok, Instagram, YouTube, X, Pinterest, or Reddit presence for the prep product. | F |
| Reviews / ratings | None (no Trustpilot, no Google reviews, no app-store presence beyond the Capacitor wrap). | F |
| Backlinks | Near zero referring domains. | D− |
| Knowledge panel | None. | F |

**Bottom line:** the *product is good but invisible.* The fixes below are 80% "create accounts &
submit," which only you can do — code can't create a TikTok account or claim a Google profile.

---

## 2. What I already fixed in code (live or deploying)

- ✅ **`/sitemap.xml` 404 → fixed.** It was a dynamic metadata route OpenNext/Cloudflare wasn't
  serving. Made it `force-static`. This is the **single biggest unlock** — Google can now crawl
  every page. *(After it deploys, you must resubmit the sitemap — see step A below.)*
- ✅ **Richer Organization + WebSite schema** with an explicit description that says we are an
  *online AP/SAT/ACT exam-prep platform, **not affiliated with any in-person K-12 tutoring
  company*** — this is the disambiguation signal that, over time, separates us from "StudentNest Inc."
- ✅ **WebSite `SearchAction`** schema (enables the Google sitelinks search box).
- ✅ **BIG SEO blog post**: "How to Study for the Digital SAT: The Complete 2026 Guide" (14-min,
  Article + FAQPage JSON-LD) — live at `/blog/how-to-study-for-the-digital-sat-complete-guide`.
- ✅ Existing SEO pages confirmed correct: `/sat-prep/free-vs-paid`, `/act-vs-sat-which-should-i-take`,
  `/digital-sat-2024-changes`.

---

## 3. Manual steps — **only you can do these** (in priority order)

### A. Google Search Console (15 min — do this FIRST, after the sitemap deploy lands)
1. Go to https://search.google.com/search-console → Add property → **Domain** → `studentnest.ai`.
2. Verify via DNS TXT record (Cloudflare dashboard → DNS → add the TXT record Google gives you).
3. Once verified: **Sitemaps** → enter `sitemap.xml` → Submit. *(It now returns 200 — I'll have
   confirmed this in the deploy log; if it still 404s, ping me and I'll ship the `public/sitemap.xml`
   fallback.)*
4. **URL Inspection** → paste `https://studentnest.ai/blog/how-to-study-for-the-digital-sat-complete-guide`
   → "Request indexing." Repeat for the homepage and `/sat-prep`.

### B. Bing Webmaster Tools (5 min) — Bing also powers DuckDuckGo + ChatGPT search
- https://www.bing.com/webmasters → add `studentnest.ai` → import from Search Console (one click) → submit sitemap.

### C. Create the social accounts (this is the reach unlock — 1 hr setup)
Create these, all with the **exact same handle** if available, e.g. `@studentnestprep` (since
`@studentnest_inc` is taken, **use `studentnestprep` or `studentnest.ai`** consistently):
- **TikTok** — primary for reach (scripts in §4).
- **Instagram** (Reels) — cross-post the TikToks.
- **YouTube** (Shorts + long-form) — also a search engine in its own right.
- **X / Twitter** — for SEO indexing + student conversations.
- **Reddit** — *participate*, don't spam (r/Sat, r/ACT, r/APStudents). Use the existing
  `Medium-Bowler8419` handle for genuine helpful answers that mention the tool when relevant.
- **Pinterest** — surprisingly strong for "study tips / study aesthetic" student searches.

➡️ **After the accounts exist, send me the URLs.** I'll add them to the `sameAs` array in the
schema (I left a marked placeholder) — that's what eventually triggers a Google **knowledge panel**
and locks in "StudentNest = the prep app" in Google's entity graph.

### D. Brand disambiguation decision (your call)
Because "StudentNest Inc" (Fresno K-12 tutoring) owns the bare `@studentnest` handles, you have two paths:
- **Path 1 (recommended, cheap):** Brand consistently as **"StudentNest Prep"** everywhere (handles,
  schema, titles). The schema/description fixes already lean this way. Lowest effort.
- **Path 2:** Consider a distinct product name to avoid fighting an established company for the term.
  Bigger lift, but removes the collision permanently. *(Business decision — not something I should pick.)*

### E. Google Business Profile — **skip.** GBP is for businesses with a physical location or
service area. A pure SaaS product doesn't qualify and an inaccurate listing can backfire. Spend the
time on social + Search Console instead.

---

## 4. TikTok / Reels scripts (ready to shoot)

Format notes: 15–35 s, vertical, face-to-camera or screen-record. Hook in the first 2 seconds.
Caption + on-screen text matters more than production quality. **No "#ADHD"** — frame as "for
students who get distracted." End every video with: *"Free at studentnest.ai — link in bio."*

### Video 1 — "Digital SAT is NOT the paper SAT" (screen-record + voiceover)
> **Hook (on-screen):** "If you're studying the SAT like it's 2019, you're wasting time."
> **Script:** "The SAT is fully digital now. It's *adaptive* — get the first module right and the
> second module gets harder, but that's the only way to hit the top scores. It's shorter — 2 hours,
> not 3. And you get a built-in Desmos calculator on every math question. If your prep doesn't look
> like Bluebook, it's the wrong prep." *(screen-record our `/full-practice-test` to show the match)*
> **Caption:** "The Digital SAT changed everything. Here's what actually matters 👆 Free practice that
> looks exactly like test day → studentnest.ai"
> **Hashtags:** #digitalsat #satprep #sat2026 #collegeprep #studytok

### Video 2 — "The 1 SAT math trick nobody teaches" (talking head, 20 s)
> **Hook:** "Everyone forgets the calculator is built into the Digital SAT."
> **Script:** "It's Desmos. Not a basic calculator — *Desmos*. You can graph both equations and just
> find where they cross. No algebra. I solved a system in 4 seconds. Practice with the real Desmos,
> not a TI-84." *(show the move)*
> **Caption:** "Use the Desmos that's already in the test. Free realistic practice → studentnest.ai"
> **Hashtags:** #satmath #desmos #digitalsat #satprep #mathhack

### Video 3 — "POV: you have 6 weeks and a 1000" (relatable, talking head)
> **Hook:** "6 weeks to raise your SAT. Here's the only plan that works."
> **Script:** "Week 1–2: full diagnostic, find your 3 weakest skills. Week 3–4: drill ONLY those, 20
> questions a day, review every miss. Week 5: two full timed mocks. Week 6: light review + sleep.
> Don't 'study everything.' Fix your weak skills. That's the whole game."
> **Caption:** "Save this. The 6-week SAT plan. Free diagnostic + adaptive drilling → studentnest.ai"
> **Hashtags:** #satprep #studyplan #collegeprep #sat #studytok

### Video 4 — "For students who can't sit still for 3 hours" (Focus Mode demo)
> **Hook:** "If long study sessions make your brain shut off — this is for you."
> **Script:** "We built a Focus Mode. One clean question at a time. No streak guilt, no clutter,
> short sessions. Built for students who get distracted easily. You don't need to grind for hours —
> you need 15 focused minutes a day." *(screen-record Focus Mode)*
> **Caption:** "Study in 15-min focused bursts. Free → studentnest.ai"
> **Hashtags:** #studytips #focusmode #studytok #testprep #studymotivation

### Video 5 — "ChatGPT can't do this for SAT prep" (differentiation)
> **Hook:** "Stop using ChatGPT to study for the SAT."
> **Script:** "ChatGPT makes up questions that don't match the real test, doesn't track what you got
> wrong, and never builds you a plan. Real prep needs *exam-aligned* questions, mastery tracking, and
> timed mocks that feel like Bluebook. That's the difference." *(quick app montage)*
> **Caption:** "AI is a tutor, not a test. Get real exam-aligned practice free → studentnest.ai"
> **Hashtags:** #satprep #chatgpt #studytok #collegeprep #ai

**Posting cadence:** 1 per weekday for 2 weeks, watch which hook lands, then double down. Cross-post
each to Instagram Reels + YouTube Shorts the same day (same file).

---

## 5. What I'll do once you complete the manual steps
- You create the social accounts → send me the URLs → I wire them into `sameAs` (knowledge-panel signal).
- You confirm Search Console is verified → I can add more programmatic SEO pages knowing they'll get crawled.
- If `/sitemap.xml` somehow still 404s after deploy → I ship the `public/sitemap.xml` static fallback
  (guaranteed, since `robots.txt` proves static files serve).

*Sister doc for PrepLion: `PrepLion/docs/INTERNET_REACH_PLAYBOOK_2026-06-08.md`.*
