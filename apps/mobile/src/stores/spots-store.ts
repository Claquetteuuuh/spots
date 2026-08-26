import { create } from "zustand";
import axios from "axios";
import * as api from "../lib/api";
import type { Spot } from "../types";
import type { CreateSpotParams } from "../lib/api";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

interface SpotsState {
  spots: Spot[];
  feedSpots: Spot[];
  selectedSpot: Spot | null;
  isLoading: boolean;
  error: string | null;
  spotsCursor: string | null;
  feedCursor: string | null;

  fetchMySpots: (userId: string, opts?: { reset?: boolean }) => Promise<void>;
  fetchFeed: (opts?: { reset?: boolean }) => Promise<void>;
  createSpot: (params: CreateSpotParams) => Promise<Spot>;
  deleteSpot: (id: string) => Promise<void>;
  selectSpot: (spot: Spot | null) => void;
  fetchSpotById: (id: string) => Promise<Spot>;
  clearError: () => void;
}

export const useSpotsStore = create<SpotsState>()((set, get) => ({
  spots: [],
  feedSpots: [],
  selectedSpot: null,
  isLoading: false,
  error: null,
  spotsCursor: null,
  feedCursor: null,

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
      set({ isLoading: false, error: extractErrorMessage(err, "Unable to load spots") });
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
      set({ isLoading: false, error: extractErrorMessage(err, "Unable to load feed") });
    }
  },

  createSpot: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const spot = await api.createSpot(params);
      set((state) => ({ spots: [spot, ...state.spots], isLoading: false }));
      return spot;
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, "Unable to save spot") });
      throw err;
    }
  },

  deleteSpot: async (id) => {
    const previous = get().spots;
    set((state) => ({ spots: state.spots.filter((s) => s.id !== id) }));
    try {
      await api.deleteSpot(id);
    } catch (err) {
      set({ spots: previous, error: extractErrorMessage(err, "Unable to delete spot") });
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
