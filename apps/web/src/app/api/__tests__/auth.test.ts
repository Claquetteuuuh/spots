import { beforeAll, describe, expect, it } from "vitest";
import {
  AuthTokenError,
  extractBearerToken,
  getAccessTokenSecret,
  getUserFromRequest,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
  type AccessTokenPayload,
} from "@/lib/auth";

beforeAll(() => {
  process.env.JWT_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

const samplePayload: AccessTokenPayload = {
  userId: "user_123",
  email: "alice@example.com",
  username: "alice",
};

describe("signAccessToken / verifyAccessToken", () => {
  it("round-trips the payload", () => {
    const token = signAccessToken(samplePayload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(samplePayload.userId);
    expect(decoded.email).toBe(samplePayload.email);
    expect(decoded.username).toBe(samplePayload.username);
  });

  it("is also verifiable through the generic verifyToken helper", () => {
    const token = signAccessToken(samplePayload);
    const decoded = verifyToken<AccessTokenPayload>(token, getAccessTokenSecret());

    expect(decoded).toMatchObject(samplePayload);
  });

  it("throws AuthTokenError when verified with the wrong secret", () => {
    const token = signAccessToken(samplePayload);

    expect(() => verifyToken(token, "some-other-secret")).toThrow(AuthTokenError);
  });

  it("throws AuthTokenError for a malformed token", () => {
    expect(() => verifyAccessToken("not-a-real-jwt")).toThrow(AuthTokenError);
  });
});

describe("signRefreshToken / verifyRefreshToken", () => {
  it("round-trips the payload", () => {
    const token = signRefreshToken({ userId: samplePayload.userId });
    const decoded = verifyRefreshToken(token);

    expect(decoded.userId).toBe(samplePayload.userId);
  });

  it("rejects a token signed with the access-token secret", () => {
    const accessToken = signAccessToken(samplePayload);

    expect(() => verifyRefreshToken(accessToken)).toThrow(AuthTokenError);
  });
});

describe("extractBearerToken", () => {
  it("extracts the token from a well-formed Authorization header", () => {
    const request = new Request("https://example.com/api", {
      headers: { Authorization: "Bearer abc.def.ghi" },
    });

    expect(extractBearerToken(request)).toBe("abc.def.ghi");
  });

  it("returns null when the header is missing", () => {
    const request = new Request("https://example.com/api");

    expect(extractBearerToken(request)).toBeNull();
  });

  it("returns null when the scheme is not Bearer", () => {
    const request = new Request("https://example.com/api", {
      headers: { Authorization: "Basic abc.def.ghi" },
    });

    expect(extractBearerToken(request)).toBeNull();
  });
});

describe("getUserFromRequest", () => {
  it("returns the decoded user for a request with a valid access token", async () => {
    const token = signAccessToken(samplePayload);
    const request = new Request("https://example.com/api", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = await getUserFromRequest(request);

    expect(user).toMatchObject(samplePayload);
  });

  it("returns null when there is no Authorization header", async () => {
    const request = new Request("https://example.com/api");

    expect(await getUserFromRequest(request)).toBeNull();
  });

  it("returns null for an invalid token instead of throwing", async () => {
    const request = new Request("https://example.com/api", {
      headers: { Authorization: "Bearer not-a-real-token" },
    });

    await expect(getUserFromRequest(request)).resolves.toBeNull();
  });
});
