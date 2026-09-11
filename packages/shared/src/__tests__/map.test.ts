import { describe, expect, it } from "vitest";
import {
  SpotClusterer,
  boundsContain,
  clusterMarkerSize,
  formatClusterCount,
  longitudeDeltaFromZoom,
  padBounds,
  regionToBounds,
  zoomFromLongitudeDelta,
  type MapPin,
} from "../map";
import { mapPinsQuerySchema } from "../validation";

const pin = (id: string, latitude: number, longitude: number): MapPin => ({
  id,
  latitude,
  longitude,
  title: id,
  photoUrl: `https://cdn.example.com/${id}.jpg`,
  city: "Paris",
  userId: "u1",
  isOwn: true,
});

const PARIS = { swLat: 48.8, swLng: 2.2, neLat: 48.9, neLng: 2.45 };
const WORLD = { swLat: -85, swLng: -180, neLat: 85, neLng: 180 };

describe("viewport helpers", () => {
  it("padBounds grows every side by the factor and clamps to the globe", () => {
    const padded = padBounds({ swLat: 0, swLng: 0, neLat: 10, neLng: 20 }, 0.5);
    expect(padded).toEqual({ swLat: -5, swLng: -10, neLat: 15, neLng: 30 });

    const edge = padBounds({ swLat: 80, swLng: 170, neLat: 89, neLng: 179 }, 1);
    expect(edge.neLat).toBe(90);
    expect(edge.neLng).toBe(180);
  });

  it("boundsContain is inclusive and rejects any overflow", () => {
    const outer = { swLat: 0, swLng: 0, neLat: 10, neLng: 10 };
    expect(boundsContain(outer, { swLat: 1, swLng: 1, neLat: 9, neLng: 9 })).toBe(true);
    expect(boundsContain(outer, outer)).toBe(true);
    expect(boundsContain(outer, { swLat: 1, swLng: 1, neLat: 11, neLng: 9 })).toBe(false);
    expect(boundsContain(outer, { swLat: -1, swLng: 1, neLat: 9, neLng: 9 })).toBe(false);
  });

  it("regionToBounds centres the deltas on the region", () => {
    const b = regionToBounds({
      latitude: 48.85,
      longitude: 2.35,
      latitudeDelta: 0.1,
      longitudeDelta: 0.2,
    });
    expect(b.swLat).toBeCloseTo(48.8);
    expect(b.swLng).toBeCloseTo(2.25);
    expect(b.neLat).toBeCloseTo(48.9);
    expect(b.neLng).toBeCloseTo(2.45);
  });

  it("zoom ↔ longitude delta round-trips", () => {
    expect(zoomFromLongitudeDelta(360)).toBe(0);
    expect(zoomFromLongitudeDelta(180)).toBe(1);
    expect(longitudeDeltaFromZoom(zoomFromLongitudeDelta(0.05))).toBeCloseTo(0.05);
    // A degenerate span means "zoomed all the way in"
    expect(zoomFromLongitudeDelta(0)).toBeGreaterThan(16);
  });
});

describe("cluster presentation", () => {
  it("clusterMarkerSize grows with log2(count) between the caps", () => {
    const two = clusterMarkerSize(2);
    const ten = clusterMarkerSize(10);
    const thousand = clusterMarkerSize(1000);
    expect(two).toBeGreaterThanOrEqual(32);
    expect(ten).toBeGreaterThan(two);
    expect(thousand).toBeGreaterThan(ten);
    expect(thousand).toBeLessThanOrEqual(64);
    expect(clusterMarkerSize(1_000_000)).toBe(64);
  });

  it("formatClusterCount abbreviates thousands", () => {
    expect(formatClusterCount(7)).toBe("7");
    expect(formatClusterCount(999)).toBe("999");
    expect(formatClusterCount(1000)).toBe("1k");
    expect(formatClusterCount(1250)).toBe("1.3k");
    expect(formatClusterCount(12_400)).toBe("12k");
  });
});

describe("SpotClusterer", () => {
  // Three pins a few hundred metres apart, one far away in Lyon.
  const pins = [
    pin("a", 48.8566, 2.3522),
    pin("b", 48.857, 2.353),
    pin("c", 48.8575, 2.3515),
    pin("lyon", 45.764, 4.8357),
  ];

  it("merges nearby pins into one counted cluster when zoomed out", () => {
    const items = new SpotClusterer(pins).getItems(WORLD, 3);
    const clusters = items.filter((i) => i.kind === "cluster");
    const lone = items.filter((i) => i.kind === "pin");
    // At zoom 3 Paris and Lyon are ~60px apart: everything may merge or
    // split into two groups, but the total count is always 4.
    const total =
      clusters.reduce((n, c) => n + (c.kind === "cluster" ? c.count : 0), 0) + lone.length;
    expect(total).toBe(4);
    expect(clusters.length).toBeGreaterThanOrEqual(1);
  });

  it("shows every pin individually when zoomed in past the max cluster zoom", () => {
    const items = new SpotClusterer(pins).getItems(PARIS, 18);
    expect(items.every((i) => i.kind === "pin")).toBe(true);
    expect(items.map((i) => (i.kind === "pin" ? i.pin.id : "")).sort()).toEqual(["a", "b", "c"]);
  });

  it("only returns items inside the requested bounds", () => {
    const items = new SpotClusterer(pins).getItems(PARIS, 12);
    const ids = items.flatMap((i) => (i.kind === "pin" ? [i.pin.id] : []));
    expect(ids).not.toContain("lyon");
  });

  it("reports an expansion zoom above the current one for a cluster", () => {
    const clusterer = new SpotClusterer(pins);
    const cluster = clusterer.getItems(PARIS, 10).find((i) => i.kind === "cluster");
    expect(cluster).toBeDefined();
    if (cluster?.kind === "cluster") {
      expect(clusterer.getExpansionZoom(cluster.id)).toBeGreaterThan(10);
    }
  });

  it("accepts fractional zooms", () => {
    expect(() => new SpotClusterer(pins).getItems(WORLD, 4.7)).not.toThrow();
  });
});

describe("mapPinsQuerySchema", () => {
  it("coerces strings and applies defaults", () => {
    const q = mapPinsQuerySchema.parse({ swLat: "48.8", swLng: "2.2", neLat: "48.9", neLng: "2.4" });
    expect(q).toEqual({ swLat: 48.8, swLng: 2.2, neLat: 48.9, neLng: 2.4, scope: "all", limit: 500 });
  });

  it("requires every bound", () => {
    expect(() => mapPinsQuerySchema.parse({ swLat: 1, swLng: 1, neLat: 2 })).toThrow();
  });

  it("rejects an inverted latitude box, a bad scope and an oversize limit", () => {
    const base = { swLat: 48.9, swLng: 2.2, neLat: 48.8, neLng: 2.4 };
    expect(() => mapPinsQuerySchema.parse(base)).toThrow();
    expect(() => mapPinsQuerySchema.parse({ ...PARIS, scope: "everyone" })).toThrow();
    expect(() => mapPinsQuerySchema.parse({ ...PARIS, limit: 5000 })).toThrow();
  });
});
