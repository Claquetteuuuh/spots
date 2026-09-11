import { useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

export interface LiveLocation {
  latitude: number;
  longitude: number;
  /** Metres, or null when the fix has none. */
  accuracy: number | null;
  /** Degrees clockwise from north; null until the compass answers. */
  heading: number | null;
}

/** Compass updates fire far faster than a cone needs to move. */
const HEADING_MIN_INTERVAL_MS = 100;
/** Below this the cone would just jitter. */
const HEADING_MIN_CHANGE_DEG = 2;

/** True north when the device knows it, magnetic otherwise, null when neither. */
export function headingFromCompass(h: { trueHeading: number; magHeading: number }): number | null {
  if (h.trueHeading >= 0) return h.trueHeading;
  if (h.magHeading >= 0) return h.magHeading;
  return null;
}

/**
 * Where the device is and which way it faces, live, while `enabled` and
 * the app is in the foreground. Never prompts: the caller asks for the
 * location permission (the map's "locate me" does) and enables this once
 * it is granted.
 */
export function useLiveLocation(enabled: boolean): LiveLocation | null {
  const [location, setLocation] = useState<LiveLocation | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let positionSub: Location.LocationSubscription | null = null;
    let headingSub: Location.LocationSubscription | null = null;
    let heading: number | null = null;
    let lastHeadingAt = 0;

    const stop = () => {
      positionSub?.remove();
      headingSub?.remove();
      positionSub = null;
      headingSub = null;
    };

    const start = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted" || cancelled || positionSub) return;
      positionSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 2_000, distanceInterval: 3 },
        ({ coords }) => {
          if (cancelled) return;
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? null,
            heading,
          });
        },
      );
      headingSub = await Location.watchHeadingAsync((h) => {
        if (cancelled) return;
        const next = headingFromCompass(h);
        const now = Date.now();
        if (next === null || now - lastHeadingAt < HEADING_MIN_INTERVAL_MS) return;
        if (heading !== null && Math.abs(next - heading) < HEADING_MIN_CHANGE_DEG) return;
        lastHeadingAt = now;
        heading = next;
        setLocation((l) => (l ? { ...l, heading: next } : l));
      });
      // Permission may have been revoked meanwhile, or we were stopped
      if (cancelled) stop();
    };

    void start();
    // The GPS and compass stay off while the app is in the background
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void start();
      else stop();
    });
    return () => {
      cancelled = true;
      stop();
      sub.remove();
    };
  }, [enabled]);

  return enabled ? location : null;
}
