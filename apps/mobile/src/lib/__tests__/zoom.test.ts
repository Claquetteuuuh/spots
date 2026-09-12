import { MAX_ZOOM, MIN_ZOOM, TAP_ZOOM, clampZoom, nextTapZoom } from "../zoom";

describe("lightbox zoom", () => {
  it("clamps the scale between 1× and the maximum", () => {
    expect(clampZoom(0.3)).toBe(MIN_ZOOM);
    expect(clampZoom(2.2)).toBe(2.2);
    expect(clampZoom(40)).toBe(MAX_ZOOM);
  });

  it("double-tap zooms in from 1×, and back out from anything else", () => {
    expect(nextTapZoom(1)).toBe(TAP_ZOOM);
    expect(nextTapZoom(1.8)).toBe(MIN_ZOOM);
    expect(nextTapZoom(TAP_ZOOM)).toBe(MIN_ZOOM);
  });
});
