jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

import type { AuthSessionResult } from "expo-auth-session";
import { extractGoogleIdToken } from "../google-auth";

describe("extractGoogleIdToken", () => {
  it("returns the id token on success", () => {
    const response = {
      type: "success",
      authentication: {
        accessToken: "at",
        idToken: "google-id-token-123",
        tokenType: "Bearer",
        issuedAt: Date.now(),
      },
      url: "",
      params: {},
      error: null,
      errorCode: null,
    } as AuthSessionResult;
    expect(extractGoogleIdToken(response)).toBe("google-id-token-123");
  });

  it("returns null when response is null", () => {
    expect(extractGoogleIdToken(null)).toBeNull();
  });

  it("returns null on cancel", () => {
    const response = { type: "cancel" } as AuthSessionResult;
    expect(extractGoogleIdToken(response)).toBeNull();
  });

  it("returns null on dismiss", () => {
    const response = { type: "dismiss" } as AuthSessionResult;
    expect(extractGoogleIdToken(response)).toBeNull();
  });

  it("returns null when success but no idToken", () => {
    const response = {
      type: "success",
      authentication: {
        accessToken: "at",
        tokenType: "Bearer",
        issuedAt: Date.now(),
      },
      url: "",
      params: {},
      error: null,
      errorCode: null,
    } as AuthSessionResult;
    expect(extractGoogleIdToken(response)).toBeNull();
  });
});
