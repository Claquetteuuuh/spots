jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn(),
}));

jest.mock("../../lib/api");
jest.mock("../../lib/auth", () => ({
  clearTokens: jest.fn().mockResolvedValue(undefined),
  hasStoredSession: jest.fn().mockResolvedValue(false),
  getAccessToken: jest.fn().mockResolvedValue(null),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  saveTokens: jest.fn().mockResolvedValue(undefined),
  setAccessToken: jest.fn().mockResolvedValue(undefined),
}));

import { useAuthStore } from "../auth-store";
import * as api from "../../lib/api";
import * as auth from "../../lib/auth";

const mockUser = {
  id: "u1",
  email: "a@b.c",
  username: "alice",
  name: "Alice",
  locale: "en" as const,
  createdAt: "2024-01-01",
};

const mockAuthResponse = {
  accessToken: "at-1",
  refreshToken: "rt-1",
  user: mockUser,
};

function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}

describe("auth store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe("login", () => {
    it("sets user and isAuthenticated on success", async () => {
      (api.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      await useAuthStore.getState().login("a@b.c", "password");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      const error = new Error("Bad credentials");
      (api.login as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        useAuthStore.getState().login("a@b.c", "wrong")
      ).rejects.toThrow("Bad credentials");

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Bad credentials");
    });
  });

  describe("loginWithGoogle", () => {
    it("sets user on success", async () => {
      (api.loginWithGoogle as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      await useAuthStore.getState().loginWithGoogle("google-id-token");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("sets error on failure", async () => {
      const error = new Error("Google auth failed");
      (api.loginWithGoogle as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        useAuthStore.getState().loginWithGoogle("bad-token")
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBe("Google auth failed");
    });
  });

  describe("register", () => {
    it("sets user on success", async () => {
      (api.register as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      await useAuthStore.getState().register({
        email: "a@b.c",
        password: "password8",
        username: "alice",
        name: "Alice",
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("sets error on failure", async () => {
      const error = new Error("Email taken");
      (api.register as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        useAuthStore.getState().register({
          email: "a@b.c",
          password: "password8",
          username: "alice",
          name: "Alice",
        })
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBe("Email taken");
    });
  });

  describe("logout", () => {
    it("clears state and tokens", async () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(auth.clearTokens).toHaveBeenCalled();
    });
  });

  describe("loadUser", () => {
    it("fetches and sets user when session exists", async () => {
      (auth.hasStoredSession as jest.Mock).mockResolvedValueOnce(true);
      (api.getMe as jest.Mock).mockResolvedValueOnce(mockUser);

      await useAuthStore.getState().loadUser();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("clears state when no session exists", async () => {
      (auth.hasStoredSession as jest.Mock).mockResolvedValueOnce(false);

      await useAuthStore.getState().loadUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("clears tokens when getMe fails", async () => {
      (auth.hasStoredSession as jest.Mock).mockResolvedValueOnce(true);
      (api.getMe as jest.Mock).mockRejectedValueOnce(new Error("401"));

      await useAuthStore.getState().loadUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(auth.clearTokens).toHaveBeenCalled();
    });
  });

  describe("setUser", () => {
    it("updates the user in state", () => {
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe("clearError", () => {
    it("resets error to null", () => {
      useAuthStore.setState({ error: "some error" });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
