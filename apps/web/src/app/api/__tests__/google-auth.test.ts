import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock verifyGoogleIdToken
const mockVerifyGoogleIdToken = vi.fn();
vi.mock("@/lib/google-auth", () => ({
  verifyGoogleIdToken: (...args: unknown[]) => mockVerifyGoogleIdToken(...args),
}));

// Mock Prisma
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@trs/db", () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  signAccessToken: vi.fn().mockReturnValue("mock-access-token"),
  signRefreshToken: vi.fn().mockReturnValue("mock-refresh-token"),
}));

import { POST } from "../auth/google/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

const GOOGLE_USER = {
  sub: "google-123456",
  email: "alice@gmail.com",
  name: "Alice Photo",
  picture: "https://example.com/avatar.jpg",
  email_verified: true,
};

const DB_USER = {
  id: "user-1",
  email: "alice@gmail.com",
  username: "alicephoto",
  name: "Alice Photo",
  avatarUrl: "https://example.com/avatar.jpg",
  bio: null,
  locale: "en",
  provider: "GOOGLE",
  providerId: "google-123456",
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("POST /api/auth/google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns tokens for existing Google user", async () => {
    mockVerifyGoogleIdToken.mockResolvedValue(GOOGLE_USER);
    mockFindFirst.mockResolvedValue(DB_USER);

    const res = await POST(makeRequest({ token: "valid-google-token", provider: "GOOGLE" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.user.email).toBe("alice@gmail.com");
    expect(json.data.accessToken).toBe("mock-access-token");
    expect(json.data.refreshToken).toBe("mock-refresh-token");
    // Should not have passwordHash or providerId
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.user.providerId).toBeUndefined();
  });

  it("creates a new user for first-time Google sign-in", async () => {
    mockVerifyGoogleIdToken.mockResolvedValue(GOOGLE_USER);
    mockFindFirst.mockResolvedValue(null); // No existing Google user
    mockFindUnique.mockResolvedValue(null); // No existing email user
    mockCreate.mockResolvedValue(DB_USER);

    const res = await POST(makeRequest({ token: "valid-google-token", provider: "GOOGLE" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(json.data.user.email).toBe("alice@gmail.com");
  });

  it("links Google account to existing email user", async () => {
    const emailUser = { ...DB_USER, provider: "EMAIL", providerId: null, passwordHash: "hashed" };
    mockVerifyGoogleIdToken.mockResolvedValue(GOOGLE_USER);
    mockFindFirst.mockResolvedValue(null); // No existing Google user
    mockFindUnique.mockResolvedValue(emailUser); // Existing email user
    mockUpdate.mockResolvedValue({ ...emailUser, provider: "GOOGLE", providerId: "google-123456" });

    const res = await POST(makeRequest({ token: "valid-google-token", provider: "GOOGLE" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(json.data.user.email).toBe("alice@gmail.com");
  });

  it("rejects invalid Google token", async () => {
    mockVerifyGoogleIdToken.mockRejectedValue(new Error("Invalid token"));

    const res = await POST(makeRequest({ token: "bad-token", provider: "GOOGLE" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain("Invalid or expired Google token");
  });

  it("rejects unverified Google email", async () => {
    mockVerifyGoogleIdToken.mockResolvedValue({ ...GOOGLE_USER, email_verified: false });

    const res = await POST(makeRequest({ token: "valid-token", provider: "GOOGLE" }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain("not verified");
  });

  it("rejects non-GOOGLE provider", async () => {
    const res = await POST(makeRequest({ token: "some-token", provider: "APPLE" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Google");
  });

  it("rejects missing token", async () => {
    const res = await POST(makeRequest({ provider: "GOOGLE" }));
    const json = await res.json();

    expect(res.status).toBe(400);
  });
});
