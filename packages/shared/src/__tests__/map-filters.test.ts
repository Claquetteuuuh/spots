import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  colorsAlike,
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

describe("colorsAlike", () => {
  it("takes any shade of the same hue: pale, mid or deep green are green", () => {
    expect(colorsAlike("#2E7D32", "#A8D5A2")).toBe(true);
    expect(colorsAlike("#2E7D32", "#1E5E24")).toBe(true);
    expect(colorsAlike("#2F6FD0", "#2C5F7C")).toBe(true);
  });

  it("lets close colours across hues pass: brick and sienna", () => {
    expect(colorsAlike("#C44536", "#A0522D")).toBe(true);
  });

  it("reads the warm colours photographers actually get as red", () => {
    // Terracotta, rust and a muted brown all answer to the red swatch
    expect(colorsAlike("#BC8863", "#D32F2F")).toBe(true);
    expect(colorsAlike("#B7410E", "#D32F2F")).toBe(true);
    expect(colorsAlike("#8B7355", "#D32F2F")).toBe(true);
    // A peach leans orange, not red; a sky blue is neither
    expect(colorsAlike("#D4A574", "#E67E22")).toBe(true);
    expect(colorsAlike("#D4A574", "#D32F2F")).toBe(false);
    expect(colorsAlike("#9DB9E8", "#D32F2F")).toBe(false);
  });

  it("keeps distant hues apart", () => {
    expect(colorsAlike("#2F6FD0", "#D32F2F")).toBe(false);
    expect(colorsAlike("#F1C40F", "#7E57C2")).toBe(false);
    expect(colorsAlike("#2E7D32", "#2C5F7C")).toBe(false);
  });

  it("matches greys only with greys of a similar lightness, never a colour", () => {
    expect(colorsAlike("#8A8A8A", "#6B6960")).toBe(true);
    expect(colorsAlike("#F5F5F5", "#1A1A1A")).toBe(false);
    expect(colorsAlike("#8A8A8A", "#7D8C6E")).toBe(false);
    expect(colorsAlike("#2E7D32", "#808080")).toBe(false);
  });

  it("refuses bad input", () => {
    expect(colorsAlike("nope", "#2E7D32")).toBe(false);
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

  it("filterPinsByColor keeps pins with any colour that passes for a chosen one", () => {
    const pins = [pin("red", ["#C44536"]), pin("sea", ["#2C5F7C", "#FAFAF8"]), pin("none", [])];
    expect(filterPinsByColor(pins, []).map((p) => p.id)).toEqual(["red", "sea", "none"]);
    expect(filterPinsByColor(pins, ["#2F6FD0"]).map((p) => p.id)).toEqual(["sea"]);
    expect(filterPinsByColor(pins, ["#F5F5F5", "#D32F2F"]).map((p) => p.id)).toEqual(["red", "sea"]);
    expect(filterPinsByColor(pins, ["#2E7D32"])).toEqual([]);
  });
});
