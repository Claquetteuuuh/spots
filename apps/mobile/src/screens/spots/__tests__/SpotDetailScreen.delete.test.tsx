import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { SpotDetailScreen } from "../SpotDetailScreen";
import { useAuthStore } from "../../../stores/auth-store";
import { useSpotsStore } from "../../../stores/spots-store";
import type { RootStackScreenProps } from "../../../navigation/types";
import type { Spot, User } from "../../../types";

// Testing Library for React Native is async by default since v14:
// `render` and `fireEvent.*` must be awaited.

jest.mock("react-i18next", () => {
  // One `t` for the whole run: the real hook keeps it stable across renders,
  // and effects that list it as a dependency rely on that.
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    // lib/i18n.ts registers this plugin at import time (pulled in via the stores)
    initReactI18next: { type: "3rdParty", init: jest.fn() },
  };
});

// The real icon set loads its font asynchronously and keeps running after
// the test ends; a host component name renders the same tree without it.
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

// The community photos have their own tests; keep this one about the spot.
jest.mock("../../../components/spots/SpotPhotosSection", () => ({
  SpotPhotosSection: () => null,
}));

const OWNER_ID = "owner-1";

const spot: Spot = {
  id: "s1",
  userId: OWNER_ID,
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
} as unknown as Spot;

function signIn(id: string) {
  useAuthStore.setState({
    user: { id, username: `user-${id}`, name: `User ${id}` } as unknown as User,
  });
}

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
  return navigation;
}

/** The header button the screen last handed to the navigator, if any. */
function lastHeaderRight(navigation: { setOptions: jest.Mock }) {
  const calls = navigation.setOptions.mock.calls;
  return calls[calls.length - 1][0].headerRight as (() => React.ReactElement) | undefined;
}

function confirmLastAlert() {
  const calls = (Alert.alert as jest.Mock).mock.calls;
  const buttons = calls[calls.length - 1][2] as { style?: string; onPress?: () => void }[];
  buttons.find((b) => b.style === "destructive")?.onPress?.();
}

describe("SpotDetailScreen — deleting a spot", () => {
  const fetchSpotById = jest.fn();
  const deleteSpot = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    fetchSpotById.mockResolvedValue(spot);
    deleteSpot.mockResolvedValue(undefined);
    useSpotsStore.setState({ fetchSpotById, deleteSpot });
  });

  it("gives the owner a delete button in the header", async () => {
    signIn(OWNER_ID);
    const navigation = await renderScreen();

    const headerRight = lastHeaderRight(navigation);
    expect(headerRight).toBeDefined();
    await render(headerRight!());
    expect(screen.getByTestId("delete-spot")).toBeTruthy();
  });

  it("shows no delete button to anyone else", async () => {
    signIn("visitor-1");
    const navigation = await renderScreen();

    expect(lastHeaderRight(navigation)).toBeUndefined();
  });

  it("deletes after confirmation and goes back", async () => {
    signIn(OWNER_ID);
    const navigation = await renderScreen();
    await render(lastHeaderRight(navigation)!());

    await fireEvent.press(screen.getByTestId("delete-spot"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "spots.deleteConfirm",
      "spots.deleteMessage",
      expect.any(Array),
    );
    expect(deleteSpot).not.toHaveBeenCalled();

    confirmLastAlert();

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
    expect(deleteSpot).toHaveBeenCalledWith("s1");
  });

  it("stays on the spot and reports the error when deletion fails", async () => {
    signIn(OWNER_ID);
    deleteSpot.mockRejectedValueOnce(new Error("403"));
    const navigation = await renderScreen();
    await render(lastHeaderRight(navigation)!());

    await fireEvent.press(screen.getByTestId("delete-spot"));
    confirmLastAlert();

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenLastCalledWith("common.error", expect.any(String)),
    );
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
