import { describe, expect, it } from "vitest";
import { en, fr, DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../i18n";

type Dict = { [key: string]: string | Dict };

/** Flatten a nested translation object into dot-separated key paths. */
function flatten(obj: Dict, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flatten(value, path);
  });
}

const enKeys = flatten(en as unknown as Dict).sort();
const frKeys = flatten(fr as unknown as Dict).sort();

describe("i18n dictionaries", () => {
  it("declares both supported locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["fr", "en"]);
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });

  it("has no French key missing from English", () => {
    expect(frKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  it("has no English key missing from French", () => {
    expect(enKeys.filter((key) => !frKeys.includes(key))).toEqual([]);
  });

  it("has no empty translation", () => {
    const empty = [
      ...flatten(en as unknown as Dict),
      ...flatten(fr as unknown as Dict),
    ].filter((path) => {
      const read = (dict: Dict) =>
        path.split(".").reduce<string | Dict | undefined>(
          (acc, seg) => (typeof acc === "object" ? acc[seg] : undefined),
          dict,
        );
      return (
        read(en as unknown as Dict) === "" || read(fr as unknown as Dict) === ""
      );
    });
    expect(empty).toEqual([]);
  });

  it("uses the same {{placeholders}} in both languages", () => {
    const placeholders = (value: string) =>
      (value.match(/\{\{(\w+)\}\}/g) ?? []).sort();

    const read = (dict: Dict, path: string) =>
      path.split(".").reduce<string | Dict | undefined>(
        (acc, seg) => (typeof acc === "object" ? acc[seg] : undefined),
        dict,
      );

    const mismatches = enKeys.filter((key) => {
      const enValue = read(en as unknown as Dict, key);
      const frValue = read(fr as unknown as Dict, key);
      if (typeof enValue !== "string" || typeof frValue !== "string") return true;
      return (
        placeholders(enValue).join(",") !== placeholders(frValue).join(",")
      );
    });

    expect(mismatches).toEqual([]);
  });
});
