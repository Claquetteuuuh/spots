import { describe, it, expect } from "vitest";
import {
  IDENTITY,
  MAX_ZOOM,
  TAP_ZOOM,
  clampScale,
  pan,
  toggleZoom,
  wheelFactor,
  zoomAround,
} from "../zoom";

describe("zoom maths", () => {
  it("clamps the scale between 1× and the maximum", () => {
    expect(clampScale(0.2)).toBe(1);
    expect(clampScale(2)).toBe(2);
    expect(clampScale(99)).toBe(MAX_ZOOM);
  });

  it("keeps the point under the cursor still while zooming", () => {
    // The photo point under (100, 50) before must map to (100, 50) after
    const before = { scale: 1, x: 0, y: 0 };
    const after = zoomAround(before, 2, 100, 50);
    const photoPoint = { x: (100 - before.x) / before.scale, y: (50 - before.y) / before.scale };
    expect(after.scale).toBe(2);
    expect(after.x + photoPoint.x * after.scale).toBeCloseTo(100);
    expect(after.y + photoPoint.y * after.scale).toBeCloseTo(50);
  });

  it("snaps back to the centre once the photo fits again", () => {
    const zoomed = zoomAround(IDENTITY, 2, 80, 80);
    expect(zoomAround(zoomed, 0.1, -30, 10)).toEqual(IDENTITY);
  });

  it("never grows past the maximum", () => {
    expect(zoomAround({ scale: 3.5, x: 10, y: 10 }, 5, 0, 0).scale).toBe(MAX_ZOOM);
  });

  it("only pans a zoomed photo", () => {
    expect(pan(IDENTITY, 20, 20)).toBe(IDENTITY);
    expect(pan({ scale: 2, x: 5, y: 5 }, 20, -10)).toEqual({ scale: 2, x: 25, y: -5 });
  });

  it("double-tap zooms in on the tap, then back out", () => {
    const zoomed = toggleZoom(IDENTITY, 40, 0);
    expect(zoomed.scale).toBe(TAP_ZOOM);
    expect(zoomed.x).toBeLessThan(0);
    expect(toggleZoom(zoomed, 0, 0)).toEqual(IDENTITY);
  });

  it("turns a wheel notch into a gentle factor, down zooming out", () => {
    expect(wheelFactor(100)).toBeLessThan(1);
    expect(wheelFactor(-100)).toBeGreaterThan(1);
    expect(wheelFactor(0)).toBe(1);
  });
});
