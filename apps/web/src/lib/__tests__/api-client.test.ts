/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getToken, setToken, clearToken } from "../api-client";

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

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
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
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      }),
    );

    const { apiClient } = await import("../api-client");
    await expect(apiClient.auth.me()).rejects.toThrow("Unauthorized");
  });
});
