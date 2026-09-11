import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { PHOTO_MAX_EDGE } from "@/lib/image";

// Mock storage
const mockUploadFile = vi.fn().mockResolvedValue("https://cdn.example.com/photo.webp");
const mockDeleteFiles = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/storage", () => ({
  uploadFile: (...args: unknown[]) => mockUploadFile(...args),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  deleteFiles: (...args: unknown[]) => mockDeleteFiles(...args),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  signAccessToken: vi.fn().mockReturnValue("mock-access-token"),
  signRefreshToken: vi.fn().mockReturnValue("mock-refresh-token"),
  verifyAccessToken: vi.fn().mockReturnValue({
    userId: "user-1",
    email: "alice@example.com",
    username: "alice",
  }),
  getUserFromRequest: vi.fn().mockResolvedValue({
    userId: "user-1",
    email: "alice@example.com",
    username: "alice",
  }),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

// Mock prisma (the discard route checks whether a key is still in use)
const mockSpotFindMany = vi.fn();
const mockSpotImageFindMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: { findMany: (...args: unknown[]) => mockSpotFindMany(...args) },
    spotImage: { findMany: (...args: unknown[]) => mockSpotImageFindMany(...args) },
  },
}));

import { POST as PhotoUpload, DELETE as PhotoDiscard } from "../upload/photo/route";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

/** A real, decodable image — the route now refuses anything else. */
async function makeImage(width: number, height: number, format: "jpeg" | "png" = "jpeg") {
  const pipeline = sharp({
    create: { width, height, channels: 3, background: "#4574C4" },
  });
  return format === "png" ? pipeline.png().toBuffer() : pipeline.jpeg().toBuffer();
}

function makeUploadRequest(fieldName: string, file: File) {
  const formData = new FormData();
  formData.append(fieldName, file);

  return new NextRequest("http://localhost/api/upload/photo", {
    method: "POST",
    headers: { Authorization: "Bearer mock-token" },
    body: formData,
  });
}

function makeDiscardRequest(body: unknown) {
  return new NextRequest("http://localhost/api/upload/photo", {
    method: "DELETE",
    headers: {
      Authorization: "Bearer mock-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadFile.mockResolvedValue("https://cdn.example.com/photo.webp");
  });

  it("stores a valid JPEG as compressed WebP", async () => {
    const jpeg = await makeImage(800, 600);
    const file = new File([jpeg], "photo.jpg", { type: "image/jpeg" });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.photoUrl).toBe("https://cdn.example.com/photo.webp");
    expect(json.data.photoKey).toMatch(/^spots\/user-1\/.+\.webp$/);
    expect(json.data.width).toBe(800);
    expect(json.data.height).toBe(600);

    expect(mockUploadFile).toHaveBeenCalledOnce();
    const [key, body, contentType] = mockUploadFile.mock.calls[0];
    expect(key).toBe(json.data.photoKey);
    expect(contentType).toBe("image/webp");
    expect((await sharp(body as Buffer).metadata()).format).toBe("webp");
    expect(json.data.bytes).toBe((body as Buffer).byteLength);
  });

  it("downscales an oversized photo before storing it", async () => {
    const jpeg = await makeImage(4000, 3000);
    const file = new File([jpeg], "big.jpg", { type: "image/jpeg" });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.width).toBe(PHOTO_MAX_EDGE);
    expect(json.data.height).toBe(1920);

    const stored = mockUploadFile.mock.calls[0][1] as Buffer;
    const meta = await sharp(stored).metadata();
    expect(meta.width).toBe(PHOTO_MAX_EDGE);
    expect(meta.height).toBe(1920);
  });

  it("converts PNG uploads to WebP too", async () => {
    const png = await makeImage(300, 300, "png");
    const file = new File([png], "shot.png", { type: "image/png" });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.photoKey).toMatch(/\.webp$/);
    expect(mockUploadFile.mock.calls[0][2]).toBe("image/webp");
  });

  it("rejects bytes that are not an image", async () => {
    const file = new File(["fake-image-data"], "photo.jpg", {
      type: "image/jpeg",
    });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Could not process");
    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  it("rejects unsupported file type", async () => {
    const file = new File(["fake-data"], "doc.pdf", {
      type: "application/pdf",
    });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Unsupported file type");
  });

  it("rejects file larger than max size", async () => {
    // 21MB exceeds the 20MB ceiling
    const bigContent = new Uint8Array(21 * 1024 * 1024);
    const file = new File([bigContent], "big.jpg", { type: "image/jpeg" });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("too large");
  });

  it("rejects empty file", async () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("empty");
  });

  it("rejects missing photo field", async () => {
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    // Send with wrong field name
    const res = await PhotoUpload(makeUploadRequest("wrongfield", file), undefined as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing");
  });
});

describe("DELETE /api/upload/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpotFindMany.mockResolvedValue([]);
    mockSpotImageFindMany.mockResolvedValue([]);
  });

  it("deletes staged photos the caller owns", async () => {
    const keys = ["spots/user-1/a.webp", "spots/user-1/b.webp"];
    const res = await PhotoDiscard(makeDiscardRequest({ keys }), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.deleted).toEqual(keys);
    expect(mockDeleteFiles).toHaveBeenCalledWith(keys);
  });

  it("refuses keys outside the caller's own prefix", async () => {
    const res = await PhotoDiscard(
      makeDiscardRequest({ keys: ["spots/user-2/theirs.webp"] }),
      undefined as never,
    );

    expect(res.status).toBe(403);
    expect(mockDeleteFiles).not.toHaveBeenCalled();
  });

  it("refuses path traversal inside an otherwise valid prefix", async () => {
    const res = await PhotoDiscard(
      makeDiscardRequest({ keys: ["spots/user-1/../user-2/x.webp"] }),
      undefined as never,
    );

    expect(res.status).toBe(403);
    expect(mockDeleteFiles).not.toHaveBeenCalled();
  });

  it("leaves a key alone when a spot already references it", async () => {
    mockSpotImageFindMany.mockResolvedValue([{ photoKey: "spots/user-1/used.webp" }]);

    const res = await PhotoDiscard(
      makeDiscardRequest({ keys: ["spots/user-1/used.webp", "spots/user-1/free.webp"] }),
      undefined as never,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.deleted).toEqual(["spots/user-1/free.webp"]);
    expect(mockDeleteFiles).toHaveBeenCalledWith(["spots/user-1/free.webp"]);
  });

  it("validates the body", async () => {
    const res = await PhotoDiscard(makeDiscardRequest({ keys: [] }), undefined as never);
    expect(res.status).toBe(400);
  });
});
