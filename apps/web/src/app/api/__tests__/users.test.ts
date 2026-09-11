import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// Mock Prisma
const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();
const mockFollowCreate = vi.fn();
const mockFollowFindUnique = vi.fn();
// GET /api/users/search resolves the viewer's follow state for a whole page
// of results with a single `follow.findMany`.
const mockFollowFindMany = vi.fn();
const mockFollowDelete = vi.fn();
// GET /api/users/[username] counts accepted followers/following separately
// from the raw `_count` relation totals (which include pending requests).
const mockFollowCount = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    follow: {
      create: (...args: unknown[]) => mockFollowCreate(...args),
      findUnique: (...args: unknown[]) => mockFollowFindUnique(...args),
      findMany: (...args: unknown[]) => mockFollowFindMany(...args),
      delete: (...args: unknown[]) => mockFollowDelete(...args),
      count: (...args: unknown[]) => mockFollowCount(...args),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, opts: { code: string }) {
        super(message);
        this.code = opts.code;
      }
    },
  },
}));

// Mock auth
const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  signAccessToken: vi.fn().mockReturnValue("mock-access-token"),
  signRefreshToken: vi.fn().mockReturnValue("mock-refresh-token"),
  verifyAccessToken: vi.fn().mockReturnValue({
    userId: "viewer-1",
    email: "viewer@example.com",
    username: "viewer",
  }),
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

import { GET as GetProfile } from "../users/[username]/route";
import { POST as FollowUser, DELETE as UnfollowUser } from "../users/[username]/follow/route";
import { GET as SearchUsers } from "../users/search/route";

/**
 * Clear call history and restore neutral defaults so a query a test did not
 * explicitly mock resolves to "nothing found" instead of `undefined` (or a
 * value leaked from a previous test — `vi.clearAllMocks()` alone keeps
 * implementations set via `mockResolvedValue`).
 */
function resetPrismaMocks() {
  vi.clearAllMocks();
  mockUserFindUnique.mockResolvedValue(null);
  mockUserFindMany.mockResolvedValue([]);
  mockFollowFindUnique.mockResolvedValue(null);
  mockFollowFindMany.mockResolvedValue([]);
  mockFollowCount.mockResolvedValue(0);
}

const DB_USER = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  name: "Alice Photo",
  avatarUrl: null,
  bio: "I take photos",
  locale: "en",
  provider: "EMAIL",
  providerId: null,
  passwordHash: "hashed",
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { spots: 5, followers: 10, following: 3 },
};

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

describe("GET /api/users/[username]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    // The handler replaces the raw `_count` follower/following totals with
    // ACCEPTED-only counts: one `follow.count` keyed on `followingId`
    // (followers of the user), one keyed on `followerId` (users they follow).
    mockFollowCount.mockImplementation(
      async ({ where }: { where: { followingId?: string; followerId?: string } }) => {
        if (where.followingId === DB_USER.id) return 10;
        if (where.followerId === DB_USER.id) return 3;
        return 0;
      },
    );
  });

  it("returns user profile with counts", async () => {
    mockUserFindUnique.mockResolvedValue(DB_USER);
    mockGetUserFromRequest.mockResolvedValue(null); // unauthenticated viewer

    const req = new NextRequest("http://localhost/api/users/alice");
    const res = await GetProfile(req, { params: Promise.resolve({ username: "alice" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.username).toBe("alice");
    expect(json.data.spotCount).toBe(5);
    expect(json.data.followerCount).toBe(10);
    expect(json.data.followingCount).toBe(3);
    expect(json.data.isFollowing).toBe(false);
    expect(json.data.followStatus).toBeNull();
    expect(mockFollowCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { followingId: DB_USER.id, status: "ACCEPTED" } }),
    );
    expect(mockFollowCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { followerId: DB_USER.id, status: "ACCEPTED" } }),
    );
    // Sensitive fields stripped
    expect(json.data.passwordHash).toBeUndefined();
    expect(json.data.providerId).toBeUndefined();
  });

  it("includes isFollowing for authenticated viewer", async () => {
    mockUserFindUnique.mockResolvedValue(DB_USER);
    mockGetUserFromRequest.mockResolvedValue({
      userId: "viewer-1",
      email: "viewer@example.com",
      username: "viewer",
    });
    // The handler selects `{ status }` and only counts ACCEPTED as following.
    mockFollowFindUnique.mockResolvedValue({ status: "ACCEPTED" });

    const req = new NextRequest("http://localhost/api/users/alice", {
      headers: { Authorization: "Bearer mock-token" },
    });
    const res = await GetProfile(req, { params: Promise.resolve({ username: "alice" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isFollowing).toBe(true);
    expect(json.data.followStatus).toBe("ACCEPTED");
  });

  it("reports a pending follow request as not following", async () => {
    mockUserFindUnique.mockResolvedValue(DB_USER);
    mockGetUserFromRequest.mockResolvedValue({
      userId: "viewer-1",
      email: "viewer@example.com",
      username: "viewer",
    });
    mockFollowFindUnique.mockResolvedValue({ status: "PENDING" });

    const req = new NextRequest("http://localhost/api/users/alice", {
      headers: { Authorization: "Bearer mock-token" },
    });
    const res = await GetProfile(req, { params: Promise.resolve({ username: "alice" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isFollowing).toBe(false);
    expect(json.data.followStatus).toBe("PENDING");
  });

  it("returns 404 for non-existent user", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockGetUserFromRequest.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/users/nobody");
    const res = await GetProfile(req, { params: Promise.resolve({ username: "nobody" }) });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/users/search", () => {
  beforeEach(() => {
    resetPrismaMocks();
    // Search is open to anyone; tests opt into a viewer explicitly.
    mockGetUserFromRequest.mockResolvedValue(null);
  });

  it("returns matching users", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "u1", username: "alice", name: "Alice", avatarUrl: null, bio: null, isPrivate: false },
    ]);

    const req = new NextRequest("http://localhost/api/users/search?q=ali");
    const res = await SearchUsers(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].username).toBe("alice");
    // An anonymous viewer follows nobody, and no follow lookup is needed.
    expect(json.data[0].isFollowing).toBe(false);
    expect(json.data[0].followStatus).toBeNull();
    expect(mockFollowFindMany).not.toHaveBeenCalled();
  });

  it("includes the viewer's follow state for each result", async () => {
    mockGetUserFromRequest.mockResolvedValue({
      userId: "viewer-1",
      email: "viewer@example.com",
      username: "viewer",
    });
    mockUserFindMany.mockResolvedValue([
      { id: "u1", username: "alice", name: "Alice", avatarUrl: null, bio: null, isPrivate: false },
      { id: "u2", username: "bob", name: "Bob", avatarUrl: null, bio: null, isPrivate: true },
      { id: "u3", username: "carol", name: "Carol", avatarUrl: null, bio: null, isPrivate: false },
    ]);
    mockFollowFindMany.mockResolvedValue([
      { followingId: "u1", status: "ACCEPTED" },
      { followingId: "u2", status: "PENDING" },
    ]);

    const req = new NextRequest("http://localhost/api/users/search?q=a", {
      headers: { Authorization: "Bearer mock-token" },
    });
    const res = await SearchUsers(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    // One query for the whole page, scoped to the viewer and the result ids.
    expect(mockFollowFindMany).toHaveBeenCalledOnce();
    expect(mockFollowFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { followerId: "viewer-1", followingId: { in: ["u1", "u2", "u3"] } },
      }),
    );
    expect(json.data[0]).toMatchObject({ username: "alice", isFollowing: true, followStatus: "ACCEPTED" });
    // A pending request to a private account is not yet "following".
    expect(json.data[1]).toMatchObject({ username: "bob", isFollowing: false, followStatus: "PENDING", isPrivate: true });
    expect(json.data[2]).toMatchObject({ username: "carol", isFollowing: false, followStatus: null });
  });

  it("returns empty array when no match", async () => {
    mockUserFindMany.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/users/search?q=zzz");
    const res = await SearchUsers(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(0);
  });

  it("returns 400 when q is missing", async () => {
    const req = new NextRequest("http://localhost/api/users/search");
    const res = await SearchUsers(req);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/users/[username]/follow", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetUserFromRequest.mockResolvedValue({
      userId: "viewer-1",
      email: "viewer@example.com",
      username: "viewer",
    });
  });

  it("follows a user", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-1" });
    mockFollowCreate.mockResolvedValue({
      id: "follow-1",
      followerId: "viewer-1",
      followingId: "user-1",
    });

    const req = new NextRequest("http://localhost/api/users/alice/follow", {
      method: "POST",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await FollowUser(req, { params: Promise.resolve({ username: "alice" }) });

    expect(res.status).toBe(201);
    expect(mockFollowCreate).toHaveBeenCalledOnce();
  });

  it("rejects self-follow", async () => {
    mockGetUserFromRequest.mockResolvedValue({
      userId: "user-1",
      email: "alice@example.com",
      username: "alice",
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1" });

    const req = new NextRequest("http://localhost/api/users/alice/follow", {
      method: "POST",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await FollowUser(req, { params: Promise.resolve({ username: "alice" }) });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("yourself");
  });

  it("returns 404 for non-existent user", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/users/nobody/follow", {
      method: "POST",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await FollowUser(req, { params: Promise.resolve({ username: "nobody" }) });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/users/[username]/follow", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetUserFromRequest.mockResolvedValue({
      userId: "viewer-1",
      email: "viewer@example.com",
      username: "viewer",
    });
  });

  it("unfollows a user", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-1" });
    mockFollowFindUnique.mockResolvedValue({ id: "follow-1" });
    mockFollowDelete.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/users/alice/follow", {
      method: "DELETE",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await UnfollowUser(req, { params: Promise.resolve({ username: "alice" }) });

    expect(res.status).toBe(200);
    expect(mockFollowDelete).toHaveBeenCalledOnce();
  });

  it("returns 404 when not following", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-1" });
    mockFollowFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/users/alice/follow", {
      method: "DELETE",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await UnfollowUser(req, { params: Promise.resolve({ username: "alice" }) });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("not following");
  });
});
