import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// Mock storage
const mockUploadFile = vi.fn().mockResolvedValue("https://cdn.example.com/photo.jpg");
vi.mock("@/lib/storage", () => ({
  uploadFile: (...args: unknown[]) => mockUploadFile(...args),
  deleteFile: vi.fn().mockResolvedValue(undefined),
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

// Mock prisma (needed for avatar route)
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ avatarUrl: null }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { POST as PhotoUpload } from "../upload/photo/route";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

function makeUploadRequest(fieldName: string, file: File) {
  const formData = new FormData();
  formData.append(fieldName, file);

  return new NextRequest("http://localhost/api/upload/photo", {
    method: "POST",
    headers: { Authorization: "Bearer mock-token" },
    body: formData,
  });
}

describe("POST /api/upload/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadFile.mockResolvedValue("https://cdn.example.com/photo.jpg");
  });

  it("uploads a valid JPEG photo", async () => {
    const file = new File(["fake-image-data"], "photo.jpg", {
      type: "image/jpeg",
    });

    const res = await PhotoUpload(makeUploadRequest("photo", file), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.photoUrl).toBe("https://cdn.example.com/photo.jpg");
    expect(json.data.photoKey).toMatch(/^spots\/user-1\/.+\.jpeg$/);
    expect(mockUploadFile).toHaveBeenCalledOnce();
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
    // Create a large buffer (11MB) to exceed the 10MB limit
    const bigContent = new Uint8Array(11 * 1024 * 1024);
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
