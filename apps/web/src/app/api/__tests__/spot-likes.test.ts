import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

const mockSpotFindUnique = vi.fn();
const mockFollowFindUnique = vi.fn();
const mockLikeUpsert = vi.fn();
const mockLikeDeleteMany = vi.fn();
const mockLikeCount = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: { findUnique: (...args: unknown[]) => mockSpotFindUnique(...args) },
    follow: { findUnique: (...args: unknown[]) => mockFollowFindUnique(...args) },
    spotLike: {
      upsert: (...args: unknown[]) => mockLikeUpsert(...args),
      deleteMany: (...args: unknown[]) => mockLikeDeleteMany(...args),
      count: (...args: unknown[]) => mockLikeCount(...args),
    },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

import { POST, DELETE } from "../spots/[id]/like/route";

const VIEWER = { userId: "user-1", email: "alice@example.com", username: "alice" };
const req = (method: string) =>
  new NextRequest("http://localhost/api/spots/spot-1/like", {
    method,
    headers: { Authorization: "Bearer t" },
  });
const ctx = { params: Promise.resolve({ id: "spot-1" }) };

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFromRequest.mockResolvedValue(VIEWER);
  mockSpotFindUnique.mockResolvedValue({ userId: "user-1", visibility: "FOLLOWERS" });
  mockFollowFindUnique.mockResolvedValue(null);
  mockLikeUpsert.mockResolvedValue({ id: "l1" });
  mockLikeDeleteMany.mockResolvedValue({ count: 1 });
  mockLikeCount.mockResolvedValue(3);
});

describe("POST /api/spots/[id]/like", () => {
  it("likes your own spot and answers with the new count", async () => {
    const res = await POST(req("POST"), ctx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ isLiked: true, likeCount: 3 });
    expect(mockLikeUpsert.mock.calls[0][0]).toMatchObject({
      where: { spotId_userId: { spotId: "spot-1", userId: "user-1" } },
      create: { spotId: "spot-1", userId: "user-1" },
    });
  });

  it("lets an accepted follower like a shared spot", async () => {
    mockSpotFindUnique.mockResolvedValue({ userId: "user-2", visibility: "FOLLOWERS" });
    mockFollowFindUnique.mockResolvedValue({ status: "ACCEPTED" });

    expect((await POST(req("POST"), ctx)).status).toBe(200);
  });

  it("is a 404 for a spot the viewer cannot see", async () => {
    mockSpotFindUnique.mockResolvedValue({ userId: "user-2", visibility: "FOLLOWERS" });

    expect((await POST(req("POST"), ctx)).status).toBe(404);
    expect(mockLikeUpsert).not.toHaveBeenCalled();
  });

  it("is a 404 for a spot that does not exist", async () => {
    mockSpotFindUnique.mockResolvedValue(null);
    expect((await POST(req("POST"), ctx)).status).toBe(404);
  });

  it("is a 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await POST(req("POST"), ctx)).status).toBe(401);
  });

  it("is a 500 when the database fails", async () => {
    mockLikeUpsert.mockRejectedValue(new Error("db down"));
    expect((await POST(req("POST"), ctx)).status).toBe(500);
  });
});

describe("DELETE /api/spots/[id]/like", () => {
  it("removes the viewer's like and answers with the new count", async () => {
    mockLikeCount.mockResolvedValue(2);
    const res = await DELETE(req("DELETE"), ctx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ isLiked: false, likeCount: 2 });
    expect(mockLikeDeleteMany.mock.calls[0][0]).toEqual({
      where: { spotId: "spot-1", userId: "user-1" },
    });
  });

  it("is a 404 for a spot the viewer cannot see", async () => {
    mockSpotFindUnique.mockResolvedValue({ userId: "user-2", visibility: "PRIVATE" });
    expect((await DELETE(req("DELETE"), ctx)).status).toBe(404);
    expect(mockLikeDeleteMany).not.toHaveBeenCalled();
  });

  it("is a 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await DELETE(req("DELETE"), ctx)).status).toBe(401);
  });
});
