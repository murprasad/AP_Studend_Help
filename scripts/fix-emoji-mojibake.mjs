// Fix emoji mojibake in source files. The pattern: 4-byte UTF-8 emoji
// (e.g. 📚 = F0 9F 93 9A) decoded as Latin-1 and re-encoded as UTF-8
// produces sequences like "ðŸ"š". This restores the original emoji.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const exts = new Set([".tsx", ".ts"]);

// Emoji mojibake mappings. Each entry: [mojibake, original].
const FIXES = [
  ["ðŸŽ¯", "🎯"],
  ["ðŸ’°", "💰"],
  ["ðŸ“š", "📚"],
  ["ðŸ”¥", "🔥"],
  ["ðŸŒ¿", "🌿"],
  ["ðŸ“…", "📅"],
  ["ðŸ”¬", "🔬"],
  ["ðŸ’¼", "💼"],
  ["ðŸ¤–", "🤖"],
  ["ðŸƒ", "🃏"],
  ["ðŸŒ", "🌍"],
  ["ðŸ’ª", "💪"],
  ["ðŸŽ“", "🎓"],
  ["ðŸ’¡", "💡"],
  ["ðŸ§ ", "🧠"],
  ["ðŸ§¬", "🧬"],
  ["ðŸ§®", "🧮"],
  ["ðŸš€", "🚀"],
  ["ðŸ“ˆ", "📈"],
  ["ðŸ“Š", "📊"],
  ["ðŸ“", "📝"],
  ["ðŸ”", "🔎"],
  ["ðŸ’¬", "💬"],
  ["ðŸ™‚", "🙂"],
  ["â­", "⭐"],
  ["âœ…", "✅"],
  ["âŒ", "❌"],
  ["âš¡", "⚡"],
  ["â–¶", "▶"],
  ["â—€", "◀"],
  ["Â·", "·"],
  ["âœ¦", "✦"],
  ["âœ¨", "✨"],
  ["â—‹", "○"],
  ["â—", "●"],
  ["â–²", "▲"],
  ["â–¼", "▼"],
  ["â†", "←"],
  ["â†'", "→"],
  ["â†'", "→"],
  ["â‡'", "⇒"],
  ["â€", "—"],
  ["â„¢", "™"],
  ["Â®", "®"],
  ["Â©", "©"],
];

let touched = 0;
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (exts.has(path.extname(f.name))) maybeFix(p);
  }
}

function maybeFix(file) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;
  for (const [bad, good] of FIXES) c = c.split(bad).join(good);
  if (c !== orig) {
    fs.writeFileSync(file, c, "utf8");
    touched++;
    console.log("  fixed:", path.relative(process.cwd(), file));
  }
}

walk(root);
console.log(`\nFiles fixed: ${touched}`);
