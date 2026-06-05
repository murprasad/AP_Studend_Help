"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * use-focus-prefs — Focus tools preferences (ADHD Wave 2).
 *
 * "Focus tools — designed for students who learn differently."
 * These are accommodations-style, focus-friendly study aids. They are NOT
 * medical features and make no diagnostic/treatment claims.
 *
 * Persistence: localStorage only (no schema/DB change), mirroring the existing
 * daily-goals client-only setting. SSR-safe: state initializes to defaults and
 * the stored value is read in useEffect (window is undefined during SSR).
 *
 * Three prefs:
 *   - focusMode      — minimal, distraction-reduced practice UI
 *   - extendedTime   — time multiplier for timed sections (1x / 1.5x / 2x)
 *   - energyCheckIn  — quick energy check at session start
 */

export type ExtendedTime = "1x" | "1.5x" | "2x";

export interface FocusPrefs {
  focusMode: boolean;
  extendedTime: ExtendedTime;
  energyCheckIn: boolean;
}

const STORAGE_KEY = "sn_focus_prefs";
const PREFS_CHANGE_EVENT = "sn-focus-prefs-change";

const DEFAULT_PREFS: FocusPrefs = {
  focusMode: false,
  extendedTime: "1x",
  energyCheckIn: false,
};

const VALID_EXTENDED_TIME: ExtendedTime[] = ["1x", "1.5x", "2x"];

function readPrefsFromBrowserStorage(): FocusPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FocusPrefs>;
    const extendedTime =
      parsed.extendedTime && VALID_EXTENDED_TIME.includes(parsed.extendedTime)
        ? parsed.extendedTime
        : DEFAULT_PREFS.extendedTime;
    return {
      focusMode: !!parsed.focusMode,
      extendedTime,
      energyCheckIn: !!parsed.energyCheckIn,
    };
  } catch {
    return null;
  }
}

/**
 * Non-hook helper — read the extended-time multiplier as a number (1 / 1.5 / 2)
 * for use in timer math (e.g. mock-exam / timed practice countdowns). Safe to
 * call from non-component code. Returns 1 when unset or on SSR.
 */
export function getExtendedTimeMultiplier(): number {
  const prefs = readPrefsFromBrowserStorage();
  switch (prefs?.extendedTime) {
    case "2x":
      return 2;
    case "1.5x":
      return 1.5;
    default:
      return 1;
  }
}

/** Convert an ExtendedTime enum value to its numeric multiplier. */
export function extendedTimeToMultiplier(value: ExtendedTime): number {
  switch (value) {
    case "2x":
      return 2;
    case "1.5x":
      return 1.5;
    default:
      return 1;
  }
}

export interface UseFocusPrefs {
  prefs: FocusPrefs;
  setFocusMode: (value: boolean) => void;
  setExtendedTime: (value: ExtendedTime) => void;
  setEnergyCheckIn: (value: boolean) => void;
  /** Numeric multiplier (1 / 1.5 / 2) derived from prefs.extendedTime. */
  timeMultiplier: number;
}

/**
 * Returns focus-tools prefs + setters. SSR-safe: starts at defaults, hydrates
 * from localStorage in useEffect (following the safe pattern used elsewhere in
 * this codebase). Listens for cross-component changes so multiple mounts stay
 * in sync.
 */
export function useFocusPrefs(): UseFocusPrefs {
  const [prefs, setPrefs] = useState<FocusPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = readPrefsFromBrowserStorage();
    if (stored) setPrefs(stored);

    function handleChange(e: Event) {
      setPrefs((e as CustomEvent<FocusPrefs>).detail);
    }

    window.addEventListener(PREFS_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, handleChange);
  }, []);

  const persist = useCallback((next: FocusPrefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(PREFS_CHANGE_EVENT, { detail: next }));
    } catch {
      // localStorage not available — keep in-memory state only
    }
  }, []);

  const setFocusMode = useCallback(
    (value: boolean) => persist({ ...readPrefsFromBrowserStorage() ?? DEFAULT_PREFS, focusMode: value }),
    [persist]
  );

  const setExtendedTime = useCallback(
    (value: ExtendedTime) => persist({ ...readPrefsFromBrowserStorage() ?? DEFAULT_PREFS, extendedTime: value }),
    [persist]
  );

  const setEnergyCheckIn = useCallback(
    (value: boolean) => persist({ ...readPrefsFromBrowserStorage() ?? DEFAULT_PREFS, energyCheckIn: value }),
    [persist]
  );

  return {
    prefs,
    setFocusMode,
    setExtendedTime,
    setEnergyCheckIn,
    timeMultiplier: extendedTimeToMultiplier(prefs.extendedTime),
  };
}
