import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

const mockDeleteFile = vi.fn();
vi.mock("@/lib/storage", () => ({
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
  deleteFiles: vi.fn(),
  uploadFile: vi.fn(),
}));

const mockSpotFindUnique = vi.fn();
const mockSpotUpdate = vi.fn();
const mockImageFindUnique = vi.fn();
const mockImageFindMany = vi.fn();
const mockImageCreate = vi.fn();
const mockImageDelete = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: {
      findUnique: (...args: unknown[]) => mockSpotFindUnique(...args),
      update: (...args: unknown[]) => mockSpotUpdate(...args),
    },
    spotImage: {
      findUnique: (...args: unknown[]) => mockImageFindUnique(...args),
      findMany: (...args: unknown[]) => mockImageFindMany(...args),
      create: (...args: unknown[]) => mockImageCreate(...args),
      delete: (...args: unknown[]) => mockImageDelete(...args),
    },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

import { POST } from "../spots/[id]/images/route";
import { DELETE } from "../spots/[id]/images/[imageId]/route";

const OWNER = { userId: "user-1", email: "alice@example.com", username: "alice" };
const post = (body: unknown) =>
  new NextRequest("http://localhost/api/spots/spot-1/images", {
    method: "POST",
    headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const del = () =>
  new NextRequest("http://localhost/api/spots/spot-1/images/img-2", {
    method: "DELETE",
    headers: { Authorization: "Bearer t" },
  });
const postCtx = { params: Promise.resolve({ id: "spot-1" }) };
const delCtx = { params: Promise.resolve({ id: "spot-1", imageId: "img-2" }) };
const PHOTO = { photoUrl: "https://cdn/new.webp", photoKey: "spots/user-1/new.webp" };
const image = (id: string, order: number) => ({ id, spotId: "spot-1", photoUrl: `https://cdn/${id}.webp`, photoKey: `k-${id}`, order });

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFromRequest.mockResolvedValue(OWNER);
  mockSpotFindUnique.mockResolvedValue({ userId: "user-1", images: [{ order: 1 }], _count: { images: 2 } });
  mockImageCreate.mockResolvedValue(image("img-3", 2));
  mockImageFindMany.mockResolvedValue([image("img-1", 0), image("img-2", 1), image("img-3", 2)]);
  mockImageFindUnique.mockResolvedValue({
    ...image("img-2", 1),
    spot: { userId: "user-1", photoKey: "k-img-1", _count: { images: 2 } },
  });
  mockImageDelete.mockResolvedValue(undefined);
  mockSpotUpdate.mockResolvedValue(undefined);
  mockDeleteFile.mockResolvedValue(undefined);
});

describe("POST /api/spots/[id]/images", () => {
  it("adds the photo last and answers with the whole gallery", async () => {
    const res = await POST(post(PHOTO), postCtx);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data).toHaveLength(3);
    expect(mockImageCreate.mock.calls[0][0].data).toEqual({ spotId: "spot-1", ...PHOTO, order: 2 });
  });

  it("starts at order 0 on an empty gallery", async () => {
    mockSpotFindUnique.mockResolvedValue({ userId: "user-1", images: [], _count: { images: 0 } });
    await POST(post(PHOTO), postCtx);
    expect(mockImageCreate.mock.calls[0][0].data.order).toBe(0);
  });

  it("refuses anyone but the owner, a missing spot, a full gallery and a bad body", async () => {
    mockSpotFindUnique.mockResolvedValueOnce({ userId: "user-2", images: [], _count: { images: 1 } });
    expect((await POST(post(PHOTO), postCtx)).status).toBe(403);

    mockSpotFindUnique.mockResolvedValueOnce(null);
    expect((await POST(post(PHOTO), postCtx)).status).toBe(404);

    mockSpotFindUnique.mockResolvedValueOnce({ userId: "user-1", images: [{ order: 9 }], _count: { images: 10 } });
    expect((await POST(post(PHOTO), postCtx)).status).toBe(400);

    expect((await POST(post({ photoUrl: "not a url", photoKey: "" }), postCtx)).status).toBe(400);
    expect(mockImageCreate).not.toHaveBeenCalled();
  });

  it("is a 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await POST(post(PHOTO), postCtx)).status).toBe(401);
  });
});

describe("DELETE /api/spots/[id]/images/[imageId]", () => {
  it("removes the row and the stored file, leaving the cover alone", async () => {
    mockImageFindMany.mockResolvedValue([image("img-1", 0)]);

    const res = await DELETE(del(), delCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ id: "img-2", images: [image("img-1", 0)], cover: null });
    expect(mockImageDelete).toHaveBeenCalledWith({ where: { id: "img-2" } });
    expect(mockDeleteFile).toHaveBeenCalledWith("k-img-2");
    expect(mockSpotUpdate).not.toHaveBeenCalled();
  });

  it("hands the cover to the next photo when the cover goes", async () => {
    mockImageFindUnique.mockResolvedValue({
      ...image("img-2", 1),
      spot: { userId: "user-1", photoKey: "k-img-2", _count: { images: 2 } },
    });
    mockImageFindMany.mockResolvedValue([image("img-1", 0)]);

    const json = await (await DELETE(del(), delCtx)).json();

    expect(json.data.cover).toEqual({ photoUrl: "https://cdn/img-1.webp", photoKey: "k-img-1" });
    expect(mockSpotUpdate).toHaveBeenCalledWith({
      where: { id: "spot-1" },
      data: { photoUrl: "https://cdn/img-1.webp", photoKey: "k-img-1" },
    });
  });

  it("keeps the last photo", async () => {
    mockImageFindUnique.mockResolvedValue({
      ...image("img-2", 0),
      spot: { userId: "user-1", photoKey: "k-img-2", _count: { images: 1 } },
    });
    expect((await DELETE(del(), delCtx)).status).toBe(400);
    expect(mockImageDelete).not.toHaveBeenCalled();
  });

  it("refuses anyone but the owner, and a photo of another spot", async () => {
    mockImageFindUnique.mockResolvedValueOnce({
      ...image("img-2", 1),
      spot: { userId: "user-9", photoKey: "k", _count: { images: 2 } },
    });
    expect((await DELETE(del(), delCtx)).status).toBe(403);

    mockImageFindUnique.mockResolvedValueOnce({ ...image("img-2", 1), spotId: "other", spot: { userId: "user-1", photoKey: "k", _count: { images: 2 } } });
    expect((await DELETE(del(), delCtx)).status).toBe(404);
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("still answers when the storage delete fails", async () => {
    mockDeleteFile.mockRejectedValue(new Error("r2 down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await DELETE(del(), delCtx)).status).toBe(200);
    spy.mockRestore();
  });
});
