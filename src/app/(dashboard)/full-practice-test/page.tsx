"use client";

// /full-practice-test — CB Bluebook-aligned full-length test entry.
//
// Design language: matches CB Bluebook visual conventions:
//   - White background, generous whitespace
//   - Helvetica Neue / sans-serif at CB-aligned sizes
//   - CB blue accent (#324dc7-style) for primary actions
//   - Letter-circle answer buttons (rendered on the test page itself)
//   - Card-based test selection with clear available/locked states
//
// /full-practice-test?course=SAT_MATH or PSAT_MATH = served from the
// deterministic Full Practice Test sets (44 Qs each tagged practiceTestSet=N).

import Link from "next/link";
import { useCourse } from "@/hooks/use-course";
import { Clock, FileText, Lock, CheckCircle2 } from "lucide-react";

interface FullTest {
  id: number;
  label: string;
  status: "available" | "coming-soon";
  description: string;
  qCount: number;
}

const SAT_TESTS: FullTest[] = [
  {
    id: 1,
    label: "Full Practice Test 1",
    status: "available",
    description:
      "Two adaptive modules (22 + 22 Qs). Module 1 difficulty determines Module 2 routing, matching the official CB Digital SAT.",
    qCount: 44,
  },
  {
    id: 2,
    label: "Full Practice Test 2",
    status: "coming-soon",
    description: "Releases next week. Same adaptive 2-module structure, fresh question bank.",
    qCount: 44,
  },
  {
    id: 3,
    label: "Full Practice Test 3",
    status: "coming-soon",
    description: "Releases two weeks from launch. Same adaptive structure with new items.",
    qCount: 44,
  },
];

export default function FullPracticeTestPage() {
  const [course] = useCourse();
  const isSatTrack =
    course === "SAT_MATH" ||
    course === "SAT_READING_WRITING" ||
    course === "PSAT_MATH" ||
    course === "PSAT_READING_WRITING";

  if (!isSatTrack) {
    return (
      <div
        className="min-h-screen bg-white text-slate-900"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
      >
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-semibold mb-3 text-slate-900">Full Practice Test</h1>
          <p className="text-slate-600 leading-relaxed">
            Full-length practice tests are available for SAT and PSAT courses. Switch your course (sidebar → course selector) to SAT or PSAT to access this section.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 px-5 py-2 rounded-full text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isSat = course?.startsWith("SAT_");
  const moduleTime = course === "SAT_MATH" ? "35 min" : "32 min";
  const totalTime = course === "SAT_MATH" ? "70 min" : "64 min";
  const qCount = course === "SAT_MATH" || course === "PSAT_MATH" ? "44" : "54";

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Bluebook-style header: minimal, monochrome, generous space */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">
            {isSat ? "Digital SAT" : "PSAT/NMSQT"} · Practice
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 leading-tight">
            Full-length practice tests
          </h1>
          <p className="text-[15px] text-slate-600 mt-3 leading-relaxed max-w-2xl">
            Take a full, two-module {isSat ? "SAT" : "PSAT"} mock that mirrors the official CB experience: adaptive Module 2 routing, official timing, Desmos calculator, and 200–800 scaled scoring.
          </p>
        </div>

        {/* CB-style stat row — matches the structure summary on satsuite.collegeboard.org */}
        <div className="grid grid-cols-3 gap-4 mb-10 pb-8 border-b border-slate-200">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1">Questions</p>
            <p className="text-[22px] font-semibold text-slate-900 leading-none">{qCount}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1">Total time</p>
            <p className="text-[22px] font-semibold text-slate-900 leading-none">{totalTime}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1">Per module</p>
            <p className="text-[22px] font-semibold text-slate-900 leading-none">{moduleTime}</p>
          </div>
        </div>

        {/* Test selection cards — Bluebook-style flat cards with clear hover and locked states */}
        <div className="space-y-3 mb-10">
          {SAT_TESTS.map((t) => {
            const isAvailable = t.status === "available";
            return (
              <div
                key={t.id}
                className={`rounded-lg border ${isAvailable ? "border-slate-200 hover:border-blue-400 hover:shadow-sm" : "border-slate-200 bg-slate-50"} p-5 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isAvailable ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isAvailable ? <FileText className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <p className="text-[15px] font-semibold text-slate-900">{t.label}</p>
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Coming soon</span>
                      )}
                    </div>
                    <p className="text-[13.5px] text-slate-600 leading-relaxed mb-3">{t.description}</p>
                    {isAvailable && (
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/mock-exam?test=${t.id}`}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13.5px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          style={{ backgroundColor: "#324dc7" }}
                        >
                          Start Test {t.id}
                        </Link>
                        <span className="text-[12px] text-slate-500 inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Allow {totalTime} of uninterrupted time
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* What to expect — CB-style minimal expectations callout */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-3">What to expect</p>
          <ul className="text-[13.5px] text-slate-700 space-y-2 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-slate-400 flex-shrink-0 mt-0.5">·</span>
              <span>Two modules per section, separated by a 10-minute break (CB-spec)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 flex-shrink-0 mt-0.5">·</span>
              <span>Module 1 performance determines Module 2 difficulty (adaptive routing)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 flex-shrink-0 mt-0.5">·</span>
              <span>Built-in Desmos graphing calculator on Math (available on every question)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 flex-shrink-0 mt-0.5">·</span>
              <span>Per-option distractor explanations on wrong answers (no Sage redirect)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 flex-shrink-0 mt-0.5">·</span>
              <span>200–800 scaled score on completion</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
