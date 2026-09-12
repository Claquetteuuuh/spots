/**
 * The maths behind the photo lightbox: a scale and an offset, with the
 * point under the finger staying put as the photo grows.
 */
export interface ZoomState {
  scale: number;
  /** Offset of the photo's centre from the frame's centre, in pixels. */
  x: number;
  y: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** What a double-tap zooms to. */
export const TAP_ZOOM = 2.5;

export const IDENTITY: ZoomState = { scale: 1, x: 0, y: 0 };

export function clampScale(scale: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

/**
 * Multiply the scale by `factor`, keeping the point (px, py) — measured
 * from the frame's centre — over the same bit of photo. Back at 1× the
 * photo snaps to the centre.
 */
export function zoomAround(state: ZoomState, factor: number, px: number, py: number): ZoomState {
  const scale = clampScale(state.scale * factor);
  if (scale === MIN_ZOOM) return IDENTITY;
  const k = scale / state.scale;
  return { scale, x: px - (px - state.x) * k, y: py - (py - state.y) * k };
}

/** Drag the photo; a photo at 1× has nowhere to go. */
export function pan(state: ZoomState, dx: number, dy: number): ZoomState {
  if (state.scale === MIN_ZOOM) return state;
  return { ...state, x: state.x + dx, y: state.y + dy };
}

/** Double-tap: zoom in on the tapped point, or back out to fit. */
export function toggleZoom(state: ZoomState, px: number, py: number): ZoomState {
  return state.scale > MIN_ZOOM ? IDENTITY : zoomAround(IDENTITY, TAP_ZOOM, px, py);
}

/** A wheel notch becomes a gentle factor: down (positive delta) zooms out. */
export function wheelFactor(deltaY: number): number {
  return Math.exp(-deltaY * 0.002);
}
