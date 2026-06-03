/* eslint-disable @next/next/no-img-element */
// /test/fidelity-sample — prod-visible end-to-end proof of the Fidelity
// Architecture (P1+P2+P4). Renders ONE SAT_MATH sample question that:
//   - has a real SVG figure (algorithmic, deterministic)
//   - has 3 distractors each tied to a named CB mistake category
//   - has per-option explanations shown inline below each option
//   - matches CB Bluebook layout conventions
//
// Open https://studentnest.ai/test/fidelity-sample to inspect.

import { coordinatePlane, svgToDataUri } from "@/lib/stimulus-svg";

export const dynamic = "force-static";

export default function FidelitySamplePage() {
  const svg = coordinatePlane({
    width: 440,
    height: 360,
    xRange: [0, 12],
    yRange: [0, 280],
    xStep: 2,
    yStep: 40,
    title: "Subscribers vs Months Since Launch",
    xLabel: "Months since launch",
    yLabel: "Subscribers (thousands)",
    points: [
      { x: 0, y: 50 },
      { x: 2, y: 90 },
      { x: 4, y: 130 },
      { x: 6, y: 170 },
      { x: 8, y: 210 },
      { x: 10, y: 250 },
    ].map((p) => ({ x: p.x, y: p.y, color: "#0b62a4" })),
    lines: [{ from: [0, 50], to: [10, 250], color: "#0b62a4" }],
  });
  const dataUri = svgToDataUri(svg);

  const stem =
    "The scatterplot shows the number of subscribers, in thousands, that a streaming service had each of several months after launch. The line of best fit is also shown. Which of the following is the best interpretation of the slope of the line of best fit?";

  const options = [
    { letter: "A", text: "The streaming service gained 20,000 subscribers per month.", correct: true, mistake: "CORRECT" },
    { letter: "B", text: "The streaming service launched with 20,000 subscribers.", correct: false, mistake: "slope-vs-intercept-confusion" },
    { letter: "C", text: "The streaming service gained 50,000 subscribers per month.", correct: false, mistake: "intercept-as-slope" },
    { letter: "D", text: "After 20 months, the streaming service had 250,000 subscribers.", correct: false, mistake: "slope-as-endpoint" },
  ];

  const distractorExplanations: Record<string, string> = {
    A: "Correct. The slope of the line of best fit equals the change in subscribers divided by the change in months. Using (0, 50) and (10, 250): slope = (250 − 50) / (10 − 0) = 20 thousand per month, i.e. 20,000 subscribers/month.",
    B: "Incorrect — this confuses slope with y-intercept. The y-intercept is 50 thousand (the service launched with ~50,000 subscribers), not 20,000. The slope (rate of change) is the answer in A.",
    C: "Incorrect — this uses the y-intercept value (50) as if it were the slope. 50 thousand is the starting value, not the per-month rate. The actual per-month change is 20 thousand.",
    D: "Incorrect — this describes a specific point on the line (or beyond it) rather than its slope. Slope describes rate of change per unit of x, not the y-value at a chosen x.",
  };

  const workedSolution =
    "Slope of a line of best fit = rise / run. Pick two points: (0, 50) and (10, 250) (both in thousands). Slope = (250 − 50) / (10 − 0) = 200 / 10 = 20 thousand subscribers per month → 20,000 per month. The correct interpretation is choice A.";

  return (
    <div className="min-h-screen bg-white text-slate-900 px-6 py-8 max-w-3xl mx-auto" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div className="border-b border-slate-200 pb-3 mb-6">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Fidelity Architecture Proof — SAT_MATH</p>
        <h1 className="text-lg font-semibold mt-1">CB-format sample question with figure + per-option explanations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Domain: Algebra · Subskill: Linear functions / slope interpretation · Difficulty: Medium · stimulus=coordinatePlane (algorithmic SVG)
        </p>
      </div>

      <div className="mb-5">
        <img
          alt="Scatterplot of subscribers vs months since launch with line of best fit"
          src={dataUri}
          className="inline-block border border-slate-200 rounded p-2"
          width={440}
          height={360}
        />
      </div>

      <p className="text-base leading-relaxed mb-5">{stem}</p>

      <div className="space-y-4">
        {options.map((o) => (
          <div key={o.letter} className={`rounded border-2 ${o.correct ? "border-emerald-500 bg-emerald-50" : "border-slate-200"} p-3`}>
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full text-sm font-semibold flex items-center justify-center ${
                  o.correct ? "bg-emerald-600 text-white" : "border border-slate-400 text-slate-700"
                }`}
              >
                {o.letter}
              </div>
              <div className="flex-1">
                <p className="text-base text-slate-800">{o.text}</p>
                <p className="text-xs text-slate-500 mt-1.5">
                  <span className="font-semibold uppercase tracking-wide">{o.correct ? "Correct" : `Distractor — ${o.mistake}`}:</span>{" "}
                  {distractorExplanations[o.letter]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Worked solution</p>
        <p className="text-sm text-slate-700 leading-relaxed">{workedSolution}</p>
      </div>

      <div className="mt-6 text-xs text-slate-400">
        <p>
          Algorithmic SVG figure — deterministic, no LLM in render path. Source: synthetic data modeled on streaming-service growth (original).
        </p>
        <p className="mt-1">
          See docs/FIDELITY_ARCHITECTURE.md and src/lib/stimulus-svg/ for the library; data/distractor-patterns/sat-math-slope-interpretation.json
          for the mistake-category catalog this question pulls from.
        </p>
      </div>
    </div>
  );
}
