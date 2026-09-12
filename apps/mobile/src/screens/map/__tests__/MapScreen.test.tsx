import React, { act } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import {
  MAP_PINS_LIMIT,
  padBounds,
  quantizeBounds,
  regionToBounds,
  type MapPin,
} from "@trs/shared/map";

// ─── Mocks ──────────────────────────────────────────────────────────

jest.mock("react-i18next", () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    initReactI18next: { type: "3rdParty", init: jest.fn() },
  };
});

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

// The filter sheet's drawer runs on native gestures and animations (tested on
// its own); here a plain view shows its content whenever it is visible.
jest.mock("../../../components/ui/Drawer", () => {
  const ReactActual = require("react");
  const { View, Pressable } = require("react-native");
  return {
    Drawer: ({ visible, onClose, children, testID }: { visible: boolean; onClose: () => void; children: React.ReactNode; testID?: string }) =>
      visible
        ? ReactActual.createElement(
            View,
            { testID },
            ReactActual.createElement(Pressable, { testID: "drawer-backdrop", onPress: onClose }),
            children,
          )
        : null,
  };
});

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(),
}));

/** Live watchers hand their callbacks out so tests can feed fixes and headings. */
const mockLive: {
  position: ((p: { coords: Record<string, number | null> }) => void) | null;
  heading: ((h: { trueHeading: number; magHeading: number; accuracy: number }) => void) | null;
  removePosition: jest.Mock;
  removeHeading: jest.Mock;
} = { position: null, heading: null, removePosition: jest.fn(), removeHeading: jest.fn() };

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 48.8566, longitude: 2.3522 } }),
  ),
  watchPositionAsync: jest.fn((_opts: unknown, cb: typeof mockLive.position) => {
    mockLive.position = cb;
    return Promise.resolve({ remove: mockLive.removePosition });
  }),
  watchHeadingAsync: jest.fn((cb: typeof mockLive.heading) => {
    mockLive.heading = cb;
    return Promise.resolve({ remove: mockLive.removeHeading });
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const mockSetTabIndex = jest.fn();
jest.mock("../../../navigation/tab-context", () => ({
  useTabSwitch: () => ({ setTabIndex: mockSetTabIndex, activeIndex: 0 }),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

/**
 * A MapView that records its props (so tests can settle a region) and
 * exposes `animateToRegion` through its ref, plus a pressable Marker.
 */
const mockAnimateToRegion = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapViewProps: { current: any } = { current: null };
jest.mock("react-native-maps", () => {
  const ReactActual = require("react");
  const { View, Pressable } = require("react-native");
  const MapView = ReactActual.forwardRef(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any, ref: React.Ref<unknown>) => {
      mapViewProps.current = props;
      ReactActual.useImperativeHandle(ref, () => ({ animateToRegion: mockAnimateToRegion }));
      return ReactActual.createElement(
        Pressable,
        {
          testID: props.testID,
          onPress: () => props.onPress?.({ nativeEvent: { action: "press" } }),
        },
        props.children,
      );
    },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Marker = (props: any) =>
    ReactActual.createElement(
      Pressable,
      {
        onPress: props.onPress,
        testID: props.testID,
        accessibilityLabel: props.accessibilityLabel,
        // Surface the native rotation so tests can read it
        accessibilityValue: props.rotation !== undefined ? { now: props.rotation } : undefined,
      },
      props.children,
    );
  return {
    __esModule: true,
    default: MapView,
    Marker,
    Circle: View,
    Callout: View,
    PROVIDER_DEFAULT: null,
  };
});

import { useAuthStore } from "../../../stores/auth-store";
import { invalidateMapCache, useSpotsStore } from "../../../stores/spots-store";
import { usePreferencesStore } from "../../../stores/preferences-store";
import { MapScreen } from "../MapScreen";
import type { User } from "../../../types";

// ─── Fixtures ───────────────────────────────────────────────────────

const USER = { id: "owner-1", email: "a@b.c", username: "alice", name: "Alice" } as User;

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};
/** A tight view that still holds all three pins — past the max cluster zoom. */
const CLOSE_REGION = { ...DEFAULT_REGION, latitudeDelta: 0.004, longitudeDelta: 0.004 };
/** Lyon — outside anything fetched around Paris. */
const FAR_REGION = { ...DEFAULT_REGION, latitude: 45.764, longitude: 4.8357 };

const pin = (
  id: string,
  latitude: number,
  longitude: number,
  extra: Partial<MapPin> = {},
): MapPin => ({
  id,
  latitude,
  longitude,
  title: `Spot ${id}`,
  photoUrl: `https://cdn.example.com/${id}.jpg`,
  city: "Paris",
  userId: "owner-1",
  isOwn: true,
  colors: ["#C44536"],
  compositions: ["SYMMETRY"],
  accessibility: null,
  ...extra,
});

// Three pins within ~100 m of each other.
const CLUSTERED_PINS = [
  pin("a", 48.8566, 2.3522),
  pin("b", 48.857, 2.353),
  pin("c", 48.8571, 2.3515),
];

const mockFetchMapPins = jest.fn();

// ─── Helpers ────────────────────────────────────────────────────────

async function settleRegion(region: typeof DEFAULT_REGION) {
  await act(async () => {
    mapViewProps.current.onRegionChangeComplete(region);
  });
}

/** Outlast the fetch debounce. */
const outlastDebounce = () => act(() => new Promise<void>((r) => setTimeout(r, 400)));

const backgroundOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style).backgroundColor;

// CI runners are slower — give module loading time.
jest.setTimeout(15_000);

beforeEach(() => {
  jest.clearAllMocks();
  mapViewProps.current = null;
  mockLive.position = null;
  mockLive.heading = null;
  mockFetchMapPins.mockResolvedValue(true);
  useAuthStore.setState({ user: USER });
  useSpotsStore.setState({
    mapPins: [],
    mapTruncated: false,
    isMapLoading: false,
    mapCacheVersion: 0,
    fetchMapPins: mockFetchMapPins,
  });
});

// ─── Tests ──────────────────────────────────────────────────────────

describe("MapScreen", () => {
  it("fetches pins for the padded default view on mount", async () => {
    await render(<MapScreen />);

    await waitFor(() =>
      expect(mockFetchMapPins).toHaveBeenCalledWith({
        bounds: quantizeBounds(padBounds(regionToBounds(DEFAULT_REGION))),
        scope: "all",
        limit: MAP_PINS_LIMIT,
        filters: {},
      }),
    );
  });

  it("re-asks for the view the moment the map cache is dropped", async () => {
    await render(<MapScreen />);
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(1));

    await act(async () => {
      invalidateMapCache();
    });

    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(2));
  });

  it("groups nearby pins into a counted cluster and splits them when zoomed in", async () => {
    useSpotsStore.setState({ mapPins: CLUSTERED_PINS });
    await render(<MapScreen />);

    await settleRegion(DEFAULT_REGION);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.queryByTestId("pin-a")).toBeNull();

    await settleRegion(CLOSE_REGION);
    expect(screen.queryByText("3")).toBeNull();
    expect(screen.getByTestId("pin-a")).toBeTruthy();
    expect(screen.getByTestId("pin-b")).toBeTruthy();
    expect(screen.getByTestId("pin-c")).toBeTruthy();
  });

  it("zooms in on a tapped cluster", async () => {
    useSpotsStore.setState({ mapPins: CLUSTERED_PINS });
    await render(<MapScreen />);
    await settleRegion(DEFAULT_REGION);
    mockAnimateToRegion.mockClear();

    await fireEvent.press(screen.getByText("3"));

    expect(mockAnimateToRegion).toHaveBeenCalledTimes(1);
    const [target] = mockAnimateToRegion.mock.calls[0];
    expect(target.latitude).toBeCloseTo(48.8569, 3);
    expect(target.longitude).toBeCloseTo(2.3522, 3);
    // Far tighter than the 0.1° view it was tapped from
    expect(target.longitudeDelta).toBeLessThan(0.02);
  });

  it("shows a preview card for a tapped pin, and opens the spot from it", async () => {
    useSpotsStore.setState({ mapPins: [pin("a", 48.8566, 2.3522)] });
    await render(<MapScreen />);
    await settleRegion(CLOSE_REGION);

    expect(screen.queryByTestId("spot-preview")).toBeNull();

    await fireEvent.press(screen.getByTestId("pin-a"));

    const card = screen.getByTestId("spot-preview");
    expect(screen.getByText("Spot a")).toBeTruthy();
    expect(screen.getByText("Paris")).toBeTruthy();
    expect(screen.getByTestId("pin-halo")).toBeTruthy();

    await fireEvent.press(card);

    expect(mockNavigate).toHaveBeenCalledWith("SpotDetail", { spotId: "a" });
  });

  it("falls back to the untitled label and dismisses on a map tap", async () => {
    useSpotsStore.setState({ mapPins: [pin("a", 48.8566, 2.3522, { title: null, city: null })] });
    await render(<MapScreen />);
    await settleRegion(CLOSE_REGION);

    await fireEvent.press(screen.getByTestId("pin-a"));
    expect(screen.getByText("spots.untitled")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("map-view"));

    expect(screen.queryByTestId("spot-preview")).toBeNull();
    expect(screen.queryByTestId("pin-halo")).toBeNull();
  });

  it("skips the request for a pan inside the fetched area, refetches for a far one", async () => {
    await render(<MapScreen />);
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(1));

    await settleRegion({ ...DEFAULT_REGION, latitude: 48.86 });
    await outlastDebounce();
    expect(mockFetchMapPins).toHaveBeenCalledTimes(1);

    await settleRegion(FAR_REGION);
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(2));
    expect(mockFetchMapPins).toHaveBeenLastCalledWith(
      expect.objectContaining({ bounds: quantizeBounds(padBounds(regionToBounds(FAR_REGION))) }),
    );
  });

  it("refetches an inner view when the last fetch was truncated", async () => {
    mockFetchMapPins.mockImplementation(async () => {
      useSpotsStore.setState({ mapTruncated: true });
      return true;
    });
    await render(<MapScreen />);
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(1));

    await settleRegion(CLOSE_REGION);

    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(2));
  });

  it("refetches with the new scope when a chip is pressed", async () => {
    await render(<MapScreen />);
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(1));

    await fireEvent.press(screen.getByText("map.mySpots"));

    await waitFor(() =>
      expect(mockFetchMapPins).toHaveBeenLastCalledWith(expect.objectContaining({ scope: "mine" })),
    );
  });

  it("tints followed users' pins lighter than own pins", async () => {
    useSpotsStore.setState({
      mapPins: [
        // Without colours of their own, the dots fall back to the accent and its tint
        pin("mine", 48.8566, 2.3522, { colors: [] }),
        pin("theirs", 48.8, 2.3, { userId: "u2", isOwn: false, colors: [] }),
      ],
    });
    await render(<MapScreen />);
    await settleRegion({ ...DEFAULT_REGION, latitudeDelta: 0.2, longitudeDelta: 0.2 });

    expect(backgroundOf("pin-dot-mine")).not.toBe(backgroundOf("pin-dot-theirs"));
  });
});

describe("MapScreen — you are here", () => {
  it("shows the live dot once a fix arrives and turns it with the compass", async () => {
    await render(<MapScreen />);
    // "Locate me" on mount grants the permission, which starts the watchers
    await waitFor(() => expect(mockLive.position).not.toBeNull());
    expect(screen.queryByTestId("user-location")).toBeNull();

    await act(async () => {
      mockLive.position!({ coords: { latitude: 48.86, longitude: 2.36, accuracy: 8 } });
    });
    const dot = screen.getByTestId("user-location");
    expect(dot.props.accessibilityValue).toEqual({ now: 0 });
    expect(screen.queryByTestId("user-heading")).toBeNull();

    await act(async () => {
      mockLive.heading!({ trueHeading: 90, magHeading: 92, accuracy: 1 });
    });
    expect(screen.getByTestId("user-heading")).toBeTruthy();
    expect(screen.getByTestId("user-location").props.accessibilityValue).toEqual({ now: 90 });
  });

  it("keeps every sensor off when the preference is off", async () => {
    usePreferencesStore.setState({ livePosition: false, hydrated: true });
    await render(<MapScreen />);
    // "Locate me" still centres the map; the live watchers never start
    await waitFor(() => expect(mockAnimateToRegion).toHaveBeenCalled());
    await act(async () => {});

    expect(mockLive.position).toBeNull();
    expect(mockLive.heading).toBeNull();
    expect(screen.queryByTestId("user-location")).toBeNull();
    usePreferencesStore.setState({ livePosition: true });
  });

  it("falls back to magnetic north and ignores a compass with no answer", async () => {
    await render(<MapScreen />);
    await waitFor(() => expect(mockLive.heading).not.toBeNull());
    await act(async () => {
      mockLive.position!({ coords: { latitude: 48.86, longitude: 2.36, accuracy: 8 } });
    });

    await act(async () => {
      mockLive.heading!({ trueHeading: -1, magHeading: -1, accuracy: 0 });
    });
    expect(screen.queryByTestId("user-heading")).toBeNull();

    await act(async () => {
      mockLive.heading!({ trueHeading: -1, magHeading: 180, accuracy: 1 });
    });
    expect(screen.getByTestId("user-location").props.accessibilityValue).toEqual({ now: 180 });
  });
});

describe("MapScreen — filters", () => {
  const WIDE = { ...DEFAULT_REGION, latitudeDelta: 0.2, longitudeDelta: 0.2 };

  it("filters pins by colour family on the client, badge counts it, reset restores", async () => {
    // Both inside the default view, ~2 km apart — far enough not to cluster
    useSpotsStore.setState({
      mapPins: [
        pin("red", 48.8566, 2.3522, { colors: ["#C44536"] }),
        pin("sea", 48.84, 2.33, { colors: ["#2C5F7C"] }),
      ],
    });
    await render(<MapScreen />);
    await settleRegion(DEFAULT_REGION);
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("pin-red")).toBeTruthy();
    expect(screen.getByTestId("pin-sea")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("map-filters-button"));
    await fireEvent.press(screen.getByLabelText("colorFamilies.blue"));

    expect(screen.queryByTestId("pin-red")).toBeNull();
    expect(screen.getByTestId("pin-sea")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy(); // the badge
    // Colour is client-side: no new request
    await outlastDebounce();
    expect(mockFetchMapPins).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText("map.filtersReset"));
    expect(screen.getByTestId("pin-red")).toBeTruthy();
  });

  it("sends composition and accessibility filters to the server right away", async () => {
    await render(<MapScreen />);
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(1));

    await fireEvent.press(screen.getByTestId("map-filters-button"));
    await fireEvent.press(screen.getByText("compositions.SYMMETRY"));
    await fireEvent.press(screen.getByText("spots.accessibilityLevel.EASY"));

    await waitFor(() =>
      expect(mockFetchMapPins).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: { compositions: "SYMMETRY", accessibility: "EASY" } }),
      ),
    );
  });

  it("fetches around the photographer when a radius is picked", async () => {
    await render(<MapScreen />);
    // The mount locate resolves to Paris (expo-location mock)
    await waitFor(() => expect(mockFetchMapPins).toHaveBeenCalledTimes(1));

    await fireEvent.press(screen.getByTestId("map-filters-button"));
    await fireEvent.press(screen.getAllByText("map.withinKm")[1]); // 5 km

    await waitFor(() =>
      expect(mockFetchMapPins).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: { nearLat: 48.8566, nearLng: 2.3522, radiusKm: 5 },
        }),
      ),
    );
    expect(screen.queryByText("map.needLocation")).toBeNull();
  });

  it("keeps Done reachable: the sheet is capped and its list gives way", async () => {
    await render(<MapScreen />);
    await fireEvent.press(screen.getByTestId("map-filters-button"));

    const sheet = StyleSheet.flatten(screen.getByTestId("map-filters-sheet").props.style);
    expect(sheet.maxHeight).toBeLessThan(Dimensions.get("window").height);
    expect(sheet.flexShrink).toBe(1);
    const scroll = StyleSheet.flatten(screen.getByTestId("map-filters-scroll").props.style);
    expect(scroll.flexShrink).toBe(1);
    expect(screen.getByTestId("map-filters-done")).toBeTruthy();
  });

  it("says so when nothing matches the filters here", async () => {
    useSpotsStore.setState({ mapPins: [pin("red", 48.8566, 2.3522)] });
    await render(<MapScreen />);
    await settleRegion(WIDE);

    await fireEvent.press(screen.getByTestId("map-filters-button"));
    await fireEvent.press(screen.getByLabelText("colorFamilies.green"));
    await fireEvent.press(screen.getByTestId("map-filters-done"));

    expect(screen.getByText("map.noSpotsMatch")).toBeTruthy();
  });
});


describe("MapScreen — pin colours", () => {
  it("paints each pin in its spot's first colour, own spots ringed in the accent", async () => {
    useSpotsStore.setState({
      mapPins: [
        pin("brick", 48.8566, 2.3522, { colors: ["#c44536", "#2E4A3E"] }),
        pin("bare", 48.84, 2.33, { colors: [], isOwn: false }),
      ],
    });
    await render(<MapScreen />);
    await settleRegion(DEFAULT_REGION);

    const brick = StyleSheet.flatten(screen.getByTestId("pin-dot-brick").props.style);
    expect(brick.backgroundColor).toBe("#C44536");
    expect(brick.borderColor).not.toBe("#FFFFFF");
    const bare = StyleSheet.flatten(screen.getByTestId("pin-dot-bare").props.style);
    expect(bare.backgroundColor).not.toBe("#C44536");
    expect(bare.borderColor).toBe("#FFFFFF");
  });
});
