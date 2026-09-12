import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { SpotDetailScreen } from "../SpotDetailScreen";
import { useAuthStore } from "../../../stores/auth-store";
import { useSpotsStore } from "../../../stores/spots-store";
import type { RootStackScreenProps } from "../../../navigation/types";
import type { Spot, User } from "../../../types";

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
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View, Marker: View, PROVIDER_DEFAULT: "default" };
});

jest.mock("../../../components/spots/SpotPhotosSection", () => ({
  SpotPhotosSection: () => null,
}));

// The lightbox stands in as a marker of whether it is open
jest.mock("../../../components/spots/PinchableImage", () => {
  const ReactActual = require("react");
  const { Image } = require("react-native");
  return {
    PinchableImage: ({ uri, style, testID }: { uri: string; style: unknown; testID?: string }) =>
      ReactActual.createElement(Image, { source: { uri }, style, testID }),
  };
});
jest.mock("../../../components/spots/PhotoLightbox", () => {
  const { View } = require("react-native");
  return {
    PhotoLightbox: ({ uri }: { uri: string | null }) =>
      uri ? <View testID="lightbox" accessibilityLabel={uri} /> : null,
  };
});

jest.mock("../../../lib/api", () => ({
  likeSpot: jest.fn(),
  unlikeSpot: jest.fn(),
}));

import * as api from "../../../lib/api";

const mockedApi = api as jest.Mocked<typeof api>;

const spot = {
  id: "s1",
  userId: "owner-1",
  latitude: 48.8566,
  longitude: 2.3522,
  city: "Paris",
  country: "France",
  photoUrl: "https://cdn.example.com/cover.webp",
  photoKey: "spots/owner-1/cover.webp",
  title: "Sunset over the Seine",
  compositions: [],
  colors: [],
  tags: [],
  visibility: "FOLLOWERS",
  likeCount: 2,
  isLiked: false,
} as unknown as Spot;

type Props = RootStackScreenProps<"SpotDetail">;

async function renderScreen() {
  const navigation = { setOptions: jest.fn(), goBack: jest.fn(), addListener: jest.fn().mockReturnValue(jest.fn()), navigate: jest.fn() };
  await render(
    <SpotDetailScreen
      route={{ key: "SpotDetail-1", name: "SpotDetail", params: { spotId: "s1" } } as Props["route"]}
      navigation={navigation as unknown as Props["navigation"]}
    />,
  );
  await screen.findByText("Sunset over the Seine");
}

describe("SpotDetailScreen — liking and looking closer", () => {
  const fetchSpotById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: "owner-1", username: "owner", name: "Owner" } as unknown as User,
    });
    fetchSpotById.mockResolvedValue(spot);
    useSpotsStore.setState({ fetchSpotById });
    mockedApi.likeSpot.mockResolvedValue({ isLiked: true, likeCount: 3 });
    mockedApi.unlikeSpot.mockResolvedValue({ isLiked: false, likeCount: 2 });
  });

  it("likes your own spot at once and takes the like back", async () => {
    await renderScreen();
    expect(screen.getByTestId("like-count").props.children).toBe(2);

    await fireEvent.press(screen.getByTestId("like-spot"));
    expect(screen.getByTestId("like-count").props.children).toBe(3);
    await waitFor(() => expect(mockedApi.likeSpot).toHaveBeenCalledWith("s1"));
    expect(screen.getByTestId("like-spot").props.accessibilityState).toEqual({ selected: true });

    await fireEvent.press(screen.getByTestId("like-spot"));
    await waitFor(() => expect(mockedApi.unlikeSpot).toHaveBeenCalledWith("s1"));
    expect(screen.getByTestId("like-count").props.children).toBe(2);
  });

  it("puts the heart back when the server refuses", async () => {
    mockedApi.likeSpot.mockRejectedValueOnce(new Error("offline"));
    await renderScreen();

    await fireEvent.press(screen.getByTestId("like-spot"));
    await waitFor(() => expect(screen.getByTestId("like-count").props.children).toBe(2));
    expect(screen.getByTestId("like-spot").props.accessibilityState).toEqual({ selected: false });
  });

  it("opens the photo full screen from a tap", async () => {
    await renderScreen();
    expect(screen.queryByTestId("lightbox")).toBeNull();

    await fireEvent.press(screen.getByTestId("spot-photo-0"));
    expect(screen.getByTestId("lightbox").props.accessibilityLabel).toBe(spot.photoUrl);
  });
});
