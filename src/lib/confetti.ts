"use client";

/**
 * Confetti celebrations (ported from PrepLion).
 *
 * Three tiers:
 *   Big    — pass-probability crosses 70%+, mock-exam pass, 80%+ practice
 *   Medium — session complete, streak milestone
 *   Small  — first session of the day, 5-in-a-row streak
 *
 * No-op safely if canvas-confetti isn't available (e.g., SSR) — the
 * library handles feature detection internally.
 */

import confetti from "canvas-confetti";

export function celebrateBig() {
  const end = Date.now() + 1500;
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function celebrateMedium() {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.7 },
    colors: ["#10b981", "#3b82f6", "#f59e0b"],
  });
}

export function celebrateSmall() {
  confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, scalar: 0.8 });
}
