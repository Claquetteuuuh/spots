import { describe, it, expect } from "vitest";
import {
  COLOR_MATCH_DISTANCE,
  colorFamiliesOf,
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

describe("colorFamiliesOf", () => {
  it("keeps the colour's own family first", () => {
    expect(colorFamiliesOf("#4F8A5B")[0]).toBe("green");
    expect(colorFamiliesOf("#4A6FA5")[0]).toBe("blue");
  });

  it("counts lighter and darker greens as green", () => {
    expect(colorFamiliesOf("#A8D5A2")).toContain("green");
    expect(colorFamiliesOf("#2E4A3E")).toContain("green");
    expect(colorFamiliesOf("#3B6B45")).toContain("green");
  });

  it("lets a brick red pass for brown too, and sienna for red", () => {
    expect(colorFamiliesOf("#C44536")).toEqual(expect.arrayContaining(["red", "brown"]));
    expect(colorFamiliesOf("#A0522D")).toEqual(expect.arrayContaining(["brown", "red"]));
  });

  it("does not confuse distant hues", () => {
    expect(colorFamiliesOf("#4A6FA5")).not.toContain("red");
    expect(colorFamiliesOf("#D4A017")).not.toContain("blue");
    expect(colorFamiliesOf("#808080")).toEqual(["neutral"]);
  });

  it("falls back to neutral alone for bad input", () => {
    expect(colorFamiliesOf("not-a-colour")).toEqual(["neutral"]);
    expect(COLOR_MATCH_DISTANCE).toBeGreaterThan(0);
  });
});

describe("filterPinsByColor with tolerance", () => {
  it("finds the near-miss shades a strict bucket would drop", () => {
    const pins = [pin("light-green", ["#A8D5A2"]), pin("brick", ["#C44536"]), pin("sky", ["#64B5F6"])];
    expect(filterPinsByColor(pins, ["green"]).map((p) => p.id)).toEqual(["light-green"]);
    expect(filterPinsByColor(pins, ["brown"]).map((p) => p.id)).toEqual(["brick"]);
    expect(filterPinsByColor(pins, ["blue"]).map((p) => p.id)).toEqual(["sky"]);
    expect(filterPinsByColor(pins, [])).toHaveLength(3);
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
