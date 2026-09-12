import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

const mockLikeFindMany = vi.fn();
const mockPhotoFindMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spotLike: { findMany: (...args: unknown[]) => mockLikeFindMany(...args) },
    spotPhoto: { findMany: (...args: unknown[]) => mockPhotoFindMany(...args) },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

import { GET } from "../me/activity/route";

const VIEWER = { userId: "user-1", email: "alice@example.com", username: "alice" };
const req = (query: string) =>
  new NextRequest(`http://localhost/api/me/activity${query}`, { headers: { Authorization: "Bearer t" } });
const spot = { id: "s1", title: "Seine", photoUrl: "https://cdn/s1.webp", city: "Paris", country: "France", userId: "user-2", user: { id: "user-2", username: "bob", name: "Bob", avatarUrl: null } };
const like = (id: string) => ({ id, createdAt: new Date(), spot });

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFromRequest.mockResolvedValue(VIEWER);
  mockLikeFindMany.mockResolvedValue([]);
  mockPhotoFindMany.mockResolvedValue([]);
});

describe("GET /api/me/activity", () => {
  it("lists the viewer's likes with their spots, newest first", async () => {
    mockLikeFindMany.mockResolvedValue([like("l1"), like("l2")]);

    const res = await GET(req("?type=likes"), {});
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.items.map((i: { id: string }) => i.id)).toEqual(["l1", "l2"]);
    expect(json.data.items[0].spot.user.username).toBe("bob");
    expect(json.data.nextCursor).toBeNull();
    const args = mockLikeFindMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: VIEWER.userId });
    expect(args.orderBy[0]).toEqual({ createdAt: "desc" });
    expect(args.take).toBe(21);
    expect(mockPhotoFindMany).not.toHaveBeenCalled();
  });

  it("lists the viewer's photos when asked", async () => {
    mockPhotoFindMany.mockResolvedValue([{ id: "p1", photoUrl: "https://cdn/p1.webp", caption: "Dusk", createdAt: new Date(), spot }]);

    const json = await (await GET(req("?type=photos"), {})).json();

    expect(json.data.items[0]).toMatchObject({ id: "p1", caption: "Dusk", spot: { id: "s1" } });
    expect(mockLikeFindMany).not.toHaveBeenCalled();
  });

  it("pages by cursor, one more than the limit to know there is a next page", async () => {
    mockLikeFindMany.mockResolvedValue([like("l1"), like("l2"), like("l3")]);

    const json = await (await GET(req("?type=likes&limit=2&cursor=l0"), {})).json();

    expect(json.data.items).toHaveLength(2);
    expect(json.data.nextCursor).toBe("l2");
    const args = mockLikeFindMany.mock.calls[0][0];
    expect(args).toMatchObject({ take: 3, cursor: { id: "l0" }, skip: 1 });
  });

  it("refuses an unknown type", async () => {
    expect((await GET(req("?type=comments"), {})).status).toBe(400);
    expect((await GET(req(""), {})).status).toBe(400);
  });

  it("is a 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await GET(req("?type=likes"), {})).status).toBe(401);
  });

  it("is a 500 when the database fails", async () => {
    mockLikeFindMany.mockRejectedValue(new Error("db down"));
    expect((await GET(req("?type=likes"), {})).status).toBe(500);
  });
});
