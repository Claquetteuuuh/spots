import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

const mockFollowCount = vi.fn();
const mockFollowUpdateMany = vi.fn();
const mockFollowFindUnique = vi.fn();
const mockFollowUpdate = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    follow: {
      count: (...args: unknown[]) => mockFollowCount(...args),
      updateMany: (...args: unknown[]) => mockFollowUpdateMany(...args),
      findUnique: (...args: unknown[]) => mockFollowFindUnique(...args),
      update: (...args: unknown[]) => mockFollowUpdate(...args),
    },
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
import { PATCH as READ } from "../follow-requests/[id]/read/route";
import { POST as DISMISS } from "../follow-requests/[id]/dismiss/route";

const VIEWER = { userId: "user-1", email: "alice@example.com", username: "alice" };
const req = (path: string, method = "GET", body?: unknown) =>
  new NextRequest(`http://localhost${path}`, {
    method,
    headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFromRequest.mockResolvedValue(VIEWER);
  mockFollowCount.mockResolvedValue(0);
  mockFollowUpdateMany.mockResolvedValue({ count: 0 });
  mockFollowFindUnique.mockResolvedValue({ followingId: VIEWER.userId, dismissedAt: null });
  mockFollowUpdate.mockResolvedValue({ id: "f1", readAt: null, unreadKept: true });
});

describe("GET /api/follow-requests/count", () => {
  it("counts unread, undismissed requests and the week's new followers", async () => {
    mockFollowCount.mockResolvedValueOnce(3);

    const json = await (await COUNT(req("/api/follow-requests/count"), {})).json();

    expect(json.data.count).toBe(3);
    const { where } = mockFollowCount.mock.calls[0][0];
    expect(where).toMatchObject({ followingId: VIEWER.userId, dismissedAt: null, readAt: null });
    expect(where.OR[0]).toEqual({ status: "PENDING" });
    expect(where.OR[1].status).toBe("ACCEPTED");
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    expect(Math.abs(where.OR[1].createdAt.gte.getTime() - weekAgo)).toBeLessThan(5_000);
  });

  it("returns 401 without a user", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    expect((await COUNT(req("/api/follow-requests/count"), {})).status).toBe(401);
  });
});

describe("POST /api/follow-requests/seen", () => {
  it("reads what was never read, leaving what was kept unread alone", async () => {
    mockFollowUpdateMany.mockResolvedValueOnce({ count: 2 });

    const res = await SEEN(req("/api/follow-requests/seen", "POST"), {});
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.count).toBe(2);
    const { where, data } = mockFollowUpdateMany.mock.calls[0][0];
    expect(where).toMatchObject({
      followingId: VIEWER.userId,
      dismissedAt: null,
      readAt: null,
      unreadKept: false,
    });
    expect(data.readAt).toBeInstanceOf(Date);
  });
});

describe("PATCH /api/follow-requests/[id]/read", () => {
  it("marks unread by hand, so the page won't read it back", async () => {
    const res = await READ(req("/api/follow-requests/f1/read", "PATCH", { read: false }), ctx("f1"));

    expect(res.status).toBe(200);
    expect(mockFollowUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "f1" }, data: { readAt: null, unreadKept: true } }),
    );
  });

  it("marks read and drops the kept-unread flag", async () => {
    await READ(req("/api/follow-requests/f1/read", "PATCH", { read: true }), ctx("f1"));

    const { data } = mockFollowUpdate.mock.calls[0][0];
    expect(data.readAt).toBeInstanceOf(Date);
    expect(data.unreadKept).toBe(false);
  });

  it("refuses someone else's notification and a dismissed one", async () => {
    mockFollowFindUnique.mockResolvedValueOnce({ followingId: "user-2", dismissedAt: null });
    expect((await READ(req("/api/follow-requests/f1/read", "PATCH", { read: true }), ctx("f1"))).status).toBe(404);

    mockFollowFindUnique.mockResolvedValueOnce({ followingId: VIEWER.userId, dismissedAt: new Date() });
    expect((await READ(req("/api/follow-requests/f1/read", "PATCH", { read: true }), ctx("f1"))).status).toBe(404);
    expect(mockFollowUpdate).not.toHaveBeenCalled();
  });

  it("validates the body", async () => {
    expect((await READ(req("/api/follow-requests/f1/read", "PATCH", { read: "yes" }), ctx("f1"))).status).toBe(400);
  });
});

describe("POST /api/follow-requests/[id]/dismiss", () => {
  it("hides the notification without touching the follow", async () => {
    const res = await DISMISS(req("/api/follow-requests/f1/dismiss", "POST"), ctx("f1"));

    expect(res.status).toBe(200);
    const { where, data } = mockFollowUpdate.mock.calls[0][0];
    expect(where).toEqual({ id: "f1" });
    expect(data.dismissedAt).toBeInstanceOf(Date);
    expect(data).not.toHaveProperty("status");
  });

  it("refuses someone else's notification", async () => {
    mockFollowFindUnique.mockResolvedValueOnce({ followingId: "user-2" });
    expect((await DISMISS(req("/api/follow-requests/f1/dismiss", "POST"), ctx("f1"))).status).toBe(404);
  });
});
