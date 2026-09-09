import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = { get: vi.fn() };
const headerStore = { get: vi.fn() };

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookieStore),
  headers: () => Promise.resolve(headerStore),
}));

const { getServerLocale } = await import("../server-locale");

describe("getServerLocale", () => {
  beforeEach(() => {
    cookieStore.get.mockReset().mockReturnValue(undefined);
    headerStore.get.mockReset().mockReturnValue(null);
  });

  it("prefers the explicit cookie choice", async () => {
    cookieStore.get.mockReturnValue({ value: "fr" });
    headerStore.get.mockReturnValue("en-US,en;q=0.9");

    await expect(getServerLocale()).resolves.toBe("fr");
  });

  it("falls back to Accept-Language when no cookie is set", async () => {
    headerStore.get.mockReturnValue("fr-CA,fr;q=0.9,en;q=0.8");

    await expect(getServerLocale()).resolves.toBe("fr");
  });

  it("ignores an unsupported cookie value", async () => {
    cookieStore.get.mockReturnValue({ value: "de" });
    headerStore.get.mockReturnValue("en-GB");

    await expect(getServerLocale()).resolves.toBe("en");
  });

  it("falls back to English with no usable signal", async () => {
    await expect(getServerLocale()).resolves.toBe("en");
  });
});
