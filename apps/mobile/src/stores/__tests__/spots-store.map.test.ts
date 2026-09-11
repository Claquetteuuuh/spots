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

import { invalidateMapCache, useSpotsStore } from "../spots-store";
import * as api from "../../lib/api";
import type { MapPin } from "@trs/shared/map";

const BOX = { swLat: 48.8, swLng: 2.2, neLat: 48.9, neLng: 2.45 };

const pin = (id: string): MapPin => ({
  id,
  latitude: 48.85,
  longitude: 2.35,
  title: id,
  photoUrl: `https://cdn.example.com/${id}.jpg`,
  city: "Paris",
  userId: "u1",
  isOwn: true,
  colors: [],
  compositions: [],
  accessibility: null,
});

const getMapPins = api.getMapPins as jest.Mock;

describe("spots store — fetchMapPins", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateMapCache();
    useSpotsStore.setState({
      mapPins: [],
      mapTruncated: false,
      isMapLoading: false,
      mapCacheVersion: 0,
      error: null,
    });
  });

  it("stores the pins and the truncation flag", async () => {
    getMapPins.mockResolvedValueOnce({ items: [pin("a")], truncated: true, etag: 'W/"1"' });

    const applied = await useSpotsStore.getState().fetchMapPins({ bounds: BOX, scope: "all" });

    expect(applied).toBe(true);
    expect(getMapPins).toHaveBeenCalledWith({ bounds: BOX, scope: "all", etag: null });
    const state = useSpotsStore.getState();
    expect(state.mapPins.map((p) => p.id)).toEqual(["a"]);
    expect(state.mapTruncated).toBe(true);
    expect(state.isMapLoading).toBe(false);
  });

  it("keeps the last pins and stays quiet when the request fails", async () => {
    useSpotsStore.setState({ mapPins: [pin("keep")] });
    getMapPins.mockRejectedValueOnce(new Error("offline"));

    const applied = await useSpotsStore.getState().fetchMapPins({ bounds: BOX });

    expect(applied).toBe(false);
    const state = useSpotsStore.getState();
    expect(state.mapPins.map((p) => p.id)).toEqual(["keep"]);
    expect(state.error).toBeNull();
    expect(state.isMapLoading).toBe(false);
  });

  it("drops a stale response that lands after a newer one", async () => {
    let resolveFirst!: (v: { items: MapPin[]; truncated: boolean }) => void;
    getMapPins
      .mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }))
      .mockResolvedValueOnce({ items: [pin("new")], truncated: false });

    const first = useSpotsStore.getState().fetchMapPins({ bounds: BOX });
    const second = await useSpotsStore.getState().fetchMapPins({ bounds: BOX });
    expect(second).toBe(true);

    resolveFirst({ items: [pin("old")], truncated: false });
    expect(await first).toBe(false);

    expect(useSpotsStore.getState().mapPins.map((p) => p.id)).toEqual(["new"]);
  });

  it("shows a cached box at once, revalidates with its ETag and keeps it on a 304", async () => {
    getMapPins.mockResolvedValueOnce({ items: [pin("a")], truncated: false, etag: 'W/"1"' });
    await useSpotsStore.getState().fetchMapPins({ bounds: BOX });
    useSpotsStore.setState({ mapPins: [] });

    let resolve!: (v: unknown) => void;
    getMapPins.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    const second = useSpotsStore.getState().fetchMapPins({ bounds: BOX });

    // Before the server answers, the cached pins are already up, no spinner
    expect(useSpotsStore.getState().mapPins.map((p) => p.id)).toEqual(["a"]);
    expect(useSpotsStore.getState().isMapLoading).toBe(false);
    expect(getMapPins).toHaveBeenLastCalledWith(expect.objectContaining({ etag: 'W/"1"' }));

    resolve({ notModified: true });
    expect(await second).toBe(true);
    expect(useSpotsStore.getState().mapPins.map((p) => p.id)).toEqual(["a"]);
  });

  it("drops the cache and bumps the version when a spot is created", async () => {
    getMapPins.mockResolvedValueOnce({ items: [pin("a")], truncated: false, etag: 'W/"1"' });
    await useSpotsStore.getState().fetchMapPins({ bounds: BOX });
    (api.createSpot as jest.Mock).mockResolvedValueOnce({ id: "new" });

    await useSpotsStore.getState().createSpot({
      latitude: 1,
      longitude: 1,
      photoUrl: "u",
      photoKey: "k",
    });

    expect(useSpotsStore.getState().mapCacheVersion).toBe(1);
    getMapPins.mockResolvedValueOnce({ items: [], truncated: false, etag: null });
    await useSpotsStore.getState().fetchMapPins({ bounds: BOX });
    // No ETag left to send: the box was forgotten
    expect(getMapPins).toHaveBeenLastCalledWith(expect.objectContaining({ etag: null }));
  });
});
