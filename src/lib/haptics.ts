/**
 * Haptic feedback helpers (ported from PrepLion).
 *
 * All calls are fire-and-forget — `navigator.vibrate` is optional on
 * desktop/iOS Safari, and every invocation is wrapped in a try/catch
 * so consumers never need to null-check.
 *
 * Intensity mapping (empirical; aligns with PrepLion UX):
 *   light   — button taps, neutral transitions
 *   medium  — unit selections, destination taps
 *   success — correct answer, mastery tier crossing, milestone
 *   error   — wrong answer, destructive confirmation
 */

export function hapticLight() {
  try { navigator?.vibrate?.(10); } catch { /* ignore */ }
}

export function hapticMedium() {
  try { navigator?.vibrate?.(25); } catch { /* ignore */ }
}

export function hapticSuccess() {
  try { navigator?.vibrate?.([15, 50, 15]); } catch { /* ignore */ }
}

export function hapticError() {
  try { navigator?.vibrate?.([30, 30, 30]); } catch { /* ignore */ }
}
