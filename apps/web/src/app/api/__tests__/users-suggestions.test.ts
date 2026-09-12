import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

const mockFollowFindMany = vi.fn();
const mockFollowGroupBy = vi.fn();
const mockUserFindMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    follow: {
      findMany: (...args: unknown[]) => mockFollowFindMany(...args),
      groupBy: (...args: unknown[]) => mockFollowGroupBy(...args),
    },
    user: { findMany: (...args: unknown[]) => mockUserFindMany(...args) },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

import { GET } from "../users/suggestions/route";

const ME = { userId: "me", email: "me@example.com", username: "me" };
const user = (id: string) => ({
  id,
  username: id,
  name: id.toUpperCase(),
  avatarUrl: null,
  bio: null,
  isPrivate: false,
});
const req = () =>
  new NextRequest("http://localhost/api/users/suggestions", {
    headers: { Authorization: "Bearer t" },
  });

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFromRequest.mockResolvedValue(ME);
  mockFollowFindMany.mockResolvedValue([]);
  mockFollowGroupBy.mockResolvedValue([]);
  mockUserFindMany.mockResolvedValue([]);
});

describe("GET /api/users/suggestions", () => {
  it("ranks the people my follows follow by how many lead there, with names, skipping who I know", async () => {
    mockFollowFindMany
      // accepted follows: a, b
      .mockResolvedValueOnce([{ followingId: "a" }, { followingId: "b" }])
      // any status: a, b, plus a pending request to p
      .mockResolvedValueOnce([{ followingId: "a" }, { followingId: "b" }, { followingId: "p" }])
      // second hop
      .mockResolvedValueOnce([
        { followerId: "a", followingId: "x" },
        { followerId: "a", followingId: "y" },
        { followerId: "b", followingId: "x" },
        { followerId: "a", followingId: "p" },
        { followerId: "b", followingId: "me" },
      ]);
    mockFollowGroupBy.mockResolvedValueOnce([{ followingId: "z", _count: { followingId: 9 } }]);
    mockUserFindMany
      .mockResolvedValueOnce([user("x"), user("y"), user("z")])
      .mockResolvedValueOnce([
        { id: "a", username: "alice" },
        { id: "b", username: "bob" },
      ]);

    const res = await GET(req(), {});
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.map((u: { id: string }) => u.id)).toEqual(["x", "y", "z"]);
    expect(json.data[0]).toMatchObject({
      mutualCount: 2,
      mutualUsernames: ["alice", "bob"],
      isFollowing: false,
      followStatus: null,
    });
    expect(json.data[1]).toMatchObject({ mutualCount: 1, mutualUsernames: ["alice"] });
    expect(json.data[2]).toMatchObject({ mutualCount: 0, mutualUsernames: [] });

    // Second hop reads the follows of a and b only
    expect(mockFollowFindMany.mock.calls[2][0].where).toEqual({
      followerId: { in: ["a", "b"] },
      status: "ACCEPTED",
    });
    // The top-up never proposes me, my follows, my pending request, or the ranked ones
    expect(mockFollowGroupBy.mock.calls[0][0].where.followingId.notIn).toEqual(
      expect.arrayContaining(["me", "a", "b", "p", "x", "y"]),
    );
    expect(mockFollowGroupBy.mock.calls[0][0].take).toBe(8);
  });

  it("falls back to the most followed accounts when I follow nobody yet", async () => {
    mockFollowGroupBy.mockResolvedValueOnce([
      { followingId: "z", _count: { followingId: 9 } },
      { followingId: "w", _count: { followingId: 4 } },
    ]);
    mockUserFindMany.mockResolvedValueOnce([user("z"), user("w")]);

    const json = await (await GET(req(), {})).json();

    expect(mockFollowFindMany).toHaveBeenCalledTimes(2); // no second hop
    expect(json.data.map((u: { id: string }) => u.id)).toEqual(["z", "w"]);
    expect(mockFollowGroupBy.mock.calls[0][0].take).toBe(10);
  });

  it("returns an empty list when there is nobody to suggest", async () => {
    const json = await (await GET(req(), {})).json();
    expect(json.data).toEqual([]);
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it("returns 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await GET(req(), {})).status).toBe(401);
  });
});
