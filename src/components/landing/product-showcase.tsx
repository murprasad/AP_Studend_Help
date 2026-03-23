import { ArrowRight, ArrowDown } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { MockupSidebar } from "./mockup-sidebar";
import { MockupStudyPlan } from "./mockup-study-plan";
import { MockupPractice } from "./mockup-practice";
import { MockupAnalytics } from "./mockup-analytics";

const steps = [
  {
    num: "1",
    label: "Pick Your Course",
    title: "StudentNest Prep · Courses",
    content: <MockupSidebar />,
  },
  {
    num: "2",
    label: "Get Your Plan",
    title: "StudentNest Prep · Study Plan",
    content: <MockupStudyPlan />,
  },
  {
    num: "3",
    label: "Practice Daily",
    title: "StudentNest Prep · Practice",
    content: <MockupPractice />,
  },
  {
    num: "4",
    label: "Track Progress",
    title: "StudentNest Prep · Analytics",
    content: <MockupAnalytics />,
  },
];

export function ProductShowcase() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">
            See Your Full Learning Journey
          </h2>
          <p className="text-muted-foreground text-sm">
            From course selection to score improvement &mdash; in four steps.
          </p>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-start gap-3">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <BrowserFrame title={step.title} className="w-full">
                  <div className="max-h-[280px] overflow-hidden">
                    {step.content}
                  </div>
                </BrowserFrame>
                <div className="text-center mt-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mx-auto mb-1">
                    {step.num}
                  </div>
                  <p className="text-xs font-medium">{step.label}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center pt-[140px] flex-shrink-0">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical stack */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, i) => (
            <div key={step.num}>
              <BrowserFrame title={step.title} className="w-full">
                <div className="max-h-[260px] overflow-hidden">
                  {step.content}
                </div>
              </BrowserFrame>
              <div className="flex items-center gap-2 mt-2 mb-1 justify-center">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {step.num}
                </div>
                <p className="text-xs font-medium">{step.label}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
