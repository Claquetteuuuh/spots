import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { SpotDetailScreen } from "../SpotDetailScreen";
import { useAuthStore } from "../../../stores/auth-store";
import { useSpotsStore } from "../../../stores/spots-store";
import { useDialogStore } from "../../../stores/dialog-store";
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

// The community photos and the lightbox have their own tests; keep this one about the spot.
jest.mock("../../../components/spots/SpotPhotosSection", () => ({
  SpotPhotosSection: () => null,
}));
jest.mock("../../../components/spots/PinchableImage", () => {
  const ReactActual = require("react");
  const { Image } = require("react-native");
  return {
    PinchableImage: ({ uri, style, testID }: { uri: string; style: unknown; testID?: string }) =>
      ReactActual.createElement(Image, { source: { uri }, style, testID }),
  };
});
jest.mock("../../../components/spots/PhotoLightbox", () => ({
  PhotoLightbox: () => null,
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

/** The dialog on top, as the host would show it. */
const topDialog = () => useDialogStore.getState().queue[0];

/** Answer the dialog on top, the way a finger would. */
async function answerDialog(ok: boolean) {
  await act(async () => {
    useDialogStore.getState().settle(topDialog().id, ok);
  });
}

describe("SpotDetailScreen — deleting a spot", () => {
  const fetchSpotById = jest.fn();
  const deleteSpot = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useDialogStore.setState({ queue: [] });
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

  it("asks twice, in the app's own dialog, then deletes and goes back", async () => {
    signIn(OWNER_ID);
    const navigation = await renderScreen();
    await render(lastHeaderRight(navigation)!());

    await fireEvent.press(screen.getByTestId("delete-spot"));
    await waitFor(() => expect(topDialog()).toBeDefined());
    expect(topDialog()).toMatchObject({
      kind: "confirm",
      title: "spots.deleteConfirm",
      message: "spots.deleteMessage",
      destructive: true,
    });
    expect(deleteSpot).not.toHaveBeenCalled();

    await answerDialog(true);
    await waitFor(() => expect(topDialog()?.title).toBe("spots.deleteConfirmAgain"));
    expect(topDialog()).toMatchObject({ confirmLabel: "spots.deleteForGood", destructive: true });
    expect(deleteSpot).not.toHaveBeenCalled();

    await answerDialog(true);
    await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
    expect(deleteSpot).toHaveBeenCalledWith("s1");
  });

  it("keeps the spot when the second question is answered no", async () => {
    signIn(OWNER_ID);
    const navigation = await renderScreen();
    await render(lastHeaderRight(navigation)!());

    await fireEvent.press(screen.getByTestId("delete-spot"));
    await waitFor(() => expect(topDialog()).toBeDefined());
    await answerDialog(true);
    await waitFor(() => expect(topDialog()?.title).toBe("spots.deleteConfirmAgain"));
    await answerDialog(false);

    await waitFor(() => expect(useDialogStore.getState().queue).toHaveLength(0));
    expect(deleteSpot).not.toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it("stays on the spot and reports the error when deletion fails", async () => {
    signIn(OWNER_ID);
    deleteSpot.mockRejectedValueOnce(new Error("403"));
    const navigation = await renderScreen();
    await render(lastHeaderRight(navigation)!());

    await fireEvent.press(screen.getByTestId("delete-spot"));
    await waitFor(() => expect(topDialog()).toBeDefined());
    await answerDialog(true);
    await waitFor(() => expect(topDialog()?.title).toBe("spots.deleteConfirmAgain"));
    await answerDialog(true);

    await waitFor(() => expect(topDialog()).toMatchObject({ kind: "notice", title: "common.error" }));
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
