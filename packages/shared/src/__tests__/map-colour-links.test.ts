import { describe, it, expect } from "vitest";
import { FILTER_PALETTE } from "../constants";
import { en } from "../i18n/en";
import { fr } from "../i18n/fr";
import {
  COLOR_MATCH_DISTANCE,
  colorsAlike,
  filterPinsByColor,
  formatCoordinates,
  hexToLab,
  navigationLinks,
  pinColor,
  type MapPin,
} from "../map";

const pin = (id: string, colors: string[]): MapPin =>
  ({ id, latitude: 0, longitude: 0, title: null, photoUrl: "", city: null, userId: "u", isOwn: true, colors, compositions: [], accessibility: null }) as MapPin;

describe("hexToLab", () => {
  it("puts white and black at the ends of lightness, greys in the middle", () => {
    expect(hexToLab("#FFFFFF")![0]).toBeCloseTo(100, 0);
    expect(hexToLab("#000000")![0]).toBeCloseTo(0, 0);
    const [, a, b] = hexToLab("#808080")!;
    expect(Math.abs(a)).toBeLessThan(1);
    expect(Math.abs(b)).toBeLessThan(1);
    expect(hexToLab("nope")).toBeNull();
  });
});

describe("FILTER_PALETTE", () => {
  it("names every swatch in both languages and keeps the hexes well-formed", () => {
    for (const { key, hex } of FILTER_PALETTE) {
      expect(hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(en.colorFamilies[key]).toBeTruthy();
      expect(fr.colorFamilies[key]).toBeTruthy();
    }
    expect(new Set(FILTER_PALETTE.map((c) => c.hex)).size).toBe(FILTER_PALETTE.length);
  });

  it("covers the wheel: every hue has a swatch it passes for", () => {
    for (let h = 0; h < 360; h += 15) {
      const hex = hslToHex(h, 0.7, 0.5);
      expect(FILTER_PALETTE.some((c) => colorsAlike(hex, c.hex))).toBe(true);
    }
  });
});

describe("pinColor", () => {
  it("takes the first valid colour, normalised", () => {
    expect(pinColor(["#c44536", "#2E4A3E"])).toBe("#C44536");
    expect(pinColor(["nope", " #2e4a3e "])).toBe("#2E4A3E");
    expect(pinColor([])).toBeNull();
  });
});

describe("navigationLinks", () => {
  it("builds directions links for the three apps", () => {
    const links = navigationLinks(48.8566, 2.3522);
    expect(links.google).toBe("https://www.google.com/maps/dir/?api=1&destination=48.8566,2.3522");
    expect(links.apple).toBe("https://maps.apple.com/?daddr=48.8566,2.3522");
    expect(links.waze).toBe("https://waze.com/ul?ll=48.8566,2.3522&navigate=yes");
  });
});

describe("formatCoordinates", () => {
  it("rounds to five decimals by default", () => {
    expect(formatCoordinates(48.856614, 2.3522219)).toBe("48.85661, 2.35222");
    expect(formatCoordinates(48.856614, 2.3522219, 2)).toBe("48.86, 2.35");
  });
});

describe("filterPinsByColor", () => {
  it("keeps the pins a chosen colour passes for, from the palette or the wheel", () => {
    const pins = [pin("light-green", ["#A8D5A2"]), pin("brick", ["#C44536"]), pin("sky", ["#64B5F6"])];
    expect(filterPinsByColor(pins, ["#2E7D32"]).map((p) => p.id)).toEqual(["light-green"]);
    expect(filterPinsByColor(pins, ["#A0522D"]).map((p) => p.id)).toEqual(["brick"]);
    expect(filterPinsByColor(pins, ["#2F6FD0"]).map((p) => p.id)).toEqual(["sky"]);
    expect(filterPinsByColor(pins, ["#2F6FD0", "#D32F2F"]).map((p) => p.id)).toEqual(["brick", "sky"]);
    expect(filterPinsByColor(pins, [])).toHaveLength(3);
    expect(COLOR_MATCH_DISTANCE).toBeGreaterThan(0);
  });
});

/** HSL → "#RRGGBB", for sweeping the wheel. */
function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}
