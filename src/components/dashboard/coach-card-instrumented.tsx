"use client";

/**
 * Thin client wrapper around <CoachCard> so that the server-rendered
 * dashboard page can still emit a "dashboard loaded" impression event
 * and thread the resulting impressionId down into the CoachCard for
 * the downstream funnel events (requested / rendered / clicked).
 *
 * Two stages:
 *   1. On mount, POST /api/analytics/dashboard-event with event="loaded"
 *      → server returns { impressionId }, we stash it in state.
 *   2. Pass impressionId down to <CoachCard>. If it's still null when
 *      the card fires its coach-plan fetch, the card skips that one
 *      round of events rather than blocking render.
 *
 * Analytics is fire-and-forget — a failing POST leaves impressionId
 * null, which is fine.
 */

import { useEffect, useState } from "react";
import { CoachCard } from "./coach-card";

interface Props {
  course: string;
}

export function CoachCardInstrumented({ course }: Props) {
  const [impressionId, setImpressionId] = useState<string | null>(null);

  useEffect(() => {
    setImpressionId(null);
    fetch("/api/analytics/dashboard-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, event: "loaded" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.impressionId) setImpressionId(d.impressionId);
      })
      .catch(() => { /* silent — analytics never blocks the UI */ });
  }, [course]);

  return <CoachCard course={course} impressionId={impressionId} />;
}
