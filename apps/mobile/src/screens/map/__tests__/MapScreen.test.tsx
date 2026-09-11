import React, { act } from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { MAP_PINS_LIMIT, padBounds, regionToBounds, type MapPin } from "@trs/shared/map";

// ─── Mocks ──────────────────────────────────────────────────────────

jest.mock("react-i18next", () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    initReactI18next: { type: "3rdParty", init: jest.fn() },
  };
});

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 48.8566, longitude: 2.3522 } }),
  ),
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
  useTabSwitch: () => ({ setTabIndex: mockSetTabIndex }),
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
      { onPress: props.onPress, testID: props.testID, accessibilityLabel: props.accessibilityLabel },
      props.children,
    );
  return { __esModule: true, default: MapView, Marker, Callout: View, PROVIDER_DEFAULT: null };
});

import { useAuthStore } from "../../../stores/auth-store";
import { useSpotsStore } from "../../../stores/spots-store";
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
  mockFetchMapPins.mockResolvedValue(true);
  useAuthStore.setState({ user: USER });
  useSpotsStore.setState({
    mapPins: [],
    mapTruncated: false,
    isMapLoading: false,
    fetchMapPins: mockFetchMapPins,
  });
});

// ─── Tests ──────────────────────────────────────────────────────────

describe("MapScreen", () => {
  it("fetches pins for the padded default view on mount", async () => {
    await render(<MapScreen />);

    await waitFor(() =>
      expect(mockFetchMapPins).toHaveBeenCalledWith({
        bounds: padBounds(regionToBounds(DEFAULT_REGION)),
        scope: "all",
        limit: MAP_PINS_LIMIT,
      }),
    );
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
      expect.objectContaining({ bounds: padBounds(regionToBounds(FAR_REGION)) }),
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
        pin("mine", 48.8566, 2.3522),
        pin("theirs", 48.8, 2.3, { userId: "u2", isOwn: false }),
      ],
    });
    await render(<MapScreen />);
    await settleRegion({ ...DEFAULT_REGION, latitudeDelta: 0.2, longitudeDelta: 0.2 });

    expect(backgroundOf("pin-dot-mine")).not.toBe(backgroundOf("pin-dot-theirs"));
  });
});
