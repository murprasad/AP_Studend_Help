"use client";

/**
 * PassReadyCertGate — conditionally renders the PassReadyCert when the
 * user has demonstrably passing-quality results.
 *
 * Criteria (from PRD §4.4):
 *   - passProbability >= 0.75
 *   - sampleSize >= 30 (enough confidence to ship the share)
 *
 * Self-contained: fetches /api/pass-probability + a stats endpoint for
 * studyDays + sessionsCount. Shows nothing while loading or if criteria
 * aren't met — so the dashboard layout is unaffected.
 */

import { useEffect, useState } from "react";
import { PassReadyCert } from "./pass-ready-cert";

interface Props {
  course: string;
  courseDisplayName: string;
  studentName: string;
}

interface PassProbResponse {
  passProbability: number | null;
  sampleSize: number;
}

export function PassReadyCertGate({ course, courseDisplayName, studentName }: Props) {
  const [shouldRender, setShouldRender] = useState(false);
  const [pp, setPp] = useState(0);
  const [studyDays, setStudyDays] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ppRes, statsRes] = await Promise.all([
          fetch(`/api/pass-probability?course=${encodeURIComponent(course)}`),
          fetch(`/api/dashboard?course=${encodeURIComponent(course)}`),
        ]);
        if (!ppRes.ok) return;
        const d: PassProbResponse = await ppRes.json();
        if (d.passProbability === null || d.passProbability < 0.75 || d.sampleSize < 30) return;
        const stats = statsRes.ok ? await statsRes.json() : null;
        const days = Number(stats?.user?.studyDays ?? stats?.streakDays ?? 0) || 0;
        const sess = Number(stats?.sessions?.total ?? 0) || 0;
        if (cancelled) return;
        setPp(Math.round(d.passProbability * 100));
        setStudyDays(days);
        setSessionsCount(sess);
        setShouldRender(true);
      } catch {
        /* silent — cert is optional */
      }
    })();
    return () => { cancelled = true; };
  }, [course]);

  if (!shouldRender) return null;

  return (
    <PassReadyCert
      studentName={studentName}
      course={course}
      courseDisplayName={courseDisplayName}
      predictedPassPercent={pp}
      studyDays={studyDays || 1}
      sessionsCount={sessionsCount || 1}
    />
  );
}
