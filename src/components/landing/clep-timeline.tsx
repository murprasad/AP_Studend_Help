"use client";

import { useEffect, useRef, useState } from "react";
import { ListChecks, ClipboardCheck, Calendar, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: ListChecks,
    title: "Pick your exam",
    description: "34 CLEP exams across 5 domains",
    rotate: "rotate-1",
  },
  {
    icon: ClipboardCheck,
    title: "Take a 5-min diagnostic",
    description: "See what you already know",
    rotate: "-rotate-1",
  },
  {
    icon: Calendar,
    title: "Follow your 7-day plan",
    description: "Sage builds your custom study plan",
    rotate: "rotate-1",
  },
  {
    icon: GraduationCap,
    title: "Walk in and pass",
    description: "Schedule any week — no waiting",
    rotate: "-rotate-1",
  },
];

function ConnectorHorizontal() {
  return (
    <svg
      className="hidden lg:block w-16 xl:w-24 h-8 flex-shrink-0 mt-6"
      viewBox="0 0 96 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 18 C 28 8, 68 28, 92 14"
        stroke="#34d399"
        strokeWidth="2"
        strokeDasharray="6 4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ConnectorVertical() {
  return (
    <svg
      className="block lg:hidden w-8 h-12 mx-auto"
      viewBox="0 0 32 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 4 C 10 16, 22 32, 16 44"
        stroke="#34d399"
        strokeWidth="2"
        strokeDasharray="6 4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function CLEPTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full py-12">
      {/* Desktop: horizontal row */}
      <div className="hidden lg:flex items-start justify-center gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start">
            <div
              className="flex flex-col items-center text-center max-w-[180px]"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.6s ease-out ${i * 150}ms, transform 0.6s ease-out ${i * 150}ms`,
              }}
            >
              {/* Step circle */}
              <div
                className={`relative w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center ${step.rotate}`}
              >
                <step.icon className="w-7 h-7 text-emerald-700 dark:text-emerald-400" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {i + 1}
                </span>
              </div>

              {/* Title + description */}
              <h3 className="mt-4 text-sm font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Connector between steps */}
            {i < steps.length - 1 && <ConnectorHorizontal />}
          </div>
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="flex lg:hidden flex-col items-center gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className="flex flex-col items-center text-center max-w-[220px]"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.5s ease-out ${i * 120}ms, transform 0.5s ease-out ${i * 120}ms`,
              }}
            >
              {/* Step circle */}
              <div
                className={`relative w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center ${step.rotate}`}
              >
                <step.icon className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {i + 1}
                </span>
              </div>

              {/* Title + description */}
              <h3 className="mt-3 text-sm font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Vertical connector */}
            {i < steps.length - 1 && <ConnectorVertical />}
          </div>
        ))}
      </div>
    </div>
  );
}
