import { describe, expect, it } from "vitest";
import {
  MapCache,
  boundsContain,
  mapCacheKey,
  quantizeBounds,
  type MapCacheEntry,
  type MapPin,
} from "../map";

const VIEW = { swLat: 48.8, swLng: 2.2, neLat: 48.9, neLng: 2.45 };

const entry = (id: string, fetchedAt = 1): MapCacheEntry => ({
  items: [
    {
      id,
      latitude: 48.85,
      longitude: 2.35,
      title: id,
      photoUrl: "https://cdn.example.com/p.jpg",
      city: null,
      userId: "u1",
      isOwn: true,
      colors: [],
      compositions: [],
      accessibility: null,
    } satisfies MapPin,
  ],
  truncated: false,
  etag: `"${id}"`,
  fetchedAt,
});

describe("quantizeBounds", () => {
  it("snaps outward to a grid, so the box still contains the view", () => {
    const q = quantizeBounds(VIEW);
    expect(boundsContain(q, VIEW)).toBe(true);
    // Grid step is a power of two no larger than a quarter of the span
    const step = q.neLat - VIEW.neLat + (VIEW.swLat - q.swLat);
    expect(step).toBeLessThan((VIEW.neLng - VIEW.swLng) / 2);
  });

  it("gives nearby views the same box", () => {
    const nudged = { ...VIEW, swLat: VIEW.swLat + 0.004, neLat: VIEW.neLat + 0.004 };
    expect(quantizeBounds(nudged)).toEqual(quantizeBounds(VIEW));
  });

  it("stays on the globe", () => {
    const q = quantizeBounds({ swLat: 80, swLng: 170, neLat: 89.9, neLng: 179.9 });
    expect(q.neLat).toBeLessThanOrEqual(90);
    expect(q.neLng).toBeLessThanOrEqual(180);
  });
});

describe("mapCacheKey", () => {
  it("depends on box, scope and filters, with filters in a stable order", () => {
    const a = mapCacheKey(VIEW, "all", { compositions: "SYMMETRY", radiusKm: 5 });
    const b = mapCacheKey(VIEW, "all", { radiusKm: 5, compositions: "SYMMETRY" });
    expect(a).toBe(b);
    expect(mapCacheKey(VIEW, "mine", {})).not.toBe(mapCacheKey(VIEW, "all", {}));
    expect(mapCacheKey({ ...VIEW, neLat: 48.95 }, "all", {})).not.toBe(mapCacheKey(VIEW, "all", {}));
  });
});

describe("MapCache", () => {
  it("evicts the least recently used entry past its size", () => {
    const cache = new MapCache(2);
    cache.set("a", entry("a"));
    cache.set("b", entry("b"));
    cache.get("a"); // a is now the most recent
    cache.set("c", entry("c"));

    expect(cache.size).toBe(2);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")?.items[0].id).toBe("a");
    expect(cache.get("c")).toBeDefined();
  });

  it("touch refreshes fetchedAt without touching the items", () => {
    const cache = new MapCache();
    cache.set("a", entry("a", 1));
    cache.touch("a", 99);
    expect(cache.get("a")).toMatchObject({ fetchedAt: 99, etag: '"a"' });
    cache.touch("missing");
    expect(cache.size).toBe(1);
  });

  it("round-trips through JSON and drops malformed entries", () => {
    const cache = new MapCache();
    cache.set("a", entry("a"));
    const raw = JSON.parse(JSON.stringify(cache));

    const restored = MapCache.fromJSON([...raw, ["bad", { items: "nope" }], "junk"]);
    expect(restored.size).toBe(1);
    expect(restored.get("a")).toEqual(entry("a"));
    expect(MapCache.fromJSON(null).size).toBe(0);
  });

  it("clear empties it", () => {
    const cache = new MapCache();
    cache.set("a", entry("a"));
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
