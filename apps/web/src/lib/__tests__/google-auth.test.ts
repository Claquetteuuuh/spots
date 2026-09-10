import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockVerifyIdToken = vi.fn();
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = (...args: unknown[]) => mockVerifyIdToken(...args);
  },
}));

const PAYLOAD = {
  sub: "google-123",
  email: "alice@gmail.com",
  name: "Alice",
  picture: "https://example.com/a.jpg",
  email_verified: true,
};

async function loadModule() {
  // The module caches its OAuth2Client, so every test gets a fresh copy.
  vi.resetModules();
  return import("../google-auth");
}

describe("google-auth", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => PAYLOAD });
    vi.stubEnv("GOOGLE_CLIENT_ID", "web-client-id");
    vi.stubEnv("GOOGLE_IOS_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_ANDROID_CLIENT_ID", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getGoogleAudiences", () => {
    it("is just the web client when no native clients are configured", async () => {
      const { getGoogleAudiences } = await loadModule();
      expect(getGoogleAudiences()).toEqual(["web-client-id"]);
    });

    it("includes the iOS and Android clients when configured", async () => {
      vi.stubEnv("GOOGLE_IOS_CLIENT_ID", "ios-client-id");
      vi.stubEnv("GOOGLE_ANDROID_CLIENT_ID", "android-client-id");
      const { getGoogleAudiences } = await loadModule();
      expect(getGoogleAudiences()).toEqual(["web-client-id", "ios-client-id", "android-client-id"]);
    });

    it("throws when the web client ID is missing", async () => {
      vi.stubEnv("GOOGLE_CLIENT_ID", "");
      const { getGoogleAudiences } = await loadModule();
      expect(() => getGoogleAudiences()).toThrow(/GOOGLE_CLIENT_ID/);
    });
  });

  describe("verifyGoogleIdToken", () => {
    it("verifies against every configured client, so mobile tokens are accepted", async () => {
      vi.stubEnv("GOOGLE_IOS_CLIENT_ID", "ios-client-id");
      const { verifyGoogleIdToken } = await loadModule();

      await verifyGoogleIdToken("id-token");

      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: "id-token",
        audience: ["web-client-id", "ios-client-id"],
      });
    });

    it("maps the token payload to the user info shape", async () => {
      const { verifyGoogleIdToken } = await loadModule();
      await expect(verifyGoogleIdToken("id-token")).resolves.toEqual({
        sub: "google-123",
        email: "alice@gmail.com",
        name: "Alice",
        picture: "https://example.com/a.jpg",
        email_verified: true,
      });
    });

    it("falls back to the email local part when Google sends no name", async () => {
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => ({ ...PAYLOAD, name: undefined }) });
      const { verifyGoogleIdToken } = await loadModule();
      await expect(verifyGoogleIdToken("id-token")).resolves.toMatchObject({ name: "alice" });
    });

    it("rejects a payload without a subject or email", async () => {
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => ({ name: "Nobody" }) });
      const { verifyGoogleIdToken } = await loadModule();
      await expect(verifyGoogleIdToken("id-token")).rejects.toThrow(/Invalid Google ID token payload/);
    });
  });
});
