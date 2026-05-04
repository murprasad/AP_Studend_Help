import { readFileSync, writeFileSync } from "node:fs";

const path = "src/app/page.tsx";
let s = readFileSync(path, "utf8");
const before = s.length;

// 1. Add XCircle icon to imports (for multi-Q tension chips)
s = s.replace(
  "  CheckCircle,\n  ArrowRight,",
  "  CheckCircle,\n  XCircle,\n  ArrowRight,",
);

// 2. Hero RIGHT — desktop: swap BrowserFrame+MockupAnalytics → <InteractiveDemo />
const heroDesktopOld = `            {/* Right — product mockup */}
            <div className="hidden lg:block animate-float">
              <BrowserFrame title="StudentNest Prep · Analytics" className="shadow-2xl shadow-blue-500/10">
                <MockupAnalytics />
              </BrowserFrame>
            </div>
            {/* Mobile mockup — no float, compact */}
            <div className="lg:hidden max-w-md mx-auto w-full">
              <BrowserFrame title="StudentNest Prep · Analytics">
                <MockupAnalytics />
              </BrowserFrame>
            </div>`;
const heroNew = `            {/* Right — LIVE interactive product demo (replaced static
                MockupAnalytics 2026-05-02 LATE per ChatGPT design plan: hero
                must show the actual product wrong-answer flow, not a stock
                analytics screenshot). InteractiveDemo handles its own window
                chrome + animations + tension state. */}
            <div className="hidden lg:block">
              <InteractiveDemo />
            </div>
            <div className="lg:hidden max-w-md mx-auto w-full">
              <InteractiveDemo />
            </div>`;
if (!s.includes(heroDesktopOld)) throw new Error("Hero right block not found");
s = s.replace(heroDesktopOld, heroNew);
console.log("✓ 1. Hero swapped to InteractiveDemo");

// 3. REMOVE the standalone "Try it yourself" Interactive MCQ Demo section
const tryYourselfOld = `      {/* Interactive MCQ Demo */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Try it yourself — no sign-up needed
          </p>
          <p className="text-center text-xs text-muted-foreground mb-6">
            Answer a real AP World History question and see how Sage explains it
          </p>
          <InteractiveDemo />
        </div>
      </section>

`;
if (!s.includes(tryYourselfOld)) throw new Error("Try it yourself block not found");
s = s.replace(tryYourselfOld, "");
console.log("✓ 2. Standalone Try-it-yourself section removed");

// 4. NEW SECTION (item 2 in user list): 3-min diagnostic CTA section.
// Insert after hero </section> and before {/* 4 Module Cards */}.
const moduleCardsAnchor = "      {/* 4 Module Cards */}";
const diagnosticSection = `      {/* 3-min diagnostic CTA — added 2026-05-02 LATE per ChatGPT design plan.
          Above-fold action: progress bar + 5 question pips + outcome CTA. */}
      <section className="py-12 sm:py-14 border-y border-border/40 bg-secondary/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-3">3-Minute Diagnostic</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight leading-[1.1]">
            We&apos;ll show you exactly{" "}
            <span className="text-foreground/60">what you know</span>,{" "}
            <span className="text-foreground/60">what you don&apos;t</span>, and{" "}
            <span className="text-blue-600 dark:text-blue-400">what to fix next.</span>
          </h2>
          <p className="text-muted-foreground text-base mb-7 max-w-xl mx-auto">
            No fluff. No signup. 3 minutes from &ldquo;I don&apos;t know what to study&rdquo; to a personalized plan.
          </p>
          <div className="max-w-md mx-auto mb-7">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span className="font-mono">Q 2 / 5</span>
              <span className="font-mono">2:14 left</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden mb-3">
              <div className="h-full bg-blue-500 w-[42%] transition-all" />
            </div>
            <div className="flex gap-1.5">
              {[true, true, false, false, false].map((on, i) => (
                <div
                  key={i}
                  className={\`flex-1 h-9 rounded-md flex items-center justify-center text-xs font-mono transition-colors \${
                    on
                      ? "bg-blue-500/20 border border-blue-500/40 text-blue-700 dark:text-blue-300"
                      : "bg-secondary/30 border border-border/30 text-muted-foreground/60"
                  }\`}
                >
                  Q{i + 1}
                </div>
              ))}
            </div>
          </div>
          <Link href="/journey">
            <Button size="lg" className="gap-2 text-base h-12 px-8">
              Start the diagnostic <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

`;
if (!s.includes(moduleCardsAnchor)) throw new Error("Module cards anchor not found");
s = s.replace(moduleCardsAnchor, diagnosticSection + moduleCardsAnchor);
console.log("✓ 3. Diagnostic CTA section inserted");

// 5. NEW SECTION (item 3): Multi-Q tension section "You're not ready"
// Insert after Differentiation single-line section, before Curriculum Coverage.
const curriculumAnchor = "      {/* Curriculum Coverage — AP / SAT / ACT */}";
const tensionSection = `      {/* Multi-Q tension — "You're not ready" — added 2026-05-02 LATE.
          5 question pips, 3 wrong, confidence drops to 40%. Slightly
          uncomfortable on purpose: catch overconfidence early. */}
      <section className="py-16 sm:py-20 bg-red-500/5 border-y border-red-500/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
            Most students think they&apos;re ready
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Until this happens.
          </h2>
          <p className="text-muted-foreground mb-9 max-w-xl mx-auto">
            5 quick questions. Confidence drops fast.
          </p>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-2xl mx-auto mb-8">
            {[
              { num: 1, status: "right" as const },
              { num: 2, status: "wrong" as const },
              { num: 3, status: "right" as const },
              { num: 4, status: "wrong" as const },
              { num: 5, status: "wrong" as const },
            ].map((q) => (
              <div
                key={q.num}
                className={\`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 \${
                  q.status === "right"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-red-500/50 bg-red-500/10"
                }\`}
              >
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">Q{q.num}</span>
                {q.status === "right" ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            ))}
          </div>
          <div className="max-w-sm mx-auto">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Confidence</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">40%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 w-2/5" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-9 italic max-w-md mx-auto">
            We catch this early — so you don&apos;t walk into the exam thinking you knew it.
          </p>
        </div>
      </section>

`;
if (!s.includes(curriculumAnchor)) throw new Error("Curriculum anchor not found");
s = s.replace(curriculumAnchor, tensionSection + curriculumAnchor);
console.log("✓ 4. Multi-Q tension section inserted");

// 6. NEW SECTION (item 4): Day 1 → Day 7 vertical timeline.
// Insert before {/* Features — alternating text + product mockups */}.
const featuresAnchor = "      {/* Features — alternating text + product mockups */}";
const timelineSection = `      {/* Day 1 → Day 7 timeline — added 2026-05-02 LATE per ChatGPT plan.
          Replaces feature-icon framing with a concrete time-to-readiness flow. */}
      <section className="py-20 sm:py-24 bg-secondary/20 border-y border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] mb-3">
              7 days from{" "}
              <span className="text-foreground/60">&ldquo;I don&apos;t know what to study&rdquo;</span>
              <br className="hidden sm:block" /> to{" "}
              <span className="text-blue-600 dark:text-blue-400">&ldquo;I&apos;m ready.&rdquo;</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              No magic. Just the steps in order.
            </p>
          </div>
          <ol className="relative border-l-2 border-blue-500/30 ml-3 sm:ml-6 space-y-10">
            {[
              { day: "Day 1", title: "You take the diagnostic", desc: "5 minutes. We see the units you can't actually do.", color: "blue" },
              { day: "Day 2", title: "Your weak units surface", desc: "Specific topics. Not \\"study harder.\\"", color: "blue" },
              { day: "Day 3", title: "You practice — only what matters", desc: "No re-doing what you've already mastered.", color: "blue" },
              { day: "Day 5", title: "Timed exam simulation", desc: "Real exam pressure. Real readiness number.", color: "amber" },
              { day: "Day 7", title: "You're ready", desc: "Or we tell you exactly what's still off.", color: "emerald" },
            ].map((step) => {
              const dotColor =
                step.color === "emerald"
                  ? "bg-emerald-500 border-emerald-500/40"
                  : step.color === "amber"
                  ? "bg-amber-500 border-amber-500/40"
                  : "bg-blue-500 border-blue-500/40";
              const labelColor =
                step.color === "emerald"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : step.color === "amber"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-blue-600 dark:text-blue-400";
              return (
                <li key={step.day} className="ml-6 sm:ml-10 relative">
                  <span className={\`absolute -left-[31px] sm:-left-[45px] top-1.5 w-4 h-4 rounded-full ring-4 ring-background \${dotColor}\`} />
                  <p className={\`text-xs font-semibold uppercase tracking-wider mb-1 \${labelColor}\`}>{step.day}</p>
                  <h3 className="text-lg sm:text-xl font-bold mb-1.5 tracking-tight">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{step.desc}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

`;
if (!s.includes(featuresAnchor)) throw new Error("Features anchor not found");
s = s.replace(featuresAnchor, timelineSection + featuresAnchor);
console.log("✓ 5. Day 1-7 timeline section inserted");

// 7. NEW SECTION (item 5): Product loop arrow diagram.
// Insert before {/* FAQ */}.
const faqAnchor = "      {/* FAQ */}";
const loopSection = `      {/* Product loop diagram — added 2026-05-02 LATE per ChatGPT plan.
          Visual loop: Answer → Wrong → Learn why → Retry → Improve. */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.05] mb-3">
              The loop that fixes weak areas
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Every wrong answer triggers this. Every time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 items-center">
            {[
              { label: "Answer", classes: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" },
              { label: "Wrong", classes: "bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400" },
              { label: "Learn why", classes: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" },
              { label: "Retry", classes: "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400" },
              { label: "Improve", classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                <div className={\`w-full p-4 sm:p-5 rounded-xl border-2 text-center font-bold text-sm sm:text-base \${step.classes}\`}>
                  {step.label}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/60 rotate-90 sm:rotate-0 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

`;
if (!s.includes(faqAnchor)) throw new Error("FAQ anchor not found");
s = s.replace(faqAnchor, loopSection + faqAnchor);
console.log("✓ 6. Product loop diagram inserted");

writeFileSync(path, s);
console.log(`Final size: ${before} → ${s.length} (${s.length - before > 0 ? "+" : ""}${s.length - before} chars)`);
