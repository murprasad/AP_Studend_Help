"use client";

/**
 * Text-to-Speech hook for accessibility (ported from PrepLion).
 *
 * Uses the browser Web Speech API. Safe in SSR (checks `typeof window`).
 * Accessibility value: learners with reading disabilities (dyslexia,
 * ADHD) can have the passage/stem read aloud without leaving the UI.
 */

import { useState, useCallback } from "react";

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}
