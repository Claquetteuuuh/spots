import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

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
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View, SafeAreaProvider: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));

// The swipeable shows its right actions alongside the row, so tests can press them
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const ReactActual = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ children, renderRightActions }: any) =>
      ReactActual.createElement(
        View,
        null,
        children,
        renderRightActions?.(null, null, { close: jest.fn(), openLeft: jest.fn(), openRight: jest.fn(), reset: jest.fn() }),
      ),
  };
});

jest.mock("../../../lib/api", () => ({
  getFollowRequests: jest.fn(),
  acceptFollowRequest: jest.fn(),
  rejectFollowRequest: jest.fn(),
  setNotificationRead: jest.fn(() => Promise.resolve()),
  dismissNotification: jest.fn(() => Promise.resolve()),
  markNotificationsSeen: jest.fn(() => Promise.resolve()),
  getFollowRequestsCount: jest.fn(() => Promise.resolve(0)),
}));

import * as api from "../../../lib/api";
import { useNotificationsStore } from "../../../stores/notifications-store";
import { NotificationsScreen } from "../NotificationsScreen";

const mockedApi = api as jest.Mocked<typeof api>;

const follower = (id: string) => ({ id, username: `u-${id}`, name: `N ${id}`, avatarUrl: null });
const item = (id: string, extra: Partial<{ readAt: string | null; unreadKept: boolean }> = {}) => ({
  id,
  follower: follower(id),
  createdAt: new Date().toISOString(),
  readAt: null,
  unreadKept: false,
  ...extra,
});

const dotColor = (id: string) =>
  (screen.getByTestId(`dot-${id}`).props.style as { backgroundColor?: string }[])
    .map((s) => s?.backgroundColor)
    .find(Boolean);

jest.setTimeout(15_000);

beforeEach(() => {
  jest.clearAllMocks();
  useNotificationsStore.setState({ badgeCount: 2 });
  mockedApi.getFollowRequests.mockResolvedValue({
    pendingRequests: [item("p1")],
    newFollowers: [item("f1", { readAt: "2026-01-01T00:00:00.000Z" })],
  });
});

describe("NotificationsScreen", () => {
  it("reads the screen on open, drops the badge, and keeps the dot on what was new", async () => {
    await render(<NotificationsScreen />);
    await screen.findByTestId("notification-p1");

    await waitFor(() => expect(mockedApi.markNotificationsSeen).toHaveBeenCalledTimes(1));
    expect(useNotificationsStore.getState().badgeCount).toBe(0);
    expect(dotColor("p1")).not.toBe("transparent");
    expect(dotColor("f1")).toBe("transparent");
  });

  it("deletes a notification from its red action", async () => {
    await render(<NotificationsScreen />);
    await screen.findByTestId("notification-p1");

    await fireEvent.press(screen.getByTestId("dismiss-p1"));

    expect(mockedApi.dismissNotification).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(screen.queryByTestId("notification-p1")).toBeNull());
    expect(screen.getByTestId("notification-f1")).toBeTruthy();
  });

  it("flips read and unread from its blue action", async () => {
    await render(<NotificationsScreen />);
    await screen.findByTestId("notification-f1");

    // Both rows read now (f1 already was, p1 on open): each offers "mark unread"
    expect(screen.getAllByLabelText("notifications.markUnread")).toHaveLength(2);
    await fireEvent.press(screen.getByTestId("toggle-read-f1"));
    expect(mockedApi.setNotificationRead).toHaveBeenCalledWith("f1", false);
    await waitFor(() => expect(dotColor("f1")).not.toBe("transparent"));

    // p1 was just read on open: pressing marks it unread on purpose
    await fireEvent.press(screen.getByTestId("toggle-read-p1"));
    expect(mockedApi.setNotificationRead).toHaveBeenLastCalledWith("p1", false);
    expect(mockedApi.getFollowRequestsCount).toHaveBeenCalled(); // badge re-counted
  });
});
