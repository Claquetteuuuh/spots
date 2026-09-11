// Mock auth before importing api (api imports auth at module level via interceptors)
jest.mock("../auth", () => ({
  getAccessToken: jest.fn().mockResolvedValue(null),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  saveTokens: jest.fn().mockResolvedValue(undefined),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  setAccessToken: jest.fn().mockResolvedValue(undefined),
  hasStoredSession: jest.fn().mockResolvedValue(false),
}));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn(),
}));

import { client } from "../api";
import * as api from "../api";

const BOX = { swLat: 48.8, swLng: 2.2, neLat: 48.9, neLng: 2.45 };

describe("API client — getMapPins", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("flattens the bounds into query params with the default scope and limit", async () => {
    jest.spyOn(client, "get").mockResolvedValueOnce({
      status: 200,
      headers: { etag: 'W/"abc"' },
      data: { items: [], truncated: false },
    });

    const result = await api.getMapPins({ bounds: BOX });

    expect(client.get).toHaveBeenCalledWith(
      "/api/spots/map",
      expect.objectContaining({ params: { ...BOX, scope: "all", limit: 500 }, headers: undefined }),
    );
    expect(result).toEqual({ notModified: false, items: [], truncated: false, etag: 'W/"abc"' });
  });

  it("sends the held ETag and reports a 304 as not modified", async () => {
    const get = jest.spyOn(client, "get").mockResolvedValueOnce({ status: 304, headers: {}, data: "" });

    const result = await api.getMapPins({ bounds: BOX, etag: 'W/"abc"' });

    expect(get).toHaveBeenCalledWith(
      "/api/spots/map",
      expect.objectContaining({ headers: { "If-None-Match": 'W/"abc"' } }),
    );
    const { validateStatus } = get.mock.calls[0][1] as { validateStatus: (s: number) => boolean };
    expect(validateStatus(304)).toBe(true);
    expect(validateStatus(200)).toBe(true);
    expect(validateStatus(500)).toBe(false);
    expect(result).toEqual({ notModified: true });
  });

  it("passes an explicit scope and limit through", async () => {
    jest
      .spyOn(client, "get")
      .mockResolvedValueOnce({ status: 200, headers: {}, data: { items: [], truncated: true } });

    const result = await api.getMapPins({ bounds: BOX, scope: "following", limit: 50 });

    expect(client.get).toHaveBeenCalledWith(
      "/api/spots/map",
      expect.objectContaining({ params: { ...BOX, scope: "following", limit: 50 } }),
    );
    expect(result).toMatchObject({ notModified: false, truncated: true, etag: null });
  });

  it("spreads the server-side filters into the query", async () => {
    jest
      .spyOn(client, "get")
      .mockResolvedValueOnce({ status: 200, headers: {}, data: { items: [], truncated: false } });

    await api.getMapPins({
      bounds: BOX,
      filters: { compositions: "SYMMETRY", nearLat: 48.85, nearLng: 2.35, radiusKm: 5 },
    });

    expect(client.get).toHaveBeenCalledWith(
      "/api/spots/map",
      expect.objectContaining({
        params: {
          ...BOX,
          compositions: "SYMMETRY",
          nearLat: 48.85,
          nearLng: 2.35,
          radiusKm: 5,
          scope: "all",
          limit: 500,
        },
      }),
    );
  });
});
