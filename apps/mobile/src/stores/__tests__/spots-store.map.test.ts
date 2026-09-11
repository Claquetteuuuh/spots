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

import { useSpotsStore } from "../spots-store";
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
    useSpotsStore.setState({ mapPins: [], mapTruncated: false, isMapLoading: false, error: null });
  });

  it("stores the pins and the truncation flag", async () => {
    getMapPins.mockResolvedValueOnce({ items: [pin("a")], truncated: true });

    const applied = await useSpotsStore.getState().fetchMapPins({ bounds: BOX, scope: "all" });

    expect(applied).toBe(true);
    expect(getMapPins).toHaveBeenCalledWith({ bounds: BOX, scope: "all" });
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
});
