/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { en } from "@trs/shared/i18n";
import {
  apiClient,
  isNetworkError,
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

// ─── When the request never left ─────────────────────────────────────

describe("a connection that drops", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("says to check the connection, not 'Load failed'", async () => {
    // What fetch throws when the request never completed — the browser's
    // own wording ("Load failed" in Safari) means nothing to anyone.
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Load failed");
    }));

    const failure = await apiClient.spots.get("spot-1").catch((e: unknown) => e);

    expect(isNetworkError(failure)).toBe(true);
    expect((failure as Error).message).toBe(en.common.networkError);
    expect((failure as Error).message).not.toContain("Load failed");
  });

  it("leaves a refusal from the server alone", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Spot not found" }), { status: 404 })));

    const failure = await apiClient.spots.get("nope").catch((e: unknown) => e);

    expect(isNetworkError(failure)).toBe(false);
    expect((failure as Error).message).toBe("Spot not found");
  });
});

// ─── Posting photos, with something to watch ─────────────────────────

/** A stand-in XHR whose upload can be played frame by frame. */
function fakeXhr() {
  const listeners = new Map<string, (e?: unknown) => void>();
  const uploadListeners = new Map<string, (e?: unknown) => void>();
  const xhr = {
    status: 200,
    responseText: "",
    open: vi.fn(),
    setRequestHeader: vi.fn(),
    send: vi.fn(),
    addEventListener: (event: string, fn: (e?: unknown) => void) => listeners.set(event, fn),
    upload: { addEventListener: (event: string, fn: (e?: unknown) => void) => uploadListeners.set(event, fn) },
    /** Play the body going out. */
    progress: (loaded: number, total: number) =>
      uploadListeners.get("progress")?.({ lengthComputable: true, loaded, total }),
    finish: (status: number, body: unknown) => {
      xhr.status = status;
      xhr.responseText = JSON.stringify(body);
      listeners.get("load")?.();
    },
    drop: () => listeners.get("error")?.(),
  };
  vi.stubGlobal("XMLHttpRequest", vi.fn(() => xhr));
  return xhr;
}

describe("uploadPhoto", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("reports how far the photos have got, and hands back the post", async () => {
    const xhr = fakeXhr();
    const seen: number[] = [];
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });

    const pending = apiClient.spots.uploadPhoto("spot-1", [file], "hi", (f) => seen.push(f));
    xhr.progress(50, 200);
    xhr.progress(200, 200);
    xhr.finish(201, { data: { id: "post-1" } });

    await expect(pending).resolves.toEqual({ id: "post-1" });
    expect(seen).toEqual([0.25, 1, 1]); // …and 1 once more when the answer lands
    expect(xhr.open).toHaveBeenCalledWith("POST", "/api/spots/spot-1/photos");
  });

  it("says to check the connection when the upload never lands", async () => {
    const xhr = fakeXhr();
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });

    const pending = apiClient.spots.uploadPhoto("spot-1", [file]);
    xhr.drop();

    const failure = await pending.catch((e: unknown) => e);
    expect(isNetworkError(failure)).toBe(true);
  });
});
