"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface LivePosition {
  latitude: number;
  longitude: number;
  /** Metres, from the browser. */
  accuracy: number;
  /**
   * Degrees clockwise from north, kept continuous across the 360° seam
   * (it may read 370 for 10°) so a CSS transition turns the short way.
   * Null until a compass or a moving GPS fix says which way we face.
   */
  heading: number | null;
}

/** Compass events fire far faster than a cone needs to move. */
const HEADING_MIN_INTERVAL_MS = 100;
/** Below this speed a GPS course is noise. */
const GPS_COURSE_MIN_SPEED = 1;

/** Shortest signed difference between two compass angles, in (-180, 180]. */
export function headingDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Bring `next` (0–360) onto the same turn as `current`, so 350 → 10 reads as +20, not −340. */
export function unwrapHeading(current: number | null, next: number): number {
  if (current === null) return next;
  return current + headingDelta(((current % 360) + 360) % 360, next);
}

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

/**
 * A compass heading from an orientation event, or null when the event
 * carries none: iOS gives `webkitCompassHeading` directly; elsewhere an
 * absolute `alpha` counts counter-clockwise, so it is flipped.
 */
export function headingFromOrientation(e: OrientationEvent): number | null {
  if (typeof e.webkitCompassHeading === "number" && Number.isFinite(e.webkitCompassHeading)) {
    return e.webkitCompassHeading;
  }
  if (e.absolute && typeof e.alpha === "number" && Number.isFinite(e.alpha)) {
    return (360 - e.alpha) % 360;
  }
  return null;
}

/**
 * iOS shares the compass only after a prompt raised from a user gesture;
 * everywhere else this is a no-op. Must be called synchronously inside
 * the gesture's handler.
 */
function requestCompassPermission(): Promise<void> {
  const ctor = (
    globalThis as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }
  ).DeviceOrientationEvent;
  if (typeof ctor?.requestPermission !== "function") return Promise.resolve();
  return ctor.requestPermission().then(
    () => undefined,
    () => undefined, // Denied or not from a gesture — the dot still shows, without a cone
  );
}

/**
 * Where the device is and which way it faces, live, while the page is
 * visible. Nothing runs without the Geolocation API; the compass is
 * optional on top. iOS hands out the compass only after a permission
 * prompt raised from a gesture: the first tap or pan on the page asks,
 * and `requestHeadingPermission` lets a button ask again.
 */
export function useLivePosition(enabled = true): {
  position: LivePosition | null;
  requestHeadingPermission: () => Promise<void>;
} {
  const [position, setPosition] = useState<LivePosition | null>(null);
  const headingRef = useRef<number | null>(null);
  const compassSeenRef = useRef(false);
  const lastHeadingAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const geolocation = navigator.geolocation;

    let watchId: number | null = null;

    const onOrientation = (event: Event) => {
      const now = Date.now();
      if (now - lastHeadingAtRef.current < HEADING_MIN_INTERVAL_MS) return;
      const heading = headingFromOrientation(event as OrientationEvent);
      if (heading === null) return;
      lastHeadingAtRef.current = now;
      compassSeenRef.current = true;
      headingRef.current = unwrapHeading(headingRef.current, heading);
      setPosition((p) => (p ? { ...p, heading: headingRef.current } : p));
    };

    const onPosition: PositionCallback = ({ coords }) => {
      // Moving with no compass: the GPS course is the next best thing
      if (
        !compassSeenRef.current &&
        typeof coords.heading === "number" &&
        Number.isFinite(coords.heading) &&
        (coords.speed ?? 0) >= GPS_COURSE_MIN_SPEED
      ) {
        headingRef.current = unwrapHeading(headingRef.current, coords.heading);
      }
      setPosition({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: headingRef.current,
      });
    };

    const start = () => {
      if (watchId !== null) return;
      watchId = geolocation.watchPosition(onPosition, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 20_000,
      });
      window.addEventListener("deviceorientationabsolute", onOrientation);
      window.addEventListener("deviceorientation", onOrientation);
    };
    const stop = () => {
      if (watchId !== null) {
        geolocation.clearWatch(watchId);
        watchId = null;
      }
      window.removeEventListener("deviceorientationabsolute", onOrientation);
      window.removeEventListener("deviceorientation", onOrientation);
    };
    // A hidden tab needs neither the GPS nor the compass running
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    // The first gesture on the page unlocks the compass on iOS
    const onFirstGesture = () => {
      void requestCompassPermission();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
    document.addEventListener("keydown", onFirstGesture, { once: true, passive: true });
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onFirstGesture);
      document.removeEventListener("keydown", onFirstGesture);
    };
  }, [enabled]);

  const requestHeadingPermission = useCallback(() => requestCompassPermission(), []);

  // Switched off: nothing is reported, whatever the last fix was
  return { position: enabled ? position : null, requestHeadingPermission };
}
