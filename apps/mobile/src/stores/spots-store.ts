import { create } from "zustand";
import i18n from "../lib/i18n";
import * as api from "../lib/api";
import { extractErrorMessage } from "../lib/error";
import type { Spot } from "../types";
import type { CreateSpotParams, GetMapPinsParams, UpdateSpotParams } from "../lib/api";
import type { MapPin } from "@trs/shared/map";

interface SpotsState {
  spots: Spot[];
  feedSpots: Spot[];
  selectedSpot: Spot | null;
  isLoading: boolean;
  error: string | null;
  spotsCursor: string | null;
  feedCursor: string | null;
  /** Pins for the map's last fetched viewport. */
  mapPins: MapPin[];
  /** True when that fetch hit the limit — zooming in may reveal more. */
  mapTruncated: boolean;
  isMapLoading: boolean;

  fetchMySpots: (userId: string, opts?: { reset?: boolean }) => Promise<void>;
  fetchFeed: (opts?: { reset?: boolean }) => Promise<void>;
  /** Resolves true when the response was applied (false if stale or failed). */
  fetchMapPins: (params: GetMapPinsParams) => Promise<boolean>;
  createSpot: (params: CreateSpotParams) => Promise<Spot>;
  updateSpot: (id: string, params: UpdateSpotParams) => Promise<Spot>;
  deleteSpot: (id: string) => Promise<void>;
  selectSpot: (spot: Spot | null) => void;
  fetchSpotById: (id: string) => Promise<Spot>;
  clearError: () => void;
}

/** Sequence of the latest map request — older responses are dropped. */
let mapRequestSeq = 0;

export const useSpotsStore = create<SpotsState>()((set, get) => ({
  spots: [],
  feedSpots: [],
  selectedSpot: null,
  isLoading: false,
  error: null,
  spotsCursor: null,
  feedCursor: null,
  mapPins: [],
  mapTruncated: false,
  isMapLoading: false,

  // Map failures stay quiet: the last good pins remain on screen and the
  // next pan tries again. Only the newest response is ever applied.
  fetchMapPins: async (params) => {
    const seq = ++mapRequestSeq;
    set({ isMapLoading: true });
    try {
      const page = await api.getMapPins(params);
      if (seq !== mapRequestSeq) return false;
      set({ mapPins: page.items, mapTruncated: page.truncated, isMapLoading: false });
      return true;
    } catch {
      if (seq === mapRequestSeq) set({ isMapLoading: false });
      return false;
    }
  },

  fetchMySpots: async (userId, opts = {}) => {
    const reset = opts.reset ?? true;
    set({ isLoading: true, error: null });
    try {
      const cursor = reset ? undefined : (get().spotsCursor ?? undefined);
      const page = await api.getSpots({ userId, cursor });
      set((state) => ({
        spots: reset ? page.items : [...state.spots, ...page.items],
        spotsCursor: page.nextCursor,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, i18n.t("spots.errors.loadFailed")) });
    }
  },

  fetchFeed: async (opts = {}) => {
    const reset = opts.reset ?? true;
    set({ isLoading: true, error: null });
    try {
      const cursor = reset ? undefined : (get().feedCursor ?? undefined);
      const page = await api.getFeed(cursor);
      set((state) => ({
        feedSpots: reset ? page.items : [...state.feedSpots, ...page.items],
        feedCursor: page.nextCursor,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, i18n.t("spots.errors.feedFailed")) });
    }
  },

  createSpot: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const spot = await api.createSpot(params);
      set((state) => ({ spots: [spot, ...state.spots], isLoading: false }));
      return spot;
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, i18n.t("spots.errors.saveFailed")) });
      throw err;
    }
  },

  updateSpot: async (id, params) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.updateSpot(id, params);
      set((state) => ({
        spots: state.spots.map((s) => (s.id === id ? updated : s)),
        feedSpots: state.feedSpots.map((s) => (s.id === id ? updated : s)),
        selectedSpot: state.selectedSpot?.id === id ? updated : state.selectedSpot,
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, i18n.t("spots.errors.updateFailed")) });
      throw err;
    }
  },

  deleteSpot: async (id) => {
    const previous = get().spots;
    set((state) => ({ spots: state.spots.filter((s) => s.id !== id) }));
    try {
      await api.deleteSpot(id);
    } catch (err) {
      set({ spots: previous, error: extractErrorMessage(err, i18n.t("spots.errors.deleteFailed")) });
      throw err;
    }
  },

  selectSpot: (spot) => set({ selectedSpot: spot }),

  fetchSpotById: async (id) => {
    const spot = await api.getSpotById(id);
    set({ selectedSpot: spot });
    return spot;
  },

  clearError: () => set({ error: null }),
}));
