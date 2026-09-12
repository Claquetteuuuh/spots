import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFollowFindUnique = vi.fn();
const mockLikeFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    follow: { findUnique: (...args: unknown[]) => mockFollowFindUnique(...args) },
    spotLike: { findUnique: (...args: unknown[]) => mockLikeFindUnique(...args) },
  },
}));

import { findNotification, likeNotificationWhere } from "../notifications";

describe("findNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFollowFindUnique.mockResolvedValue(null);
    mockLikeFindUnique.mockResolvedValue(null);
  });

  it("finds the viewer's follow without looking at likes", async () => {
    mockFollowFindUnique.mockResolvedValue({ followingId: "me", dismissedAt: null });
    expect(await findNotification("f1", "me")).toEqual({ kind: "follow", dismissed: false });
    expect(mockLikeFindUnique).not.toHaveBeenCalled();
  });

  it("hides someone else's follow", async () => {
    mockFollowFindUnique.mockResolvedValue({ followingId: "them", dismissedAt: null });
    expect(await findNotification("f1", "me")).toBeNull();
  });

  it("falls back to a like on the viewer's spot, noting dismissal", async () => {
    mockLikeFindUnique.mockResolvedValue({ dismissedAt: new Date(), spot: { userId: "me" } });
    expect(await findNotification("l1", "me")).toEqual({ kind: "like", dismissed: true });
    expect(mockLikeFindUnique.mock.calls[0][0].where).toEqual({ id: "l1" });
  });

  it("hides a like on someone else's spot, and unknown ids", async () => {
    mockLikeFindUnique.mockResolvedValue({ dismissedAt: null, spot: { userId: "them" } });
    expect(await findNotification("l1", "me")).toBeNull();
    mockLikeFindUnique.mockResolvedValue(null);
    expect(await findNotification("zzz", "me")).toBeNull();
  });
});

describe("likeNotificationWhere", () => {
  it("targets likes on the viewer's spots by other people", () => {
    expect(likeNotificationWhere("me")).toEqual({ spot: { userId: "me" }, userId: { not: "me" } });
  });
});
