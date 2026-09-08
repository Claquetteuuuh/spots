import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// Mock Prisma
const mockFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

// Mock auth — let the real signRefreshToken/verifyRefreshToken work for
// round-trip tests, but mock signAccessToken for simplicity.
const mockSignAccessToken = vi.fn().mockReturnValue("new-access-token");
const mockSignRefreshToken = vi.fn().mockReturnValue("new-refresh-token");
const mockVerifyRefreshToken = vi.fn();

vi.mock("@/lib/auth", () => ({
  signAccessToken: (...args: unknown[]) => mockSignAccessToken(...args),
  signRefreshToken: (...args: unknown[]) => mockSignRefreshToken(...args),
  verifyRefreshToken: (...args: unknown[]) => mockVerifyRefreshToken(...args),
}));

import { POST } from "../auth/refresh/route";

const DB_USER = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  name: "Alice",
  avatarUrl: null,
  bio: null,
  locale: "en",
  provider: "EMAIL",
  providerId: null,
  passwordHash: "hashed",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns new token pair for valid refresh token", async () => {
    mockVerifyRefreshToken.mockReturnValue({ userId: "user-1" });
    mockFindUnique.mockResolvedValue(DB_USER);

    const res = await POST(makeRequest({ refreshToken: "valid-refresh-token" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.accessToken).toBe("new-access-token");
    expect(json.data.refreshToken).toBe("new-refresh-token");
    expect(json.data.user.email).toBe("alice@example.com");
    // Sensitive fields stripped
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.user.providerId).toBeUndefined();
  });

  it("returns 401 for invalid refresh token", async () => {
    const error = new Error("Invalid or expired token");
    error.name = "AuthTokenError";
    mockVerifyRefreshToken.mockImplementation(() => {
      throw error;
    });

    const res = await POST(makeRequest({ refreshToken: "bad-token" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain("Invalid or expired");
  });

  it("returns 400 when refresh token is missing", async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing refresh token");
  });

  it("returns 401 when user no longer exists", async () => {
    mockVerifyRefreshToken.mockReturnValue({ userId: "deleted-user" });
    mockFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ refreshToken: "valid-but-user-gone" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain("User not found");
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new Request("http://localhost/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not json",
    }) as unknown as import("next/server").NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
