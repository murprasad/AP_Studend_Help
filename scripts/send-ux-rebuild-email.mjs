/**
 * One-off — confirms the 2026-05-02 LATE landing-page UX rebuild is live.
 * Sends to murprasad@gmail.com via Resend.
 *
 * Usage:
 *   node scripts/send-ux-rebuild-email.mjs
 *
 * Requires: RESEND_API_KEY in .env (or process env).
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

const subject = "✅ StudentNest landing-page UX rebuild — LIVE on studentnest.ai";

const shipped = [
  ["Cut 'Meet Sage' 4-card grid → single sentence", "✅"],
  ["Cut engagement 4-card row (Daily Streaks / Exam Countdown / Daily Goals / Spaced Repetition)", "✅"],
  ["Replaced 'ChatGPT vs Us' comparison table → single honest line ('We make you work for it. Different tools.')", "✅"],
  ["Cut 'For Parents' 4-card grid → single sentence ('Same calculation. Less marketing.')", "✅"],
  ["Outcome-based final CTA: 'Stop guessing what to study / Start fixing what you don't know / [Find my weak areas]'", "✅"],
  ["Tension state on InteractiveDemo (red border + diagnostic line + topic-pattern warning + outcome CTA)", "✅"],
  ["Live 'Checking your answer…' animation between click and reveal", "✅"],
  ["Typography sweep on 5 H2s (font-bold tracking-tight leading-[1.05])", "✅"],
  ["Asymmetric layout tweaks (alternating bg, varied padding)", "✅"],
  ["Hero RIGHT swap: static MockupAnalytics → live <InteractiveDemo /> with wrong-answer flow", "✅"],
  ["NEW '3-Minute Diagnostic' section above-fold (progress bar + Q pips + Start CTA)", "✅"],
  ["NEW multi-Q tension section ('Most students think they're ready · Until this happens.') with 5 chips, 3 wrong, 40% confidence", "✅"],
  ["NEW 'Day 1 → Day 7' vertical timeline replacing icon framing", "✅"],
  ["NEW product loop diagram: Answer → Wrong → Learn why → Retry → Improve", "✅"],
];

const deferred = [
  ["Replace honesty card with raw/messy student testimonials", "⏸️ deferred — strategic call left for review"],
];

const verified = [
  "Full Playwright suite passed against staging (all known-flaky allowlisted)",
  "New landing-redesign-2026-05-02 spec (14 student-walk tests) passed against staging",
  "TypeScript clean (npx tsc --noEmit)",
  "All visible anchor hrefs return < 400",
  "Hero InteractiveDemo: wrong-answer flow walked end-to-end (click → checking → tension → explanation → outcome CTA → /register)",
  "All cuts verified absent from rendered HTML (Meet Sage grid, engagement row, ChatGPT-vs table, For Parents grid)",
];

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0f172a;">
  <h1 style="color: #1865F2; font-size: 22px; margin: 0 0 4px;">Landing UX rebuild — LIVE</h1>
  <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" })} · Production: <a href="${PROD_URL}" style="color: #1865F2;">${PROD_URL}</a></p>

  <div style="background: #f0f9ff; border-left: 4px solid #1865F2; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px;"><strong>Summary:</strong> Shipped 14 of 15 ChatGPT-flavored UX recommendations. Item 6 (raw student testimonials) deferred for your strategic call — current "honesty card" defends the bank-quality investment, replacing it might be a regression.</p>
  </div>

  <h2 style="font-size: 15px; margin: 20px 0 8px;">What's live (14)</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${shipped.map(([item, status]) => `<li><span style="color: #16a34a;">${status}</span> ${item}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Deferred (1)</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px; color: #64748b;">
    ${deferred.map(([item, status]) => `<li><strong>${status}</strong> — ${item}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Verified before promote</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${verified.map((v) => `<li>${v}</li>`).join("\n    ")}
  </ul>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
  <p style="color: #64748b; font-size: 12px; margin: 0;">
    Open <a href="${PROD_URL}" style="color: #1865F2;">${PROD_URL}</a> in an incognito window to walk it like a fresh visitor.
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
  console.log(`✅ Email sent to ${TO} (id: ${data.id})`);
} else {
  const err = await res.text();
  console.error(`❌ Email failed (${res.status}): ${err}`);
  process.exit(1);
}
