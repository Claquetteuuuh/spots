const mockStore: Record<string, string> = {};

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore[key] = value;
  }),
  getItemAsync: jest.fn(async (key: string) => mockStore[key] ?? null),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete mockStore[key];
  }),
}));

import * as SecureStore from "expo-secure-store";
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
  hasStoredSession,
} from "../auth";

describe("auth token management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the mock store
    Object.keys(mockStore).forEach((key) => delete mockStore[key]);
  });

  it("saveTokens stores both access and refresh tokens", async () => {
    await saveTokens({ accessToken: "access-123", refreshToken: "refresh-456" });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "trs.accessToken",
      "access-123"
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "trs.refreshToken",
      "refresh-456"
    );
  });

  it("getAccessToken retrieves the stored access token", async () => {
    mockStore["trs.accessToken"] = "access-abc";
    const token = await getAccessToken();
    expect(token).toBe("access-abc");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("trs.accessToken");
  });

  it("getAccessToken returns null when no token is stored", async () => {
    const token = await getAccessToken();
    expect(token).toBeNull();
  });

  it("getRefreshToken retrieves the stored refresh token", async () => {
    mockStore["trs.refreshToken"] = "refresh-xyz";
    const token = await getRefreshToken();
    expect(token).toBe("refresh-xyz");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("trs.refreshToken");
  });

  it("setAccessToken updates only the access token", async () => {
    await setAccessToken("new-access");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "trs.accessToken",
      "new-access"
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it("clearTokens deletes both tokens", async () => {
    await clearTokens();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("trs.accessToken");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("trs.refreshToken");
  });

  it("hasStoredSession returns true when access token exists", async () => {
    mockStore["trs.accessToken"] = "some-token";
    const result = await hasStoredSession();
    expect(result).toBe(true);
  });

  it("hasStoredSession returns false when no access token exists", async () => {
    const result = await hasStoredSession();
    expect(result).toBe(false);
  });
});
