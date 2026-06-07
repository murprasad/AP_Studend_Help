# Customer Discovery — Real Student Interviews (the part that matters)
*2026-06-07 · SN + PL · supersedes the "just instrument feedback" reading*

**User's correction (verbatim intent):** wiring in-app feedback is NOT customer discovery.
We need *real interviews with students* — understand the pain, then check whether our product
actually solves it. "If our product doesn't solve user issues, then it's useless."

This is right. The in-app aggregator (`scripts/discovery-aggregate.mjs`) is **telemetry** — it tells
us *what* is going wrong inside sessions and *who* to talk to. It cannot tell us *why* a student
chose us, what they tried before, what "passing" means to them, or whether we fit a job they're
actually trying to do. Only conversations do that. Telemetry is the *input list*; interviews are the
*discovery*.

## The process (continuous, not a one-off survey)

### 1. Recruit — talk to people who are mid-pain RIGHT NOW
Three pools, in priority order:
- **Our own active users** (highest signal — they chose us, we can see their behavior first):
  - *Paying:* Sarah Beatty (PL Premium, CLEP Psych), Gregory (PL). Ask: what made you pay? what
    almost stopped you? what's still missing?
  - *Engaged free / at-risk:* Darryl Winfrey (PL, CLEP Sociology, 5 sessions today, 38%). Ask: what
    are you preparing for and by when? what made you keep going after a rough start? what frustrated you?
  - *Churned / went quiet:* anyone active then silent (Sarah is quiet 3 days post-convert). Highest-
    value interview of all — *why did you stop?*
- **In-market strangers** (validate beyond our bubble): r/CLEP, r/Sat, r/ACT, r/APStudents, college
  placement-test forums, the Facebook parent groups already surfaced. Recruit with a post offering a
  free Premium month for a 15-min call.
- **Near-misses** (signed up, never onboarded): the side-door / drop-at-diagnostic users.

### 2. Interview script (Jobs-To-Be-Done — pain first, product last)
Never demo first. ~15 min, recorded with consent:
1. **Context:** "Tell me about the exam you're prepping for and why it matters to you." (deadline,
   stakes — credit, money, admission)
2. **Current solution:** "Walk me through how you've been studying. What tools/books/sites?"
   (reveals the real competitor — often a textbook, Quizlet, or nothing)
3. **Pain:** "Where does that break down? Last time you sat down to study, what frustrated you?"
   (let them talk — do not lead)
4. **Job:** "When you finish a good study session, what does 'good' feel like? What did you get done?"
5. **Our fit (last):** "You used [our product] — where did it help, where did it get in your way?"
   (only now reference us)
6. **Willingness:** "If it did X perfectly, what would that be worth to you?" (pricing signal)
7. **Magic wand:** "If you could change one thing about prepping for this exam, what?"

### 3. Synthesize — pain → fit map
After every 5 interviews, build a table: *Pain stated · How often · Does our product solve it today?
(yes / partly / no) · Evidence*. The "no" and "partly" rows are the roadmap. If a top pain is a "no,"
that's the useless-product risk the user named — fix or re-scope.

### 4. Close the loop
Each validated pain → an owner + a fix (BIQ/RCA). Re-interview the same cohort after shipping to
confirm the pain actually moved (not just that we shipped something).

### 5. Cadence
- **Weekly:** read the in-app Discovery Report → pick 3 users to reach out to (1 paying, 1 engaged-
  free, 1 churned).
- **Per 5 interviews:** refresh the pain→fit map; surface "no" rows to the roadmap.
- **Per release:** re-interview affected cohort.

## Staged now (NOT sent — outreach needs owner authorization)
- **Interview-request emails** to our 3 live users (Sarah, Gregory, Darryl) — warm, no-hard-sell,
  offer a free Premium month for 15 min. Draft to be staged at `scripts/_send-interview-invites.mjs`
  (mirrors the Ruby/Sarah staged-send pattern; auto-send is classifier-blocked — owner runs it).
- **Reddit recruit post** draft for r/CLEP (per the user's Reddit-outreach handle
  [[user_reddit_handle]]).

## What the in-app system contributes (its real job)
- **Who to interview:** flags churned/at-risk users and the courses with the most pain.
- **What to ask about:** seeds interview questions with real session pain (e.g. ask Darryl about the
  explanations, since the data shows he hit circular ones).
- It is the *trigger and targeting* layer for interviews — not a substitute for them.

## First finding already (from live data, pre-interview)
Darryl Winfrey is hitting **circular explanations** in CLEP Sociology ("X is correct because X") on
the questions he gets wrong — so the product is *failing the core job* (help me learn from mistakes)
for an engaged free user. That's an interview to book AND a fix to ship. Same defect class as the
Fin-Accounting audit. This is exactly the "does our product solve the pain?" test — here, partly-no.
