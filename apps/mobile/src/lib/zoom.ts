/**
 * The photo lightbox's zoom limits. Worklets, so the gesture handlers can
 * call them on the UI thread.
 */
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** What a double-tap zooms to. */
export const TAP_ZOOM = 2.5;

export function clampZoom(scale: number): number {
  "worklet";
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

/** Double-tap: zoom in, or back out to fit when already zoomed. */
export function nextTapZoom(scale: number): number {
  "worklet";
  return scale > MIN_ZOOM ? MIN_ZOOM : TAP_ZOOM;
}
