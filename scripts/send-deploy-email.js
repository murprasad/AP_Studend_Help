/**
 * Sends a deployment notification email after every successful deploy.
 * Runs as the final step in the pages:deploy pipeline.
 *
 * Requires: RESEND_API_KEY env var (loaded from .env if not set)
 * Sends to: contact@studentnest.ai
 */

// Load .env if RESEND_API_KEY not already in environment
if (!process.env.RESEND_API_KEY) {
  try {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "..", ".env");
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^RESEND_API_KEY=(.+)$/);
      if (match) process.env.RESEND_API_KEY = match[1].trim();
    }
  } catch { /* ignore */ }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = "contact@studentnest.ai";
const FROM_EMAIL = "noreply@studentnest.ai";

async function main() {
  if (!RESEND_API_KEY) {
    console.log("⚠️  RESEND_API_KEY not set — skipping deploy email");
    return;
  }

  // Read version from package.json
  const pkg = require("../package.json");
  const version = pkg.version;
  const betaLabel = `Beta ${version.replace(/\.0$/, "").replace(/^(\d+)\.(\d+)/, "$1.$2")}`;

  // Get recent git log for changelog
  let changelog = "";
  try {
    const { execSync } = require("child_process");
    const log = execSync("git log --oneline -5", { encoding: "utf8" }).trim();
    changelog = log
      .split("\n")
      .map((line) => `<li style="color: #475569; font-size: 13px;">${line.substring(8)}</li>`)
      .join("\n");
  } catch {
    changelog = "<li>See git log for details</li>";
  }

  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/New_York",
  });

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #6366f1; font-size: 24px;">StudentNest AI — ${betaLabel} Deployed</h1>
      <p style="color: #64748b; font-size: 14px;">${timestamp}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <h2 style="font-size: 16px; color: #1e293b;">Recent Changes</h2>
      <ul style="line-height: 1.8; padding-left: 20px;">
        ${changelog}
      </ul>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="color: #64748b; font-size: 12px;">
        Live at <a href="https://studentnest.ai" style="color: #6366f1;">studentnest.ai</a> ·
        Version: ${version}
      </p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `StudentNest AI — ${betaLabel} Deployed`,
        html,
      }),
    });

    if (res.ok) {
      console.log(`✅ Deploy notification sent to ${TO_EMAIL}`);
    } else {
      const err = await res.text();
      console.log(`⚠️  Deploy email failed (${res.status}): ${err}`);
    }
  } catch (err) {
    console.log(`⚠️  Deploy email error: ${err.message}`);
  }
}

main();
