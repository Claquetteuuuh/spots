import { act, renderHook } from "@testing-library/react-native";

const mockLive: {
  position: ((p: { coords: Record<string, number | null> }) => void) | null;
  heading: ((h: { trueHeading: number; magHeading: number; accuracy: number }) => void) | null;
  removePosition: jest.Mock;
  removeHeading: jest.Mock;
  status: string;
} = { position: null, heading: null, removePosition: jest.fn(), removeHeading: jest.fn(), status: "granted" };

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: mockLive.status })),
  watchPositionAsync: jest.fn((_opts: unknown, cb: typeof mockLive.position) => {
    mockLive.position = cb;
    return Promise.resolve({ remove: mockLive.removePosition });
  }),
  watchHeadingAsync: jest.fn((cb: typeof mockLive.heading) => {
    mockLive.heading = cb;
    return Promise.resolve({ remove: mockLive.removeHeading });
  }),
}));

import * as Location from "expo-location";
import { headingFromCompass, useLiveLocation } from "../use-live-location";

const fix = { coords: { latitude: 48.86, longitude: 2.36, accuracy: 8 } };

beforeEach(() => {
  jest.clearAllMocks();
  mockLive.position = null;
  mockLive.heading = null;
  mockLive.status = "granted";
});

describe("headingFromCompass", () => {
  it("prefers true north, falls back to magnetic, gives up on neither", () => {
    expect(headingFromCompass({ trueHeading: 90, magHeading: 92 })).toBe(90);
    expect(headingFromCompass({ trueHeading: -1, magHeading: 92 })).toBe(92);
    expect(headingFromCompass({ trueHeading: -1, magHeading: -1 })).toBeNull();
  });
});

describe("useLiveLocation", () => {
  it("does nothing while disabled or without the permission", async () => {
    const { result, rerender } = await renderHook(
      (enabled: boolean) => useLiveLocation(enabled),
      { initialProps: false },
    );
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();

    mockLive.status = "denied";
    await rerender(true);
    await act(async () => {});
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("reports fixes and compass headings, then lets both go on unmount", async () => {
    const { result, unmount } = await renderHook(() => useLiveLocation(true));
    await act(async () => {});
    expect(mockLive.position).not.toBeNull();

    await act(async () => mockLive.position!(fix));
    expect(result.current).toEqual({ latitude: 48.86, longitude: 2.36, accuracy: 8, heading: null });

    await act(async () => mockLive.heading!({ trueHeading: 90, magHeading: 92, accuracy: 1 }));
    expect(result.current?.heading).toBe(90);

    // A jitter of under 2° is ignored, a real turn is not
    await act(async () => mockLive.heading!({ trueHeading: 91, magHeading: 92, accuracy: 1 }));
    expect(result.current?.heading).toBe(90);

    await unmount();
    expect(mockLive.removePosition).toHaveBeenCalledTimes(1);
    expect(mockLive.removeHeading).toHaveBeenCalledTimes(1);
  });

  it("stops the watchers when disabled again", async () => {
    const { result, rerender } = await renderHook(
      (enabled: boolean) => useLiveLocation(enabled),
      { initialProps: true },
    );
    await act(async () => {});
    await act(async () => mockLive.position!(fix));
    expect(result.current).not.toBeNull();

    await rerender(false);
    expect(mockLive.removePosition).toHaveBeenCalled();
    expect(result.current).toBeNull();
  });
});
