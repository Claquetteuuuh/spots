/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  headingDelta,
  headingFromOrientation,
  unwrapHeading,
  useLivePosition,
} from "../use-live-position";

describe("heading maths", () => {
  it("headingDelta takes the short way round", () => {
    expect(headingDelta(350, 10)).toBe(20);
    expect(headingDelta(10, 350)).toBe(-20);
    expect(headingDelta(0, 180)).toBe(180);
    expect(headingDelta(90, 90)).toBe(0);
  });

  it("unwrapHeading keeps the angle continuous across north", () => {
    expect(unwrapHeading(null, 30)).toBe(30);
    expect(unwrapHeading(350, 10)).toBe(370);
    expect(unwrapHeading(370, 355)).toBe(355);
    expect(unwrapHeading(-10, 340)).toBe(-20);
  });

  it("headingFromOrientation prefers the iOS compass, flips absolute alpha, ignores the rest", () => {
    const ev = (init: Record<string, unknown>) => init as unknown as DeviceOrientationEvent;
    expect(headingFromOrientation(ev({ webkitCompassHeading: 45, alpha: 0 }))).toBe(45);
    expect(headingFromOrientation(ev({ absolute: true, alpha: 90 }))).toBe(270);
    expect(headingFromOrientation(ev({ absolute: false, alpha: 90 }))).toBeNull();
    expect(headingFromOrientation(ev({ alpha: null }))).toBeNull();
  });
});

describe("useLivePosition", () => {
  const clearWatch = vi.fn();
  let onPosition: PositionCallback | null = null;

  function stubGeolocation() {
    onPosition = null;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: (ok: PositionCallback) => {
          onPosition = ok;
          return 7;
        },
        clearWatch,
      },
    });
  }

  type Value = ReturnType<typeof useLivePosition>;
  /** The hook's latest return value, read off a probe component. */
  const latest: { current: Value | null } = { current: null };
  function Probe() {
    latest.current = useLivePosition();
    return null;
  }
  async function mount() {
    latest.current = null;
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<Probe />);
    });
    return view;
  }

  const fix = (extra: Partial<GeolocationCoordinates> = {}) =>
    ({
      coords: {
        latitude: 48.85,
        longitude: 2.35,
        accuracy: 12,
        heading: null,
        speed: null,
        ...extra,
      },
    }) as GeolocationPosition;

  const orient = (webkitCompassHeading: number) => {
    const e = new Event("deviceorientation") as Event & { webkitCompassHeading: number };
    e.webkitCompassHeading = webkitCompassHeading;
    window.dispatchEvent(e);
  };

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
  });

  it("stays null without the Geolocation API", async () => {
    await mount();
    expect(latest.current?.position).toBeNull();
  });

  it("follows the GPS, then the compass, turning the short way across north", async () => {
    stubGeolocation();
    await mount();

    await act(async () => onPosition!(fix()));
    expect(latest.current?.position).toMatchObject({ latitude: 48.85, accuracy: 12, heading: null });

    await act(async () => orient(350));
    expect(latest.current?.position?.heading).toBe(350);

    // Events inside the throttle window are dropped; step past it
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 200);
    await act(async () => orient(10));
    expect(latest.current?.position?.heading).toBe(370);
  });

  it("uses the GPS course only while moving and only before any compass reading", async () => {
    stubGeolocation();
    await mount();

    await act(async () => onPosition!(fix({ heading: 90, speed: 0.2 })));
    expect(latest.current?.position?.heading).toBeNull();

    await act(async () => onPosition!(fix({ heading: 90, speed: 3 })));
    expect(latest.current?.position?.heading).toBe(90);
  });

  it("stops watching when the tab is hidden and on unmount", async () => {
    stubGeolocation();
    const view = await mount();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(clearWatch).toHaveBeenCalledWith(7);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    clearWatch.mockClear();
    await act(async () => view.unmount());
    expect(clearWatch).toHaveBeenCalledWith(7);
  });
});
