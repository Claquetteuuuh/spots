import { describe, it, expect } from "vitest";
import { UPLOAD_PRESETS, shrinkPasses } from "../constants";

describe("upload presets", () => {
  it("sends a community photo the way a messaging app would", () => {
    // Small enough to post several over mobile data without waiting
    expect(UPLOAD_PRESETS.community.maxEdge).toBe(1600);
    expect(UPLOAD_PRESETS.community.quality).toBeLessThan(0.8);
  });

  it("keeps a spot's own photos a notch above — they are the product", () => {
    expect(UPLOAD_PRESETS.spot.maxEdge).toBeGreaterThan(UPLOAD_PRESETS.community.maxEdge);
    expect(UPLOAD_PRESETS.spot.quality).toBeGreaterThan(UPLOAD_PRESETS.community.quality);
  });

  it("draws smaller with every pass, never larger", () => {
    const passes = shrinkPasses(UPLOAD_PRESETS.community);

    expect(passes[0]).toEqual(UPLOAD_PRESETS.community);
    for (let i = 1; i < passes.length; i++) {
      expect(passes[i].maxEdge).toBeLessThan(passes[i - 1].maxEdge);
      expect(passes[i].quality).toBeLessThan(passes[i - 1].quality);
    }
    // …and never so far that the photo is unusable
    expect(passes.at(-1)!.quality).toBeGreaterThan(0.5);
  });
});
