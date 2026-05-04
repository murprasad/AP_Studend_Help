/**
 * One-off — confirms CLEP/DSST removal from StudentNest is live.
 */

import { readFileSync } from "node:fs";

if (!process.env.RESEND_API_KEY) {
  try {
    const env = readFileSync(".env", "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^RESEND_API_KEY=(.+)$/);
      if (m) process.env.RESEND_API_KEY = m[1].trim();
    }
  } catch { /* .env optional */ }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = "murprasad@gmail.com";
const FROM = "noreply@studentnest.ai";
const PROD_URL = "https://studentnest.ai";

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set — aborting");
  process.exit(1);
}

const subject = "✅ CLEP/DSST removed + sidebar AP/SAT/ACT unlocked — LIVE on studentnest.ai";

const shipped = [
  ["SiteSetting flags off", "clep_enabled=false, dsst_enabled=false in production DB. All conditional UI gated by these flags is hidden."],
  ["301 redirects", "/clep-prep, /clep-prep/:slug, /dsst-prep, /dsst-prep/:slug → permanent redirect (308) to https://preplion.ai. Bookmarks and search-engine links land on the right product."],
  ["Dead-code strip", "Removed clep-prep/ and dsst-prep/ marketing route directories. Removed clep-testimonials.tsx + clep-timeline.tsx. clepCourses array stubbed empty. CLEP testimonial entry removed. Hardcoded clepOn/dsstOn = false constants so JSX dead-code-elims at build."],
  ["PrepLion footer handoff", "Subtle 'CLEP & DSST? → PrepLion ↗' link in footer Exam Prep column, opens preplion.ai in new tab. Visitors looking for CLEP/DSST get a clean handoff."],
  ["Sidebar AP/SAT/ACT unlock (BUG FIX)", "Test user reported only AP courses visible in sidebar. Root cause: TRACK_TO_GROUP hard-locked each signup track to one group (Beta 2.1 'Module-Locked Sidebar'). Fixed: ap/sat/act tracks now ALL see ALL 3 groups. Track determines default-selected tab, not hard lock. Students often prep for multiple exams simultaneously."],
  ["FRQ Practice nav fix", "FRQ Practice gated by current course family (not signup track). Visible only when current course is AP_*. Cleanly hides for SAT/ACT courses."],
];

const verified = [
  "59 of 60 student-walk Playwright tests pass on PRODUCTION studentnest.ai (1 intentional skip)",
  "  — critical-paths-2026-05-03 (30 tests): all public surfaces, login/register forms, hero CTA wiring, anonymous→/practice redirects to auth, /api/* anonymous returns 401, footer broken-link sweep, preplion.ai externally reachable",
  "  — clep-dsst-removal-2026-05-03 (7 tests): /clep-prep + /dsst-prep redirect 308, navbar has zero CLEP/DSST links, footer PrepLion link works",
  "  — landing-redesign-2026-05-02 (19 tests): hero auto-pilot, tension state, mid-session strip, Day 1-7 timeline, product loop, all earlier cuts",
  "  — sidebar-multi-track-2026-05-03 (4 tests, AUTHED): logged-in user sees AP + SAT + ACT tabs in course picker, clicking SAT shows SAT Math, clicking ACT shows ACT Math + English",
  "Existing 102-test deploy gate also green — no regressions to AP/SAT/ACT practice or journey flows",
];

const deferred = [
  "ApCourse enum CLEP_*/DSST_* values — kept in Prisma schema (vestigial, no user impact). Schema migration deferred to avoid risk.",
  "CLEP_*/DSST_* questions in DB — left as isApproved (gated invisibly by visible_courses allowlist). No urgency to delete.",
  "isClepEnabled/isDsstEnabled helpers in src/lib/settings.ts — still callable, always return false. Defensive against any imports we haven't fully audited.",
];

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0f172a;">
  <h1 style="color: #1865F2; font-size: 22px; margin: 0 0 4px;">CLEP/DSST removed from StudentNest — LIVE</h1>
  <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" })} · Production: <a href="${PROD_URL}" style="color: #1865F2;">${PROD_URL}</a></p>

  <div style="background: #f0f9ff; border-left: 4px solid #1865F2; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px;"><strong>Clean break.</strong> StudentNest serves AP/SAT/ACT only. Anyone landing on /clep-prep or /dsst-prep redirects to PrepLion.ai. A subtle footer link gives the handoff. No impact to any AP/SAT/ACT functionality.</p>
  </div>

  <h2 style="font-size: 15px; margin: 20px 0 8px;">Shipped (4 phases)</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${shipped.map(([title, desc]) => `<li><strong>${title}.</strong> ${desc}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Verified before promote</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${verified.map((v) => `<li>${v}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Deliberately deferred</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px; color: #64748b;">
    ${deferred.map((d) => `<li>${d}</li>`).join("\n    ")}
  </ul>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
  <p style="color: #64748b; font-size: 12px; margin: 0;">
    Test it: <a href="${PROD_URL}/clep-prep" style="color: #1865F2;">${PROD_URL}/clep-prep</a> should land you on PrepLion.ai.
  </p>
</div>
`;

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ from: FROM, to: TO, subject, html }),
});

if (res.ok) {
  const data = await res.json();
  console.log(`✅ CLEP/DSST removal email sent to ${TO} (id: ${data.id})`);
} else {
  const err = await res.text();
  console.error(`❌ Email failed (${res.status}): ${err}`);
  process.exit(1);
}
