import { readFileSync, writeFileSync } from "node:fs";

const path = "src/app/page.tsx";
let s = readFileSync(path, "utf8");
const before = s.length;

// CUT 1 — engagement row (4 cards)
const engStart = s.indexOf("{/* Engagement row");
if (engStart < 0) throw new Error("engagement marker not found");
const engBlockEnd = s.indexOf("</div>", s.indexOf("Spaced Repetition")) + "</div>".length;
const trimStart = s.lastIndexOf("\n", engStart) + 1;
const trimEnd = s.indexOf("\n", engBlockEnd) + 1;
console.log(`CUT 1 (engagement): ${trimEnd - trimStart} chars`);
s = s.slice(0, trimStart) + s.slice(trimEnd);

// CUT 2 — replace ChatGPT-vs comparison table with single-line section
const tableMarker = "{/* Why StudentNest — Comparison Table */}";
const tableStart = s.indexOf(tableMarker);
if (tableStart < 0) throw new Error("comparison-table marker not found");
const tableEndAnchor = "{/* Curriculum Coverage";
const tableEnd = s.indexOf(tableEndAnchor, tableStart);
if (tableEnd < 0) throw new Error("end anchor not found");
const tableTrimStart = s.lastIndexOf("\n", tableStart) + 1;
const tableTrimEnd = s.lastIndexOf("\n", tableEnd) + 1;
const tableReplacement = `      {/* Differentiation — single honest line, no table */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="text-lg sm:text-xl text-foreground/80 leading-relaxed">
            ChatGPT will give you the answer.{" "}
            <span className="text-foreground font-semibold">We make you work for it.</span>
          </p>
          <p className="text-sm text-muted-foreground italic">Different tools.</p>
        </div>
      </section>

`;
console.log(`CUT 2 (comparison table): ${tableTrimEnd - tableTrimStart} chars → ${tableReplacement.length}`);
s = s.slice(0, tableTrimStart) + tableReplacement + s.slice(tableTrimEnd);

// CUT 3 — For Parents card grid → 1 sentence
const parentsMarker = "{/* For Parents */}";
const parentsStart = s.indexOf(parentsMarker);
if (parentsStart < 0) throw new Error("For Parents marker not found");
const parentsEndAnchor = "{/* FAQ */}";
const parentsEnd = s.indexOf(parentsEndAnchor, parentsStart);
if (parentsEnd < 0) throw new Error("FAQ end anchor not found");
const parentsTrimStart = s.lastIndexOf("\n", parentsStart) + 1;
const parentsTrimEnd = s.lastIndexOf("\n", parentsEnd) + 1;
const parentsReplacement = `      {/* For Parents — one sentence, no marketing grid */}
      <section id="parents" className="py-12 sm:py-16 bg-secondary/20 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-3">For Parents</p>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            A private tutor at $50/hr × 24 hours runs $1,200. Our $20 covers the same period.
            <span className="block mt-2 text-muted-foreground italic">Same calculation. Less marketing.</span>
          </p>
        </div>
      </section>

`;
console.log(`CUT 3 (For Parents): ${parentsTrimEnd - parentsTrimStart} chars → ${parentsReplacement.length}`);
s = s.slice(0, parentsTrimStart) + parentsReplacement + s.slice(parentsTrimEnd);

// CUT 4 — final CTA: outcome-based language
const finalCtaH2 = `<h2 className="text-4xl font-bold mb-4">Ready to prepare for the exam that changes everything?</h2>`;
if (!s.includes(finalCtaH2)) throw new Error("final CTA H2 not found");
s = s.replace(
  finalCtaH2,
  `<h2 className="text-4xl font-bold mb-4">Stop guessing what to study.<br /><span className="text-blue-600 dark:text-blue-400">Start fixing what you don't know.</span></h2>`
);

// CUT 4b — change CTA button label to outcome-based
const ctaButtonOld = `Start AP/SAT/ACT Prep Free`;
const ctaButtonNew = `Find my weak areas`;
if (!s.includes(ctaButtonOld)) console.warn("CTA button text not found — skipping rename");
else s = s.replace(ctaButtonOld, ctaButtonNew);

console.log(`Final size: ${before} → ${s.length} (${s.length - before} chars delta)`);
writeFileSync(path, s);
console.log("Wrote", path);
