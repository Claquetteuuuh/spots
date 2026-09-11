import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  colorFamilyOf,
  countActiveFilters,
  filterPinsByColor,
  filtersToQuery,
  haversineKm,
  hexToHsl,
  intersectBounds,
  radiusToBounds,
  type MapPin,
} from "../map";

const pin = (id: string, colors: string[]): MapPin => ({
  id,
  latitude: 48.85,
  longitude: 2.35,
  title: id,
  photoUrl: `https://cdn.example.com/${id}.jpg`,
  city: "Paris",
  userId: "u1",
  isOwn: true,
  colors,
  compositions: [],
  accessibility: null,
});

describe("hexToHsl", () => {
  it("parses with or without the hash, case-insensitively", () => {
    expect(hexToHsl("#FF0000")).toEqual({ h: 0, s: 1, l: 0.5 });
    expect(hexToHsl("00ff00")?.h).toBe(120);
    expect(hexToHsl("#0000FF")?.h).toBe(240);
  });

  it("returns null for anything that is not #RRGGBB", () => {
    expect(hexToHsl("#FFF")).toBeNull();
    expect(hexToHsl("red")).toBeNull();
    expect(hexToHsl("")).toBeNull();
  });

  it("treats greys as zero saturation", () => {
    expect(hexToHsl("#808080")).toEqual({ h: 0, s: 0, l: expect.closeTo(0.5, 2) });
  });
});

describe("colorFamilyOf", () => {
  it("buckets the app's suggested palette sensibly", () => {
    expect(colorFamilyOf("#C44536")).toBe("red");
    expect(colorFamilyOf("#9B2335")).toBe("red");
    expect(colorFamilyOf("#D4A574")).toBe("orange");
    expect(colorFamilyOf("#D4A017")).toBe("yellow");
    expect(colorFamilyOf("#C8B560")).toBe("yellow");
    expect(colorFamilyOf("#7D8C6E")).toBe("green");
    expect(colorFamilyOf("#2E4A3E")).toBe("green");
    expect(colorFamilyOf("#4A6FA5")).toBe("blue");
    expect(colorFamilyOf("#4A90A4")).toBe("blue");
    expect(colorFamilyOf("#6B5B8D")).toBe("purple");
    expect(colorFamilyOf("#8E6F8E")).toBe("purple");
    expect(colorFamilyOf("#8B7355")).toBe("brown");
    expect(colorFamilyOf("#6B5740")).toBe("brown");
    expect(colorFamilyOf("#B49A7A")).toBe("brown");
  });

  it("sends pale, dark and washed-out colours to neutral", () => {
    expect(colorFamilyOf("#FAFAF8")).toBe("neutral");
    expect(colorFamilyOf("#F5E6D3")).toBe("neutral");
    expect(colorFamilyOf("#6B6960")).toBe("neutral");
    expect(colorFamilyOf("#3D3D3D")).toBe("neutral");
    expect(colorFamilyOf("#1A1A18")).toBe("neutral");
  });

  it("handles pink and invalid input", () => {
    expect(colorFamilyOf("#E0509A")).toBe("pink");
    expect(colorFamilyOf("not-a-colour")).toBe("neutral");
  });
});

describe("distance", () => {
  it("haversineKm measures Paris → Lyon at about 392 km and zero to itself", () => {
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const lyon = { latitude: 45.764, longitude: 4.8357 };
    expect(haversineKm(paris, lyon)).toBeCloseTo(392, -1);
    expect(haversineKm(paris, paris)).toBe(0);
  });

  it("radiusToBounds encloses the circle and widens with latitude", () => {
    const b = radiusToBounds({ latitude: 48.8566, longitude: 2.3522 }, 5);
    // 2 × 5 km, plus the 1 % safety margin
    expect(b.neLat - b.swLat).toBeCloseTo(10.1 / 111.32, 4);
    // 1° of longitude is shorter at 48.9°N, so the box is wider in degrees
    expect(b.neLng - b.swLng).toBeGreaterThan(b.neLat - b.swLat);
    // The corners sit outside the circle, so nothing inside it is cut off
    expect(haversineKm({ latitude: 48.8566, longitude: 2.3522 }, { latitude: b.neLat, longitude: 2.3522 })).toBeGreaterThanOrEqual(5);
  });

  it("intersectBounds overlaps or returns null", () => {
    const a = { swLat: 0, swLng: 0, neLat: 10, neLng: 10 };
    expect(intersectBounds(a, { swLat: 5, swLng: 5, neLat: 15, neLng: 15 })).toEqual({
      swLat: 5,
      swLng: 5,
      neLat: 10,
      neLng: 10,
    });
    expect(intersectBounds(a, { swLat: 11, swLng: 0, neLat: 12, neLng: 10 })).toBeNull();
  });
});

describe("filters", () => {
  it("countActiveFilters counts every selected option and the radius once", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        colors: ["red", "blue"],
        compositions: ["SYMMETRY"],
        accessibility: ["EASY"],
        radiusKm: 5,
      }),
    ).toBe(5);
  });

  it("filtersToQuery serialises server-side filters and skips the radius without a position", () => {
    const filters = {
      colors: ["red" as const],
      compositions: ["SYMMETRY" as const, "DIAGONAL" as const],
      accessibility: ["EASY" as const],
      radiusKm: 5,
    };
    expect(filtersToQuery(filters, null)).toEqual({
      compositions: "SYMMETRY,DIAGONAL",
      accessibility: "EASY",
    });
    expect(filtersToQuery(filters, { latitude: 48.85, longitude: 2.35 })).toEqual({
      compositions: "SYMMETRY,DIAGONAL",
      accessibility: "EASY",
      nearLat: 48.85,
      nearLng: 2.35,
      radiusKm: 5,
    });
    expect(filtersToQuery(EMPTY_FILTERS, { latitude: 1, longitude: 1 })).toEqual({});
  });

  it("filterPinsByColor keeps pins with any colour in the wanted families", () => {
    const pins = [pin("red", ["#C44536"]), pin("sea", ["#2C5F7C", "#FAFAF8"]), pin("none", [])];
    expect(filterPinsByColor(pins, []).map((p) => p.id)).toEqual(["red", "sea", "none"]);
    expect(filterPinsByColor(pins, ["blue"]).map((p) => p.id)).toEqual(["sea"]);
    expect(filterPinsByColor(pins, ["neutral", "red"]).map((p) => p.id)).toEqual(["red", "sea"]);
    expect(filterPinsByColor(pins, ["green"])).toEqual([]);
  });
});
