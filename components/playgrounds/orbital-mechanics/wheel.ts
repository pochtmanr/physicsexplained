/** Nominal CSS line height for WheelEvent.deltaMode === DOM_DELTA_LINE. */
const LINE_HEIGHT_PX = 16;
/** One physical mouse notch ≈ 120px; cap momentum flings to a single notch. */
const MAX_NOTCH_PX = 120;

/**
 * Convert a WheelEvent's deltaY to clamped pixel units. Firefox on Windows
 * reports line-mode deltas (deltaY ≈ ±3 per notch vs ±100px in Chrome),
 * which made zoom effectively dead there.
 */
export function normalizeWheelDelta(
  deltaY: number,
  deltaMode: number,
  viewportH: number,
): number {
  const px =
    deltaMode === 1 ? deltaY * LINE_HEIGHT_PX :
    deltaMode === 2 ? deltaY * viewportH :
    deltaY;
  return Math.max(-MAX_NOTCH_PX, Math.min(MAX_NOTCH_PX, px));
}
