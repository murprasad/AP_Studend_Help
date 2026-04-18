"use client";

/**
 * ExamMode — shared context used by Diagnostic / Mock Exam / AI Tutor
 * (Sage) to take over the full viewport. When active, the dashboard
 * layout hides its sidebar + mobile header and renders a slim top bar
 * with an exit button, so students aren't distracted while testing.
 *
 * Pages opt in by calling enterExamMode() on mount and exitExamMode()
 * on unmount. The layout also auto-exits when the pathname leaves the
 * whitelist of exam-mode pages.
 */

import { createContext, useContext, useState, useCallback } from "react";

interface ExamModeContextValue {
  examMode: boolean;
  enterExamMode: () => void;
  exitExamMode: () => void;
}

export const ExamModeContext = createContext<ExamModeContextValue>({
  examMode: false,
  enterExamMode: () => {},
  exitExamMode: () => {},
});

export function useExamMode() {
  return useContext(ExamModeContext);
}

export function useExamModeState(initialExamMode = false) {
  const [examMode, setExamMode] = useState(initialExamMode);
  const enterExamMode = useCallback(() => setExamMode(true), []);
  const exitExamMode = useCallback(() => setExamMode(false), []);
  return { examMode, enterExamMode, exitExamMode };
}
