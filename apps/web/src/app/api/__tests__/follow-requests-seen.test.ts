import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockFollowCount = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    follow: { count: (...args: unknown[]) => mockFollowCount(...args) },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

import { GET as COUNT } from "../follow-requests/count/route";
import { POST as SEEN } from "../follow-requests/seen/route";

const VIEWER = { userId: "user-1", email: "alice@example.com", username: "alice" };
const req = (path: string, method = "GET") =>
  new NextRequest(`http://localhost${path}`, { method, headers: { Authorization: "Bearer t" } });

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFromRequest.mockResolvedValue(VIEWER);
  mockUserFindUnique.mockResolvedValue({ notificationsSeenAt: null });
  mockUserUpdate.mockResolvedValue({});
  mockFollowCount.mockResolvedValue(0);
});

describe("GET /api/follow-requests/count", () => {
  it("counts every pending request and the week's new followers when nothing was seen yet", async () => {
    mockFollowCount.mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    const json = await (await COUNT(req("/api/follow-requests/count"), {})).json();

    expect(json.data.count).toBe(5);
    const [pendingArgs, newArgs] = mockFollowCount.mock.calls.map((c) => c[0]);
    expect(pendingArgs.where).toEqual({ followingId: VIEWER.userId, status: "PENDING" });
    expect(newArgs.where.status).toBe("ACCEPTED");
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    expect(Math.abs(newArgs.where.createdAt.gt.getTime() - weekAgo)).toBeLessThan(5_000);
  });

  it("only counts what arrived after the notifications were last seen", async () => {
    const seenAt = new Date(Date.now() - 60_000);
    mockUserFindUnique.mockResolvedValue({ notificationsSeenAt: seenAt });

    await COUNT(req("/api/follow-requests/count"), {});

    const [pendingArgs, newArgs] = mockFollowCount.mock.calls.map((c) => c[0]);
    expect(pendingArgs.where.createdAt).toEqual({ gt: seenAt });
    expect(newArgs.where.createdAt).toEqual({ gt: seenAt });
  });

  it("keeps the seven-day window when the notifications were seen longer ago", async () => {
    const seenAt = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    mockUserFindUnique.mockResolvedValue({ notificationsSeenAt: seenAt });

    await COUNT(req("/api/follow-requests/count"), {});

    const [, newArgs] = mockFollowCount.mock.calls.map((c) => c[0]);
    expect(newArgs.where.createdAt.gt.getTime()).toBeGreaterThan(seenAt.getTime());
  });

  it("returns 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await COUNT(req("/api/follow-requests/count"), {})).status).toBe(401);
  });
});

describe("POST /api/follow-requests/seen", () => {
  it("stamps the viewer and returns the moment", async () => {
    const res = await SEEN(req("/api/follow-requests/seen", "POST"), {});
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VIEWER.userId },
      data: { notificationsSeenAt: expect.any(Date) },
    });
    expect(new Date(json.data.seenAt).getTime()).toBeGreaterThan(Date.now() - 5_000);
  });

  it("returns 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await SEEN(req("/api/follow-requests/seen", "POST"), {})).status).toBe(401);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});
