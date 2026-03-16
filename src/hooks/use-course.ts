"use client";

import { useState, useEffect, useCallback } from "react";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

const STORAGE_KEY = "ap_selected_course";
const DEFAULT_COURSE: ApCourse = "AP_WORLD_HISTORY";
const COURSE_CHANGE_EVENT = "ap-course-change";

export function useCourse(): [ApCourse, (course: ApCourse) => void] {
  const [course, setCourseState] = useState<ApCourse>(DEFAULT_COURSE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ApCourse | null;
      if (stored && VALID_AP_COURSES.includes(stored)) {
        setCourseState(stored);
      }
    } catch {
      // localStorage not available
    }

    function handleCourseChange(e: Event) {
      setCourseState((e as CustomEvent<ApCourse>).detail);
    }

    window.addEventListener(COURSE_CHANGE_EVENT, handleCourseChange);
    return () => window.removeEventListener(COURSE_CHANGE_EVENT, handleCourseChange);
  }, []);

  const setCourse = useCallback((newCourse: ApCourse) => {
    setCourseState(newCourse);
    try {
      localStorage.setItem(STORAGE_KEY, newCourse);
      // Also write to cookie so server components can read the selected course
      document.cookie = `${STORAGE_KEY}=${newCourse}; path=/; max-age=31536000; SameSite=Lax`;
      // Notify all other useCourse() instances on the page
      window.dispatchEvent(new CustomEvent(COURSE_CHANGE_EVENT, { detail: newCourse }));
    } catch {
      // localStorage not available
    }
  }, []);

  return [course, setCourse];
}
