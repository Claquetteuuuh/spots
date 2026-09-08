/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getToken,
  setToken,
  clearToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
} from "../api-client";

// Mock document.cookie for token helpers
let cookieStore = "";

beforeEach(() => {
  cookieStore = "";
  Object.defineProperty(document, "cookie", {
    get: () => cookieStore,
    set: (val: string) => {
      // Parse and store cookies correctly
      const [pair] = val.split(";");
      const [name, value] = pair.split("=");
      if (value === "" || val.includes("max-age=0")) {
        // Delete cookie
        const cookies = cookieStore
          .split("; ")
          .filter((c) => !c.startsWith(`${name}=`));
        cookieStore = cookies.join("; ");
      } else {
        const cookies = cookieStore
          .split("; ")
          .filter((c) => c && !c.startsWith(`${name}=`));
        cookies.push(`${name}=${value}`);
        cookieStore = cookies.join("; ");
      }
    },
    configurable: true,
  });
});

describe("Token helpers", () => {
  it("getToken returns null when no token is set", () => {
    expect(getToken()).toBeNull();
  });

  it("setToken stores and getToken retrieves", () => {
    setToken("test-token-123");
    expect(getToken()).toBe("test-token-123");
  });

  it("clearToken removes the token", () => {
    setToken("test-token-123");
    expect(getToken()).toBe("test-token-123");

    clearToken();
    expect(getToken()).toBeNull();
  });

  it("handles URL-encoded tokens", () => {
    setToken("token/with+special=chars");
    expect(getToken()).toBe("token/with+special=chars");
  });
});

describe("Refresh token helpers", () => {
  it("getRefreshToken returns null when no token is set", () => {
    expect(getRefreshToken()).toBeNull();
  });

  it("setRefreshToken stores and getRefreshToken retrieves", () => {
    setRefreshToken("refresh-abc-123");
    expect(getRefreshToken()).toBe("refresh-abc-123");
  });

  it("clearRefreshToken removes the refresh token", () => {
    setRefreshToken("refresh-abc-123");
    expect(getRefreshToken()).toBe("refresh-abc-123");

    clearRefreshToken();
    expect(getRefreshToken()).toBeNull();
  });

  it("access and refresh tokens are independent", () => {
    setToken("access-tok");
    setRefreshToken("refresh-tok");

    expect(getToken()).toBe("access-tok");
    expect(getRefreshToken()).toBe("refresh-tok");

    clearToken();
    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBe("refresh-tok");
  });
});

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { id: "1" } }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds Authorization header when token exists", async () => {
    setToken("my-token");

    // Dynamically import to get fresh module with mocked fetch
    const { apiClient } = await import("../api-client");
    await apiClient.spots.get("spot-1");

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[1]?.headers).toHaveProperty(
      "Authorization",
      "Bearer my-token",
    );
  });

  it("sends JSON content type for non-FormData requests", async () => {
    const { apiClient } = await import("../api-client");
    await apiClient.auth.login("test@test.com", "password");

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[1]?.headers).toHaveProperty(
      "Content-Type",
      "application/json",
    );
  });

  it("throws on error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Bad request" }),
      }),
    );

    const { apiClient } = await import("../api-client");
    await expect(apiClient.auth.me()).rejects.toThrow("Bad request");
  });

  it("login stores both access and refresh tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              accessToken: "new-access",
              refreshToken: "new-refresh",
              user: { id: "1", name: "Test" },
            },
          }),
      }),
    );

    const { apiClient } = await import("../api-client");
    await apiClient.auth.login("test@test.com", "password");

    expect(getToken()).toBe("new-access");
    expect(getRefreshToken()).toBe("new-refresh");
  });

  it("logout clears both tokens", async () => {
    setToken("access-tok");
    setRefreshToken("refresh-tok");

    const { apiClient } = await import("../api-client");
    apiClient.auth.logout();

    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
