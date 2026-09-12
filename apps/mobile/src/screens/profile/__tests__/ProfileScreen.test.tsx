import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import { useAuthStore } from "../../../stores/auth-store";
import { useSpotsStore } from "../../../stores/spots-store";
import type { Spot, User } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View, SafeAreaProvider: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

// The focus listener is kept so a test can play "coming back to the tab"
const focusListeners: (() => void)[] = [];
const mockAddListener = jest.fn((event: string, cb: () => void) => {
  if (event === "focus") focusListeners.push(cb);
  return jest.fn();
});
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn(), addListener: mockAddListener }),
}));

jest.mock("../../../components/profile/FollowListModal", () => ({ FollowListModal: () => null }));

import { ProfileScreen } from "../ProfileScreen";

const user = { id: "me", username: "alice", name: "Alice", avatarUrl: null, bio: null } as unknown as User;
const spot = (id: string) => ({ id, photoUrl: `https://cdn/${id}.webp`, userId: "me" }) as unknown as Spot;

jest.setTimeout(15_000);

describe("ProfileScreen", () => {
  const loadUser = jest.fn(async () => {});
  const fetchMySpots = jest.fn(async () => {});

  beforeEach(() => {
    jest.clearAllMocks();
    focusListeners.length = 0;
    useAuthStore.setState({ user, loadUser });
    useSpotsStore.setState({ spots: [spot("s1")], fetchMySpots });
  });

  it("loads the viewer's spots once on mount", async () => {
    await render(<ProfileScreen />);
    await waitFor(() => expect(fetchMySpots).toHaveBeenCalledWith("me"));
    expect(fetchMySpots).toHaveBeenCalledTimes(1);
    expect(loadUser).not.toHaveBeenCalled();
  });

  it("pulls to refresh both the account and the spots", async () => {
    await render(<ProfileScreen />);
    await waitFor(() => expect(fetchMySpots).toHaveBeenCalledTimes(1));

    // The pull itself is native: reach the control the grid was given
    const control = screen.getByTestId("profile-grid").props.refreshControl as React.ReactElement<{ onRefresh: () => void }>;
    await act(async () => {
      control.props.onRefresh();
    });
    await waitFor(() => expect(loadUser).toHaveBeenCalledTimes(1));
    expect(fetchMySpots).toHaveBeenCalledTimes(2);
  });

  it("reloads on coming back to the tab, not on the first focus", async () => {
    await render(<ProfileScreen />);
    await waitFor(() => expect(fetchMySpots).toHaveBeenCalledTimes(1));
    expect(focusListeners).toHaveLength(1);

    await act(async () => {
      focusListeners[0]();
    });
    expect(loadUser).not.toHaveBeenCalled();

    await act(async () => {
      focusListeners[0]();
    });
    await waitFor(() => expect(loadUser).toHaveBeenCalledTimes(1));
    expect(fetchMySpots).toHaveBeenCalledTimes(2);
  });
});
