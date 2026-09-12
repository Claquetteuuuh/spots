import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSpotFindUnique = vi.fn();
const mockFollowFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: { findUnique: (...args: unknown[]) => mockSpotFindUnique(...args) },
    follow: { findUnique: (...args: unknown[]) => mockFollowFindUnique(...args) },
  },
}));

import { canViewSpot } from "../spot-access";

describe("canViewSpot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFollowFindUnique.mockResolvedValue(null);
  });

  it("is false for a spot that does not exist", async () => {
    mockSpotFindUnique.mockResolvedValue(null);
    expect(await canViewSpot("nope", "u1")).toBe(false);
  });

  it("always lets the owner in, whatever the visibility", async () => {
    mockSpotFindUnique.mockResolvedValue({ userId: "u1", visibility: "PRIVATE" });
    expect(await canViewSpot("s1", "u1")).toBe(true);
    expect(mockFollowFindUnique).not.toHaveBeenCalled();
  });

  it("keeps a private spot from everyone else", async () => {
    mockSpotFindUnique.mockResolvedValue({ userId: "u1", visibility: "PRIVATE" });
    mockFollowFindUnique.mockResolvedValue({ status: "ACCEPTED" });
    expect(await canViewSpot("s1", "u2")).toBe(false);
  });

  it("shows a followers-only spot to an accepted follower and no one else", async () => {
    mockSpotFindUnique.mockResolvedValue({ userId: "u1", visibility: "FOLLOWERS" });
    mockFollowFindUnique.mockResolvedValueOnce({ status: "ACCEPTED" });
    expect(await canViewSpot("s1", "u2")).toBe(true);
    expect(mockFollowFindUnique.mock.calls[0][0].where).toEqual({
      followerId_followingId: { followerId: "u2", followingId: "u1" },
    });

    mockFollowFindUnique.mockResolvedValueOnce({ status: "PENDING" });
    expect(await canViewSpot("s1", "u2")).toBe(false);
    mockFollowFindUnique.mockResolvedValueOnce(null);
    expect(await canViewSpot("s1", "u2")).toBe(false);
  });
});
