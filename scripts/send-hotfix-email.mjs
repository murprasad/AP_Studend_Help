/**
 * Hotfix email — fixes the "Something hiccupped" landing-page crash
 * (React error #310, hook-order violation in SageChat) + several CLEP
 * leaks the user spotted + adds a permanent runtime-error E2E guard.
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
if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

const subject = "🔥 Hotfix LIVE — landing-scroll crash fixed + CLEP leaks cleaned + new E2E guard";

const fixed = [
  ["Landing-scroll crash (React error #310)", "Root cause: SageChat had `if (!pastHero) return null;` BEFORE two other useEffect calls. When pastHero flipped true on scroll, React saw 'rendered more hooks than previous render' and tripped the error boundary → 'Something hiccupped' page. Fix: moved the early return AFTER all hooks. Bug only surfaced on `/` because that's the only path where pastHero starts false."],
  ["CLEP toggle/question removed from hero InteractiveDemo", "The hero demo had an AP/CLEP track toggle showing the CLEP College Algebra question. Stripped — single AP World History question, no toggle, no CLEP track."],
  ["FAQ coverage answer rewritten", "Removed CLEP/DSST mentions. Now reads: 'AP, SAT, and ACT — only the courses that pass our quality bar (≥200 vetted questions per course) show up in the app.' Also adds the PrepLion handoff line for CLEP/DSST seekers."],
];

const newGuard = [
  ["NEW: tests/e2e/runtime-errors-landing.spec.ts (5 tests)", "Walks the page like a user — load, scroll progressively top-to-bottom, click the demo. Hard-fails on: any uncaught pageError, any React #310 console signature, any 'Something hiccupped' error-boundary text, any same-origin HTTP 500 (RSC prefetches whitelisted as known infra noise)."],
  ["Wired into deploy gate (DEPLOY_GATE_PUBLIC)", "Runs on every staging deploy AND every promote. Would have caught Beta 11.0's React #310 immediately. Class of bug now blocked from reaching prod."],
];

const verified = [
  "5/5 runtime-errors-landing tests pass on PROD (https://studentnest.ai)",
  "59/60 other E2E tests pass on PROD (1 intentional skip — Sage scroll-reveal flaky in Playwright headless)",
  "Total: 64 of 65 student-walk tests green on prod",
  "Manual scroll on prod: no error boundary triggered",
];

const lessonsLearned = [
  "**Bugs that only surface on user interaction need user-interaction tests.** Beta 11.0 had visibility tests but no scroll/click simulations. The new spec class fixes that.",
  "**React error #310 + early returns:** Conditional `return null` before useEffect declarations is a hook-order trap. ESLint react-hooks/rules-of-hooks would have caught this — worth checking ESLint config in a follow-up.",
  "**Pre-existing infrastructure issue (RSC prefetch 500s)** surfaced via the new guard — `/ap-prep`, `/sat-prep`, `/act-prep` return 500 on `?_rsc=...` hover-prefetches even though full GET returns 200. Allowlisted for now; tracked as backlog (not user-visible — silent prefetch loss).",
];

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0f172a;">
  <h1 style="color: #dc2626; font-size: 22px; margin: 0 0 4px;">Hotfix LIVE — landing crash + CLEP leaks</h1>
  <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" })} · Production: <a href="https://studentnest.ai" style="color: #1865F2;">studentnest.ai</a></p>

  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px;"><strong>What broke:</strong> Beta 11.0 introduced a React hook-order bug in SageChat that crashed the landing page with 'Something hiccupped' the moment a visitor scrolled past the hero. The error boundary was catching the React error and rendering the fallback. Real users were hitting it on every browser.</p>
    <p style="margin: 8px 0 0; font-size: 14px;"><strong>What's fixed:</strong> Hook order corrected. Page scrolls cleanly. Plus 2 CLEP leaks the user spotted (InteractiveDemo CLEP toggle, FAQ coverage answer).</p>
  </div>

  <h2 style="font-size: 15px; margin: 20px 0 8px;">Fixes shipped</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${fixed.map(([t, d]) => `<li><strong>${t}.</strong> ${d}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">New permanent guard</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${newGuard.map(([t, d]) => `<li><strong>${t}.</strong> ${d}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Verified on PROD</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${verified.map((v) => `<li>${v}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Lessons for future iterations</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${lessonsLearned.map((l) => `<li>${l.replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")}</li>`).join("\n    ")}
  </ul>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
  <p style="color: #64748b; font-size: 12px; margin: 0;">
    Open <a href="https://studentnest.ai" style="color: #1865F2;">studentnest.ai</a> and scroll all the way down. No more hiccup. Apologies for the rough cycle today.
  </p>
</div>
`;

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "noreply@studentnest.ai", to: "murprasad@gmail.com", subject, html }),
});
if (res.ok) {
  const d = await res.json();
  console.log(`✅ Hotfix email sent (id: ${d.id})`);
} else {
  console.error(`❌ Email failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
