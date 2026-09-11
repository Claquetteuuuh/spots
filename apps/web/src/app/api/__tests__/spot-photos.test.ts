import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";

// Mock storage
const mockUploadFile = vi.fn();
const mockDeleteFile = vi.fn();
vi.mock("@/lib/storage", () => ({
  uploadFile: (...args: unknown[]) => mockUploadFile(...args),
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
  deleteFiles: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth — the caller is user-1
const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

// Mock prisma
const mockSpotFindUnique = vi.fn();
const mockSpotPhotoFindUnique = vi.fn();
const mockSpotPhotoCreate = vi.fn();
const mockSpotPhotoDelete = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: { findUnique: (...args: unknown[]) => mockSpotFindUnique(...args) },
    spotPhoto: {
      findUnique: (...args: unknown[]) => mockSpotPhotoFindUnique(...args),
      create: (...args: unknown[]) => mockSpotPhotoCreate(...args),
      delete: (...args: unknown[]) => mockSpotPhotoDelete(...args),
    },
  },
}));

import { POST } from "../spots/[id]/photos/route";
import { DELETE } from "../spots/[id]/photos/[photoId]/route";

const CALLER = { userId: "user-1", email: "alice@example.com", username: "alice" };

const PHOTO = {
  id: "photo-1",
  spotId: "spot-1",
  userId: "user-1",
  photoUrl: "https://cdn.example.com/spot-photos/spot-1/user-1/p.webp",
  photoKey: "spot-photos/spot-1/user-1/p.webp",
  caption: null,
  createdAt: new Date(),
  spot: { userId: "owner-9" },
};

function deleteRequest(spotId: string, photoId: string) {
  const req = new NextRequest(`http://localhost/api/spots/${spotId}/photos/${photoId}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer mock-token" },
  });
  return DELETE(req, { params: Promise.resolve({ id: spotId, photoId }) });
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

describe("POST /api/spots/[id]/photos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue(CALLER);
    mockSpotFindUnique.mockResolvedValue({ id: "spot-1", userId: "owner-9" });
    mockUploadFile.mockResolvedValue("https://cdn.example.com/spot-photos/x.webp");
    mockSpotPhotoCreate.mockImplementation(async ({ data }) => ({
      id: "photo-new",
      ...data,
      createdAt: new Date(),
      user: { id: CALLER.userId, username: CALLER.username, name: "Alice", avatarUrl: null },
    }));
  });

  it("compresses the photo, stores it as WebP and keeps the caption", async () => {
    const jpeg = await sharp({
      create: { width: 3000, height: 3000, channels: 3, background: "#4574C4" },
    })
      .jpeg()
      .toBuffer();
    const formData = new FormData();
    formData.append("photo", new File([jpeg], "shot.jpg", { type: "image/jpeg" }));
    formData.append("caption", "Golden hour");

    const req = new NextRequest("http://localhost/api/spots/spot-1/photos", {
      method: "POST",
      headers: { Authorization: "Bearer mock-token" },
      body: formData,
    });

    const res = await POST(req, { params: Promise.resolve({ id: "spot-1" }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.caption).toBe("Golden hour");
    expect(json.data.photoKey).toMatch(/^spot-photos\/spot-1\/user-1\/.+\.webp$/);

    const [, body, contentType] = mockUploadFile.mock.calls[0];
    expect(contentType).toBe("image/webp");
    const meta = await sharp(body as Buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(2560);
  });

  it("returns 404 for an unknown spot before reading the file", async () => {
    mockSpotFindUnique.mockResolvedValue(null);
    const formData = new FormData();
    formData.append("photo", new File(["x"], "shot.jpg", { type: "image/jpeg" }));

    const req = new NextRequest("http://localhost/api/spots/nope/photos", {
      method: "POST",
      headers: { Authorization: "Bearer mock-token" },
      body: formData,
    });

    const res = await POST(req, { params: Promise.resolve({ id: "nope" }) });
    expect(res.status).toBe(404);
    expect(mockUploadFile).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/spots/[id]/photos/[photoId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue(CALLER);
    mockSpotPhotoFindUnique.mockResolvedValue(PHOTO);
    mockSpotPhotoDelete.mockResolvedValue(PHOTO);
    mockDeleteFile.mockResolvedValue(undefined);
  });

  it("lets the author delete their photo and removes the file", async () => {
    const res = await deleteRequest("spot-1", "photo-1");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("photo-1");
    expect(mockSpotPhotoDelete).toHaveBeenCalledWith({ where: { id: "photo-1" } });
    expect(mockDeleteFile).toHaveBeenCalledWith(PHOTO.photoKey);
  });

  it("lets the spot owner remove someone else's photo", async () => {
    mockSpotPhotoFindUnique.mockResolvedValue({
      ...PHOTO,
      userId: "user-2",
      spot: { userId: CALLER.userId },
    });

    const res = await deleteRequest("spot-1", "photo-1");
    expect(res.status).toBe(200);
    expect(mockDeleteFile).toHaveBeenCalledOnce();
  });

  it("refuses anyone else with a 403", async () => {
    mockSpotPhotoFindUnique.mockResolvedValue({ ...PHOTO, userId: "user-2" });

    const res = await deleteRequest("spot-1", "photo-1");
    expect(res.status).toBe(403);
    expect(mockSpotPhotoDelete).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("returns 404 when the photo is not under that spot", async () => {
    const res = await deleteRequest("another-spot", "photo-1");
    expect(res.status).toBe(404);
    expect(mockSpotPhotoDelete).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown photo", async () => {
    mockSpotPhotoFindUnique.mockResolvedValue(null);
    const res = await deleteRequest("spot-1", "nope");
    expect(res.status).toBe(404);
  });

  it("still answers 200 when storage cleanup fails — the row is gone", async () => {
    mockDeleteFile.mockRejectedValue(new Error("R2 down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await deleteRequest("spot-1", "photo-1");
    expect(res.status).toBe(200);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("requires authentication", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    const res = await deleteRequest("spot-1", "photo-1");
    expect(res.status).toBe(401);
  });
});
