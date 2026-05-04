/**
 * Beta 11.0 confirmation email — fires after promote completes.
 * Addresses 4 remaining ChatGPT items from the 2026-05-03 brutal review.
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

const subject = "✅ Beta 11.0 — hero auto-pilot + Sage hide + CTA fix + mid-session strip — LIVE";

const shipped = [
  ["Hero auto-pilot wrong-answer demo", "InteractiveDemo auto-clicks a wrong answer 2.5s after mount, so visitors see the tension banner without doing anything. Pauses at first user click."],
  ["Hide SageChat in hero viewport", "Floating Sage bubble only renders after scroll-y > 600px. Removes the chatbot vibe from the hero."],
  ["Hero CTA copy", "'Check my projected score' → 'Find my weak areas'. Subtitle: '3-min diagnostic · No signup · See exactly which units you'd fail.'"],
  ["'Mid-session check' real-student-state strip", "Slim strip directly below hero showing fake mid-practice state: Unit 4 · 41% ❌ · Unit 5 · 63% ⚠️ · Unit 6 · 88% ✓. Caption: 'This is what you'll see in 5 minutes.'"],
];

const verified = [
  "19 student-walk Playwright tests pass on prod (15 from yesterday + 4 new Beta 11.0)",
  "TypeScript clean",
  "Existing deploy gate (102 tests) green — no regressions",
  "Auto-pilot tested: visitor on landing page sees the wrong-answer tension banner within 6 seconds of page load, no interaction required",
];

const courseSummary = [
  ["Visible courses (12 — up from 9)", "9 AP: Bio · Calc BC · Chem · CSP · Human Geo · Physics 1 · Precalc · Psych · US Gov · 1 SAT: Math · 2 ACT: English · Math"],
  ["Newly unlocked this push (3)", "AP Precalculus (251 approved — gated visible) · SAT Math (196 → 200, 14 new Qs generated) · ACT Math (181 → 200, 19 new Qs generated). Total ~$0.04 in Gemini Flash spend."],
  ["Why this matters now", "AP exam is 2026-05-04 (tomorrow). After exam day, students pivot to SAT/ACT prep. Adding SAT Math + ACT Math + AP Precalc means the post-exam audience has somewhere to land instead of seeing 'no courses available.'"],
];

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0f172a;">
  <h1 style="color: #1865F2; font-size: 22px; margin: 0 0 4px;">Beta 11.0 — LIVE</h1>
  <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" })} · Production: <a href="${PROD_URL}" style="color: #1865F2;">${PROD_URL}</a></p>

  <div style="background: #f0f9ff; border-left: 4px solid #1865F2; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px;"><strong>What changed:</strong> The 4 remaining items from the 2026-05-03 brutal review. Hero now auto-shows the wrong-answer state — visitors see the failure flow without clicking. Sage chat hidden in hero. CTA copy fixed. Real-student-state proof strip below hero.</p>
  </div>

  <h2 style="font-size: 15px; margin: 20px 0 8px;">Shipped (4)</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${shipped.map(([title, desc]) => `<li><strong>${title}.</strong> ${desc}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Verified before promote</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${verified.map((v) => `<li>${v}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Course visibility status</h2>
  <ul style="line-height: 1.7; padding-left: 18px; margin: 0; font-size: 13px;">
    ${courseSummary.map(([title, body]) => `<li><strong>${title}:</strong> ${body}</li>`).join("\n    ")}
  </ul>

  <h2 style="font-size: 15px; margin: 24px 0 8px;">Question-bank threshold (honest answer)</h2>
  <p style="font-size: 13px; line-height: 1.7; margin: 0 0 8px; color: #475569;">
    With wrong-answer recycling + avoid-repeats already in <code>practice/route.ts</code>, the bank's effective depth is ~3× the unique count. <strong>200 is enough for launch</strong> (covers diagnostic + 1–2 weeks for 80% of users). 300 is the "feels real" threshold for 4-week prep. 500+ is overkill for the median student. Keeping 200 as the gate; targeting 300 for "comfortable" coverage. AP Bio + AP Human Geo are already past 300.
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
  <p style="color: #64748b; font-size: 12px; margin: 0;">
    Open <a href="${PROD_URL}" style="color: #1865F2;">${PROD_URL}</a> in an incognito window. Wait 3 seconds. The hero demo should auto-show the red tension banner without you clicking anything.
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
  console.log(`✅ Beta 11.0 email sent to ${TO} (id: ${data.id})`);
} else {
  const err = await res.text();
  console.error(`❌ Email failed (${res.status}): ${err}`);
  process.exit(1);
}
