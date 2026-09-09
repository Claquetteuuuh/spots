import { describe, expect, it } from "vitest";
import {
  FALLBACK_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  normalizeLocale,
  parseAcceptLanguage,
  parseLocaleCookie,
} from "../locale";

describe("normalizeLocale", () => {
  it("accepts supported locales", () => {
    expect(normalizeLocale("fr")).toBe("fr");
    expect(normalizeLocale("en")).toBe("en");
  });

  it("strips region subtags and normalizes case", () => {
    expect(normalizeLocale("fr-CA")).toBe("fr");
    expect(normalizeLocale("EN_US")).toBe("en");
  });

  it("rejects unsupported or non-string values", () => {
    expect(normalizeLocale("de")).toBeNull();
    expect(normalizeLocale("")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
    expect(normalizeLocale(42)).toBeNull();
  });
});

describe("parseAcceptLanguage", () => {
  it("returns the highest-quality supported locale", () => {
    expect(parseAcceptLanguage("fr-CA,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(parseAcceptLanguage("de-DE,de;q=0.9,en-US;q=0.8")).toBe("en");
  });

  it("respects quality ordering over document order", () => {
    expect(parseAcceptLanguage("en;q=0.3,fr;q=0.9")).toBe("fr");
  });

  it("ignores zero-quality entries", () => {
    expect(parseAcceptLanguage("fr;q=0,en;q=0.5")).toBe("en");
  });

  it("returns null for missing or unsupported headers", () => {
    expect(parseAcceptLanguage(null)).toBeNull();
    expect(parseAcceptLanguage("")).toBeNull();
    expect(parseAcceptLanguage("de,es;q=0.8")).toBeNull();
  });
});

describe("parseLocaleCookie", () => {
  it("extracts the locale cookie among others", () => {
    expect(parseLocaleCookie("theme=dark; trs_locale=fr; other=1")).toBe("fr");
  });

  it("returns null when absent or invalid", () => {
    expect(parseLocaleCookie("theme=dark")).toBeNull();
    expect(parseLocaleCookie("trs_locale=de")).toBeNull();
    expect(parseLocaleCookie(undefined)).toBeNull();
  });
});

describe("constants", () => {
  it("labels every supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
    }
  });

  it("uses a supported fallback", () => {
    expect(SUPPORTED_LOCALES).toContain(FALLBACK_LOCALE);
  });
});
