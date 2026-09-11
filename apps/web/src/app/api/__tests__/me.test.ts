import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// Keep the real keyFromUrl (it only reads R2_PUBLIC_URL); mock the network.
const mockDeleteFile = vi.fn();
vi.mock("@/lib/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storage")>()),
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
}));

vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", email: "alice@example.com", username: "alice" }),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

vi.mock("@/lib/serializers", () => ({
  toUserProfile: (user: unknown) => user,
}));

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockFollowUpdateMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    follow: { updateMany: (...args: unknown[]) => mockFollowUpdateMany(...args) },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { PATCH } from "../auth/me/route";

const DICEBEAR = "https://api.dicebear.com/9.x/bottts/svg?seed=alice&backgroundColor=b6e3f4";
const LEGACY_R2 = "https://cdn.example.com/avatars/user-1/old.jpg";

function patch(body: unknown) {
  const req = new NextRequest("http://localhost/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer mock-token" },
    body: JSON.stringify(body),
  });
  return PATCH(req, undefined as never);
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.R2_PUBLIC_URL = "https://cdn.example.com";
});

describe("PATCH /api/auth/me — avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({ isPrivate: false, avatarUrl: LEGACY_R2 });
    mockUserUpdate.mockImplementation(async ({ data }) => ({ id: "user-1", ...data }));
    mockDeleteFile.mockResolvedValue(undefined);
  });

  it("accepts a DiceBear avatar and deletes the legacy uploaded one", async () => {
    const res = await patch({ avatarUrl: DICEBEAR });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.avatarUrl).toBe(DICEBEAR);
    expect(mockDeleteFile).toHaveBeenCalledWith("avatars/user-1/old.jpg");
  });

  it("deletes the legacy avatar when the avatar is cleared", async () => {
    const res = await patch({ avatarUrl: null });

    expect(res.status).toBe(200);
    expect(mockDeleteFile).toHaveBeenCalledWith("avatars/user-1/old.jpg");
  });

  it("does not touch storage when the previous avatar was already DiceBear", async () => {
    mockUserFindUnique.mockResolvedValue({ isPrivate: false, avatarUrl: DICEBEAR });

    const res = await patch({ avatarUrl: DICEBEAR.replace("bottts", "lorelei") });

    expect(res.status).toBe(200);
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("does not touch storage when the avatar is not part of the update", async () => {
    const res = await patch({ bio: "hello" });

    expect(res.status).toBe(200);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("rejects an avatar URL that is not DiceBear", async () => {
    const res = await patch({ avatarUrl: "https://evil.example/tracker.gif" });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("still saves the profile when deleting the legacy file fails", async () => {
    mockDeleteFile.mockRejectedValue(new Error("R2 down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await patch({ avatarUrl: DICEBEAR });

    expect(res.status).toBe(200);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
