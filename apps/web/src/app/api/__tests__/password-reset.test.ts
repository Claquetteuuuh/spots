import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockFindUnique = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn();
const mockFindUniqueToken = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    passwordResetToken: {
      findUnique: (...args: unknown[]) => mockFindUniqueToken(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 10, resetAt: Date.now() + 60000 }),
  getClientIp: () => "127.0.0.1",
}));

// ─── Helpers ────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeResetRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_USER = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  name: "Alice",
  passwordHash: "$2a$12$hash",
  provider: "EMAIL",
};

// ─── Tests ──────────────────────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Dynamically import after mocks
  async function callForgot(body: Record<string, unknown>) {
    const { POST } = await import("../auth/forgot-password/route");
    return POST(makeRequest(body) as never);
  }

  it("returns success even for non-existent email", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await callForgot({ email: "nobody@example.com" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
  });

  it("creates reset token for existing EMAIL user", async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER);
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockCreate.mockResolvedValue({ id: "tok-1", token: "abc123" });

    const res = await callForgot({ email: "alice@example.com" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockDeleteMany).toHaveBeenCalledOnce();
  });

  it("does not create token for GOOGLE user", async () => {
    mockFindUnique.mockResolvedValue({ ...MOCK_USER, provider: "GOOGLE", passwordHash: null });

    const res = await callForgot({ email: "alice@example.com" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid email", async () => {
    const res = await callForgot({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function callReset(body: Record<string, unknown>) {
    const { POST } = await import("../auth/reset-password/route");
    return POST(makeResetRequest(body) as never);
  }

  it("resets password with valid token", async () => {
    const futureDate = new Date(Date.now() + 3600000);
    mockFindUniqueToken.mockResolvedValue({
      id: "tok-1",
      token: "valid-token",
      userId: "user-1",
      expiresAt: futureDate,
      user: MOCK_USER,
    });
    mockTransaction.mockResolvedValue([{}, { count: 1 }]);

    const res = await callReset({ token: "valid-token", password: "NewPassword1!" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reset).toBe(true);
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it("rejects invalid token", async () => {
    mockFindUniqueToken.mockResolvedValue(null);

    const res = await callReset({ token: "bad-token", password: "NewPassword1!" });
    expect(res.status).toBe(400);
  });

  it("rejects expired token", async () => {
    const pastDate = new Date(Date.now() - 3600000);
    mockFindUniqueToken.mockResolvedValue({
      id: "tok-1",
      token: "expired-token",
      userId: "user-1",
      expiresAt: pastDate,
      user: MOCK_USER,
    });
    mockDelete.mockResolvedValue({});

    const res = await callReset({ token: "expired-token", password: "NewPassword1!" });
    expect(res.status).toBe(400);
  });

  it("rejects password not meeting ANSSI policy", async () => {
    const res = await callReset({ token: "valid-token", password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects missing token", async () => {
    const res = await callReset({ password: "newpassword123" });
    expect(res.status).toBe(400);
  });
});
