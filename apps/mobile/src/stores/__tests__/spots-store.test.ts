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

const mockSpot = {
  id: "s1",
  userId: "u1",
  latitude: 48.85,
  longitude: 2.35,
  photoUrl: "https://cdn.example.com/photo.jpg",
  photoKey: "key-1",
  isFree: true,
  colors: ["#8B7355"],
  compositions: ["SYMMETRY" as const],
  tags: ["sunset"],
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const mockSpot2 = { ...mockSpot, id: "s2", photoKey: "key-2" };

function resetStore() {
  useSpotsStore.setState({
    spots: [],
    feedSpots: [],
    selectedSpot: null,
    isLoading: false,
    error: null,
    spotsCursor: null,
    feedCursor: null,
  });
}

describe("spots store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe("fetchMySpots", () => {
    it("sets spots on success (reset mode)", async () => {
      (api.getSpots as jest.Mock).mockResolvedValueOnce({
        items: [mockSpot],
        nextCursor: "c1",
      });

      await useSpotsStore.getState().fetchMySpots("u1");

      const state = useSpotsStore.getState();
      expect(state.spots).toEqual([mockSpot]);
      expect(state.spotsCursor).toBe("c1");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("appends spots when not resetting", async () => {
      useSpotsStore.setState({
        spots: [mockSpot],
        spotsCursor: "c1",
      });

      (api.getSpots as jest.Mock).mockResolvedValueOnce({
        items: [mockSpot2],
        nextCursor: "c2",
      });

      await useSpotsStore.getState().fetchMySpots("u1", { reset: false });

      const state = useSpotsStore.getState();
      expect(state.spots).toEqual([mockSpot, mockSpot2]);
      expect(state.spotsCursor).toBe("c2");
    });

    it("sets error on failure", async () => {
      (api.getSpots as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      await useSpotsStore.getState().fetchMySpots("u1");

      const state = useSpotsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Network error");
    });
  });

  describe("fetchFeed", () => {
    it("sets feedSpots on success", async () => {
      (api.getFeed as jest.Mock).mockResolvedValueOnce({
        items: [mockSpot],
        nextCursor: null,
      });

      await useSpotsStore.getState().fetchFeed();

      const state = useSpotsStore.getState();
      expect(state.feedSpots).toEqual([mockSpot]);
      expect(state.feedCursor).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it("appends feed spots when not resetting", async () => {
      useSpotsStore.setState({
        feedSpots: [mockSpot],
        feedCursor: "fc1",
      });

      (api.getFeed as jest.Mock).mockResolvedValueOnce({
        items: [mockSpot2],
        nextCursor: null,
      });

      await useSpotsStore.getState().fetchFeed({ reset: false });

      expect(useSpotsStore.getState().feedSpots).toEqual([mockSpot, mockSpot2]);
    });

    it("sets error on failure", async () => {
      (api.getFeed as jest.Mock).mockRejectedValueOnce(new Error("Timeout"));

      await useSpotsStore.getState().fetchFeed();

      expect(useSpotsStore.getState().error).toBe("Timeout");
    });
  });

  describe("createSpot", () => {
    it("prepends new spot to list on success", async () => {
      useSpotsStore.setState({ spots: [mockSpot] });
      (api.createSpot as jest.Mock).mockResolvedValueOnce(mockSpot2);

      const result = await useSpotsStore.getState().createSpot({
        latitude: 48.85,
        longitude: 2.35,
        photoUrl: "url",
        photoKey: "key-2",
      });

      expect(result).toEqual(mockSpot2);
      expect(useSpotsStore.getState().spots[0]).toEqual(mockSpot2);
    });

    it("sets error on failure", async () => {
      (api.createSpot as jest.Mock).mockRejectedValueOnce(new Error("Upload failed"));

      await expect(
        useSpotsStore.getState().createSpot({
          latitude: 48.85,
          longitude: 2.35,
          photoUrl: "url",
          photoKey: "key",
        })
      ).rejects.toThrow();

      expect(useSpotsStore.getState().error).toBe("Upload failed");
    });
  });

  describe("deleteSpot", () => {
    it("removes spot optimistically and confirms", async () => {
      useSpotsStore.setState({ spots: [mockSpot, mockSpot2] });
      (api.deleteSpot as jest.Mock).mockResolvedValueOnce(undefined);

      await useSpotsStore.getState().deleteSpot("s1");

      const spots = useSpotsStore.getState().spots;
      expect(spots).toHaveLength(1);
      expect(spots[0].id).toBe("s2");
    });

    it("rolls back on failure", async () => {
      useSpotsStore.setState({ spots: [mockSpot, mockSpot2] });
      (api.deleteSpot as jest.Mock).mockRejectedValueOnce(new Error("403"));

      await expect(
        useSpotsStore.getState().deleteSpot("s1")
      ).rejects.toThrow();

      const state = useSpotsStore.getState();
      expect(state.spots).toHaveLength(2);
      expect(state.error).toBe("403");
    });
  });

  describe("selectSpot", () => {
    it("sets selectedSpot", () => {
      useSpotsStore.getState().selectSpot(mockSpot);
      expect(useSpotsStore.getState().selectedSpot).toEqual(mockSpot);
    });

    it("clears selectedSpot with null", () => {
      useSpotsStore.setState({ selectedSpot: mockSpot });
      useSpotsStore.getState().selectSpot(null);
      expect(useSpotsStore.getState().selectedSpot).toBeNull();
    });
  });

  describe("fetchSpotById", () => {
    it("fetches spot and sets selectedSpot", async () => {
      (api.getSpotById as jest.Mock).mockResolvedValueOnce(mockSpot);

      const result = await useSpotsStore.getState().fetchSpotById("s1");
      expect(result).toEqual(mockSpot);
      expect(useSpotsStore.getState().selectedSpot).toEqual(mockSpot);
    });
  });

  describe("clearError", () => {
    it("resets error to null", () => {
      useSpotsStore.setState({ error: "some error" });
      useSpotsStore.getState().clearError();
      expect(useSpotsStore.getState().error).toBeNull();
    });
  });
});
