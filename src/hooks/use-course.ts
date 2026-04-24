"use client";

import { useState, useEffect, useCallback } from "react";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

const STORAGE_KEY = "ap_selected_course";
const DEFAULT_COURSE: ApCourse = "AP_WORLD_HISTORY";
const COURSE_CHANGE_EVENT = "ap-course-change";

function readCourseFromBrowserStorage(): ApCourse | null {
  if (typeof window === "undefined") return null;
  // Try localStorage first
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ApCourse | null;
    if (stored && VALID_AP_COURSES.includes(stored)) return stored;
  } catch { /* localStorage not available */ }
  // Fall back to cookie (set by setCourse for server-component reads)
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]+)`));
    if (match) {
      const decoded = decodeURIComponent(match[1]) as ApCourse;
      if (VALID_AP_COURSES.includes(decoded)) return decoded;
    }
  } catch { /* document.cookie not available */ }
  return null;
}

/**
 * Returns the user's selected course. Initializer reads localStorage AND
 * cookie SYNCHRONOUSLY so the first client render already has the real
 * value — no flash of the default course before the real value loads.
 *
 * Earlier version returned the default immediately and only loaded the
 * stored value in useEffect. That race caused AP Chemistry users to
 * briefly see AP World History flashcards (real user report 2026-04-24).
 */
export function useCourse(): [ApCourse, (course: ApCourse) => void] {
  const [course, setCourseState] = useState<ApCourse>(() => {
    return readCourseFromBrowserStorage() ?? DEFAULT_COURSE;
  });

  useEffect(() => {
    // Re-read in case the initializer ran in an SSR-style context
    // where window was undefined. Picks up any stored value the
    // synchronous initializer missed.
    const stored = readCourseFromBrowserStorage();
    if (stored && stored !== course) setCourseState(stored);

    function handleCourseChange(e: Event) {
      setCourseState((e as CustomEvent<ApCourse>).detail);
    }

    window.addEventListener(COURSE_CHANGE_EVENT, handleCourseChange);
    return () => window.removeEventListener(COURSE_CHANGE_EVENT, handleCourseChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCourse = useCallback((newCourse: ApCourse) => {
    setCourseState(newCourse);
    try {
      localStorage.setItem(STORAGE_KEY, newCourse);
      document.cookie = `${STORAGE_KEY}=${newCourse}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent(COURSE_CHANGE_EVENT, { detail: newCourse }));
    } catch {
      // localStorage not available
    }
  }, []);

  return [course, setCourse];
}
