jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn(),
}));
jest.mock("../../lib/api");
jest.mock("../../lib/auth", () => ({
  clearTokens: jest.fn(),
  hasStoredSession: jest.fn(),
  getAccessToken: jest.fn().mockResolvedValue(null),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  saveTokens: jest.fn(),
  setAccessToken: jest.fn(),
}));

import * as api from "../../lib/api";
import { useNotificationsStore } from "../notifications-store";

describe("notifications store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationsStore.setState({ badgeCount: 0 });
  });

  it("refresh reads the unseen count and keeps the last one on failure", async () => {
    (api.getFollowRequestsCount as jest.Mock).mockResolvedValueOnce(4);
    await useNotificationsStore.getState().refresh();
    expect(useNotificationsStore.getState().badgeCount).toBe(4);

    (api.getFollowRequestsCount as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    await useNotificationsStore.getState().refresh();
    expect(useNotificationsStore.getState().badgeCount).toBe(4);
  });

  it("markSeen drops the badge at once and tells the server, even when that fails", async () => {
    useNotificationsStore.setState({ badgeCount: 3 });
    (api.markNotificationsSeen as jest.Mock).mockRejectedValueOnce(new Error("offline"));

    await useNotificationsStore.getState().markSeen();

    expect(useNotificationsStore.getState().badgeCount).toBe(0);
    expect(api.markNotificationsSeen).toHaveBeenCalledTimes(1);
  });
});
