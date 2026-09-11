import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

const mockSpotFindMany = vi.fn();
const mockFollowFindMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: { findMany: (...args: unknown[]) => mockSpotFindMany(...args) },
    follow: { findMany: (...args: unknown[]) => mockFollowFindMany(...args) },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

import { GET } from "../spots/map/route";

const VIEWER = { userId: "user-1", email: "alice@example.com", username: "alice" };

const BOX = { swLat: "48.8", swLng: "2.2", neLat: "48.9", neLng: "2.45" };

const row = (id: string, userId: string) => ({
  id,
  userId,
  latitude: 48.85,
  longitude: 2.35,
  title: id,
  photoUrl: `https://cdn.example.com/${id}.jpg`,
  city: "Paris",
});

/** `[request, context]` — spread into the handler, which `withAuth` types as two-arg. */
function makeRequest(params: Record<string, string> = {}): [NextRequest, unknown] {
  const url = new URL("http://localhost/api/spots/map");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return [
    new NextRequest(url.toString(), { headers: { Authorization: "Bearer mock-token" } }),
    {},
  ];
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFromRequest.mockResolvedValue(VIEWER);
  mockSpotFindMany.mockResolvedValue([]);
  mockFollowFindMany.mockResolvedValue([]);
});

describe("GET /api/spots/map", () => {
  it("returns own pins first, then followed users' pins, flagged and unpaginated", async () => {
    mockFollowFindMany.mockResolvedValue([{ followingId: "user-2" }]);
    mockSpotFindMany
      .mockResolvedValueOnce([row("mine-1", VIEWER.userId)])
      .mockResolvedValueOnce([row("theirs-1", "user-2"), row("theirs-2", "user-2")]);

    const res = await GET(...makeRequest(BOX));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.items.map((p: { id: string }) => p.id)).toEqual([
      "mine-1",
      "theirs-1",
      "theirs-2",
    ]);
    expect(json.data.items[0].isOwn).toBe(true);
    expect(json.data.items[1].isOwn).toBe(false);
    expect(json.data.truncated).toBe(false);
    expect(json.data.items[0]).not.toHaveProperty("user");
    expect(json.data.items[0]).not.toHaveProperty("images");
  });

  it("filters both queries by the bounding box with a select projection", async () => {
    mockFollowFindMany.mockResolvedValue([{ followingId: "user-2" }]);

    await GET(...makeRequest(BOX));

    const bbox = {
      latitude: { gte: 48.8, lte: 48.9 },
      longitude: { gte: 2.2, lte: 2.45 },
    };
    expect(mockSpotFindMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { userId: VIEWER.userId, ...bbox },
        select: expect.objectContaining({ latitude: true, longitude: true, photoUrl: true }),
        take: 500,
      }),
    );
    expect(mockSpotFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: { in: ["user-2"] }, visibility: "FOLLOWERS", ...bbox },
      }),
    );
  });

  it("gives followed spots only the budget left after own spots, and flags truncation", async () => {
    mockFollowFindMany.mockResolvedValue([{ followingId: "user-2" }]);
    mockSpotFindMany
      .mockResolvedValueOnce([row("m1", VIEWER.userId), row("m2", VIEWER.userId)])
      .mockResolvedValueOnce([row("t1", "user-2")]);

    const res = await GET(...makeRequest({ ...BOX, limit: "3" }));
    const json = await res.json();

    expect(mockSpotFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ take: 1 }));
    expect(json.data.items).toHaveLength(3);
    expect(json.data.truncated).toBe(true);
  });

  it("skips the followed query entirely when own spots fill the limit", async () => {
    mockFollowFindMany.mockResolvedValue([{ followingId: "user-2" }]);
    mockSpotFindMany.mockResolvedValueOnce([row("m1", VIEWER.userId), row("m2", VIEWER.userId)]);

    const res = await GET(...makeRequest({ ...BOX, limit: "2" }));
    const json = await res.json();

    expect(mockSpotFindMany).toHaveBeenCalledTimes(1);
    expect(json.data.truncated).toBe(true);
  });

  it("scope=mine never looks up follows", async () => {
    mockSpotFindMany.mockResolvedValueOnce([row("m1", VIEWER.userId)]);

    const res = await GET(...makeRequest({ ...BOX, scope: "mine" }));
    const json = await res.json();

    expect(mockFollowFindMany).not.toHaveBeenCalled();
    expect(mockSpotFindMany).toHaveBeenCalledTimes(1);
    expect(json.data.items.map((p: { id: string }) => p.id)).toEqual(["m1"]);
  });

  it("scope=following never queries own spots", async () => {
    mockFollowFindMany.mockResolvedValue([{ followingId: "user-2" }]);
    mockSpotFindMany.mockResolvedValueOnce([row("t1", "user-2")]);

    const res = await GET(...makeRequest({ ...BOX, scope: "following" }));
    const json = await res.json();

    expect(mockSpotFindMany).toHaveBeenCalledTimes(1);
    expect(mockSpotFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ visibility: "FOLLOWERS" }) }),
    );
    expect(json.data.items[0]).toMatchObject({ id: "t1", isOwn: false });
  });

  it("returns only own pins when the viewer follows nobody", async () => {
    mockSpotFindMany.mockResolvedValueOnce([row("m1", VIEWER.userId)]);

    const res = await GET(...makeRequest(BOX));
    const json = await res.json();

    expect(mockSpotFindMany).toHaveBeenCalledTimes(1);
    expect(json.data.items).toHaveLength(1);
  });

  it("returns 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);

    const res = await GET(...makeRequest(BOX));

    expect(res.status).toBe(401);
    expect(mockSpotFindMany).not.toHaveBeenCalled();
  });

  it("returns 400 when a bound is missing", async () => {
    const res = await GET(...makeRequest({ swLat: "48.8", swLng: "2.2", neLat: "48.9" }));

    expect(res.status).toBe(400);
    expect(mockSpotFindMany).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid scope or an out-of-range limit", async () => {
    expect((await GET(...makeRequest({ ...BOX, scope: "everyone" }))).status).toBe(400);
    expect((await GET(...makeRequest({ ...BOX, limit: "9999" }))).status).toBe(400);
  });

  it("returns 500 when the database fails", async () => {
    mockSpotFindMany.mockRejectedValue(new Error("connection lost"));

    const res = await GET(...makeRequest(BOX));

    expect(res.status).toBe(500);
  });
});
