"use client";

import { useState, useEffect, useCallback } from "react";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

const STORAGE_KEY = "ap_selected_course";
const DEFAULT_COURSE: ApCourse = "AP_WORLD_HISTORY";

export function useCourse(): [ApCourse, (course: ApCourse) => void] {
  const [course, setCourseState] = useState<ApCourse>(DEFAULT_COURSE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ApCourse | null;
      // Validation derived from registry — no hardcoded list.
      if (stored && VALID_AP_COURSES.includes(stored)) {
        setCourseState(stored);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const setCourse = useCallback((newCourse: ApCourse) => {
    setCourseState(newCourse);
    try {
      localStorage.setItem(STORAGE_KEY, newCourse);
    } catch {
      // localStorage not available
    }
  }, []);

  return [course, setCourse];
}
