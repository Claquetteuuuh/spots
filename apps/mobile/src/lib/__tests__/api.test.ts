// Mock auth before importing api (api imports auth at module level via interceptors)
jest.mock("../auth", () => ({
  getAccessToken: jest.fn().mockResolvedValue(null),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  saveTokens: jest.fn().mockResolvedValue(undefined),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  setAccessToken: jest.fn().mockResolvedValue(undefined),
  hasStoredSession: jest.fn().mockResolvedValue(false),
}));

// Mock expo-secure-store (needed by auth)
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn(),
}));

import * as auth from "../auth";
import { client } from "../api";
import * as api from "../api";

describe("API client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("posts credentials and saves tokens", async () => {
      const mockResponse = {
        data: {
          accessToken: "at-1",
          refreshToken: "rt-1",
          user: { id: "u1", email: "a@b.c", username: "alice", name: "Alice" },
        },
      };
      jest.spyOn(client, "post").mockResolvedValueOnce(mockResponse);

      const result = await api.login({ email: "a@b.c", password: "pass" });

      expect(client.post).toHaveBeenCalledWith("/api/auth/login", {
        email: "a@b.c",
        password: "pass",
      });
      expect(auth.saveTokens).toHaveBeenCalledWith({
        accessToken: "at-1",
        refreshToken: "rt-1",
      });
      expect(result.user.email).toBe("a@b.c");
    });
  });

  describe("register", () => {
    it("posts new user data and saves tokens", async () => {
      const mockResponse = {
        data: {
          accessToken: "at-2",
          refreshToken: "rt-2",
          user: { id: "u2", email: "b@c.d", username: "bob", name: "Bob" },
        },
      };
      jest.spyOn(client, "post").mockResolvedValueOnce(mockResponse);

      const result = await api.register({
        email: "b@c.d",
        password: "password8",
        username: "bob",
        name: "Bob",
      });

      expect(client.post).toHaveBeenCalledWith("/api/auth/register", {
        email: "b@c.d",
        password: "password8",
        username: "bob",
        name: "Bob",
      });
      expect(auth.saveTokens).toHaveBeenCalledWith({
        accessToken: "at-2",
        refreshToken: "rt-2",
      });
      expect(result.user.username).toBe("bob");
    });
  });

  describe("loginWithGoogle", () => {
    it("posts Google id token with provider", async () => {
      const mockResponse = {
        data: {
          accessToken: "at-3",
          refreshToken: "rt-3",
          user: { id: "u3", email: "g@g.com", username: "guser", name: "G" },
        },
      };
      jest.spyOn(client, "post").mockResolvedValueOnce(mockResponse);

      const result = await api.loginWithGoogle("google-id-token");

      expect(client.post).toHaveBeenCalledWith("/api/auth/google", {
        token: "google-id-token",
        provider: "GOOGLE",
      });
      expect(auth.saveTokens).toHaveBeenCalled();
      expect(result.accessToken).toBe("at-3");
    });
  });

  describe("getMe", () => {
    it("fetches the current user", async () => {
      const mockUser = {
        id: "u1",
        email: "a@b.c",
        username: "alice",
        name: "Alice",
      };
      jest.spyOn(client, "get").mockResolvedValueOnce({ data: mockUser });

      const result = await api.getMe();
      expect(client.get).toHaveBeenCalledWith("/api/auth/me");
      expect(result).toEqual(mockUser);
    });
  });

  describe("spots", () => {
    it("getSpots fetches paginated spots", async () => {
      const mockData = { items: [], nextCursor: null };
      jest.spyOn(client, "get").mockResolvedValueOnce({ data: mockData });

      const result = await api.getSpots({ userId: "u1", limit: 10 });
      expect(client.get).toHaveBeenCalledWith("/api/spots", {
        params: expect.objectContaining({ userId: "u1", limit: 10 }),
      });
      expect(result).toEqual(mockData);
    });

    it("createSpot posts new spot", async () => {
      const spot = {
        latitude: 48.85,
        longitude: 2.35,
        photoUrl: "https://example.com/photo.jpg",
        photoKey: "key-1",
      };
      jest.spyOn(client, "post").mockResolvedValueOnce({
        data: { id: "s1", ...spot },
      });

      const result = await api.createSpot(spot);
      expect(client.post).toHaveBeenCalledWith("/api/spots", spot);
      expect(result.id).toBe("s1");
    });

    it("deleteSpot sends DELETE request", async () => {
      jest.spyOn(client, "delete").mockResolvedValueOnce({});
      await api.deleteSpot("s1");
      expect(client.delete).toHaveBeenCalledWith("/api/spots/s1");
    });

    it("getFeed fetches paginated feed", async () => {
      const mockData = { items: [], nextCursor: null };
      jest.spyOn(client, "get").mockResolvedValueOnce({ data: mockData });

      const result = await api.getFeed("cursor-1", 10);
      expect(client.get).toHaveBeenCalledWith("/api/spots/feed", {
        params: { cursor: "cursor-1", limit: 10 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("users", () => {
    it("followUser posts to follow endpoint", async () => {
      jest.spyOn(client, "post").mockResolvedValueOnce({});
      await api.followUser("alice");
      expect(client.post).toHaveBeenCalledWith("/api/users/alice/follow");
    });

    it("unfollowUser sends DELETE to unfollow endpoint", async () => {
      jest.spyOn(client, "delete").mockResolvedValueOnce({});
      await api.unfollowUser("alice");
      expect(client.delete).toHaveBeenCalledWith("/api/users/alice/follow");
    });

    it("searchUsers fetches matching users", async () => {
      const mockUsers = [{ id: "u1", username: "alice", name: "Alice" }];
      jest.spyOn(client, "get").mockResolvedValueOnce({ data: mockUsers });

      const result = await api.searchUsers("ali");
      expect(client.get).toHaveBeenCalledWith("/api/users/search", {
        params: { q: "ali", limit: 10 },
      });
      expect(result).toEqual(mockUsers);
    });

    it("getUserProfile fetches user by username", async () => {
      const mockUser = { id: "u1", username: "alice", name: "Alice" };
      jest.spyOn(client, "get").mockResolvedValueOnce({ data: mockUser });

      const result = await api.getUserProfile("alice");
      expect(client.get).toHaveBeenCalledWith("/api/users/alice");
      expect(result.username).toBe("alice");
    });

    it("updateProfile patches current user", async () => {
      const update = { name: "Alice Updated" };
      const mockUser = { id: "u1", username: "alice", name: "Alice Updated" };
      jest.spyOn(client, "patch").mockResolvedValueOnce({ data: mockUser });

      const result = await api.updateProfile(update);
      expect(client.patch).toHaveBeenCalledWith("/api/auth/me", update);
      expect(result.name).toBe("Alice Updated");
    });
  });

  describe("upload", () => {
    it("uploadPhoto sends FormData with photo field", async () => {
      const mockResult = { url: "https://cdn.example.com/photo.jpg", key: "k1" };
      jest.spyOn(client, "post").mockResolvedValueOnce({ data: mockResult });

      const result = await api.uploadPhoto("file:///path/to/photo.jpg", "photo.jpg");
      expect(client.post).toHaveBeenCalledWith(
        "/api/upload/photo",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe("mimeTypeFor", () => {
    it("maps the file extension to an image MIME type", () => {
      expect(api.mimeTypeFor("photo.png")).toBe("image/png");
      expect(api.mimeTypeFor("IMG_0001.HEIC")).toBe("image/heic");
      expect(api.mimeTypeFor("shot.heif")).toBe("image/heif");
      expect(api.mimeTypeFor("shot.webp")).toBe("image/webp");
      expect(api.mimeTypeFor("photo.jpeg")).toBe("image/jpeg");
    });

    it("falls back to JPEG when there is no usable extension", () => {
      expect(api.mimeTypeFor("photo")).toBe("image/jpeg");
      expect(api.mimeTypeFor("archive.zip")).toBe("image/jpeg");
    });
  });

  describe("community photos", () => {
    it("getSpotPhotos fetches a paginated page for the spot", async () => {
      const mockData = { items: [{ id: "p1" }], nextCursor: "p1" };
      jest.spyOn(client, "get").mockResolvedValueOnce({ data: mockData });

      const result = await api.getSpotPhotos("s1", "c1", 10);

      expect(client.get).toHaveBeenCalledWith("/api/spots/s1/photos", {
        params: { cursor: "c1", limit: 10 },
      });
      expect(result).toEqual(mockData);
    });

    it("addSpotPhoto posts every photo of a post as multipart form data", async () => {
      const mockPhoto = { id: "p1", images: [{ id: "i1", photoUrl: "https://cdn.example.com/p1.webp" }] };
      jest.spyOn(client, "post").mockResolvedValueOnce({ data: mockPhoto });

      const result = await api.addSpotPhoto(
        "s1",
        [{ uri: "file:///photo.jpg" }, { uri: "file:///other.jpg", fileName: "other.jpg" }],
        "Golden hour",
      );

      expect(client.post).toHaveBeenCalledWith(
        "/api/spots/s1/photos",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
          // …and a way to report how far the body has got
          onUploadProgress: expect.any(Function),
        })
      );
      expect(result).toEqual(mockPhoto);
    });

    it("deleteSpotPhoto sends DELETE to the photo route", async () => {
      jest.spyOn(client, "delete").mockResolvedValueOnce({});
      await api.deleteSpotPhoto("s1", "p1");
      expect(client.delete).toHaveBeenCalledWith("/api/spots/s1/photos/p1");
    });
  });

  describe("geocoding", () => {
    it("reverseGeocode fetches address for coordinates", async () => {
      const mockGeo = { address: "1 Rue de Rivoli", city: "Paris", country: "France" };
      jest.spyOn(client, "get").mockResolvedValueOnce({ data: mockGeo });

      const result = await api.reverseGeocode(48.8566, 2.3522);
      expect(client.get).toHaveBeenCalledWith("/api/geocoding/reverse", {
        params: { latitude: 48.8566, longitude: 2.3522 },
      });
      expect(result.city).toBe("Paris");
    });
  });
});
