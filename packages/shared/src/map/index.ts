import Supercluster from "supercluster";
import type { ColorFamily, CompositionType, SpotAccessibility } from "../constants";

// ─── Types ───────────────────────────────────────────────────────────

/** The minimal spot payload the map needs to draw a marker, filter it and preview it. */
export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string | null;
  photoUrl: string;
  city: string | null;
  userId: string;
  isOwn: boolean;
  colors: string[];
  compositions: CompositionType[];
  accessibility: SpotAccessibility | null;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** A react-native-maps style region (center + spans). */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export type MapScope = "all" | "mine" | "following";

export type MapItem =
  | { kind: "pin"; pin: MapPin }
  | { kind: "cluster"; id: number; latitude: number; longitude: number; count: number };

// ─── Tuning ──────────────────────────────────────────────────────────

/** Cluster radius in screen pixels — how close pins must be to merge. */
export const CLUSTER_RADIUS = 60;
/** Above this zoom, pins are never merged. */
export const CLUSTER_MAX_ZOOM = 16;
/** Pins fetched per viewport request. */
export const MAP_PINS_LIMIT = 500;
/**
 * Fraction of the viewport added on every side before fetching, so small
 * pans stay inside the last fetched box and need no request.
 */
export const VIEWPORT_PAD = 0.5;

const CLUSTER_MIN_SIZE = 32;
const CLUSTER_MAX_SIZE = 64;

// ─── Viewport helpers ────────────────────────────────────────────────

const clampLat = (v: number) => Math.max(-90, Math.min(90, v));
const clampLng = (v: number) => Math.max(-180, Math.min(180, v));

/** Expand a box by `factor` × its size on each side, clamped to the globe. */
export function padBounds(b: MapBounds, factor = VIEWPORT_PAD): MapBounds {
  const latPad = (b.neLat - b.swLat) * factor;
  const lngPad = (b.neLng - b.swLng) * factor;
  return {
    swLat: clampLat(b.swLat - latPad),
    swLng: clampLng(b.swLng - lngPad),
    neLat: clampLat(b.neLat + latPad),
    neLng: clampLng(b.neLng + lngPad),
  };
}

/** True when `inner` lies entirely inside `outer`. */
export function boundsContain(outer: MapBounds, inner: MapBounds): boolean {
  return (
    inner.swLat >= outer.swLat &&
    inner.swLng >= outer.swLng &&
    inner.neLat <= outer.neLat &&
    inner.neLng <= outer.neLng
  );
}

/** The overlap of two boxes, or null when they don't touch. */
export function intersectBounds(a: MapBounds, b: MapBounds): MapBounds | null {
  const r = {
    swLat: Math.max(a.swLat, b.swLat),
    swLng: Math.max(a.swLng, b.swLng),
    neLat: Math.min(a.neLat, b.neLat),
    neLng: Math.min(a.neLng, b.neLng),
  };
  return r.swLat <= r.neLat && r.swLng <= r.neLng ? r : null;
}

export function regionToBounds(r: MapRegion): MapBounds {
  return {
    swLat: clampLat(r.latitude - r.latitudeDelta / 2),
    swLng: clampLng(r.longitude - r.longitudeDelta / 2),
    neLat: clampLat(r.latitude + r.latitudeDelta / 2),
    neLng: clampLng(r.longitude + r.longitudeDelta / 2),
  };
}

/**
 * Web-mercator zoom level equivalent to a longitude span filling a view
 * `viewportWidthPx` wide. At zoom z the world is 256·2^z px across, so the
 * cluster radius (in px) means the same thing on a phone as on a tile.
 */
export function zoomFromLongitudeDelta(longitudeDelta: number, viewportWidthPx = 256): number {
  if (longitudeDelta <= 0) return CLUSTER_MAX_ZOOM + 1;
  return Math.log2(360 / longitudeDelta) + Math.log2(viewportWidthPx / 256);
}

export function longitudeDeltaFromZoom(zoom: number): number {
  return 360 / Math.pow(2, zoom);
}

// ─── Distance ────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEGREE = 111.32;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * A box holding a circle of `km` around `center` — a cheap pre-filter.
 * A degree of latitude is a touch shorter than the equatorial figure at
 * mid latitudes, so 1 % is added to be sure nothing inside is cut off.
 */
export function radiusToBounds(center: LatLng, km: number): MapBounds {
  const safeKm = km * 1.01;
  const dLat = safeKm / KM_PER_DEGREE;
  const dLng = safeKm / (KM_PER_DEGREE * Math.max(Math.cos(toRad(center.latitude)), 0.01));
  return {
    swLat: clampLat(center.latitude - dLat),
    swLng: clampLng(center.longitude - dLng),
    neLat: clampLat(center.latitude + dLat),
    neLng: clampLng(center.longitude + dLng),
  };
}

// ─── Colour families ─────────────────────────────────────────────────

/** Parse "#RRGGBB" into HSL (h in degrees, s and l in 0–1). */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s, l };
}

/**
 * Bucket a hex colour into a family. Pale, dark and washed-out colours are
 * "neutral"; muted warm darks are "brown"; the rest goes by hue.
 */
export function colorFamilyOf(hex: string): ColorFamily {
  const hsl = hexToHsl(hex);
  if (!hsl) return "neutral";
  const { h, s, l } = hsl;
  if (l >= 0.85 || l <= 0.1 || s < 0.1) return "neutral";
  if (h >= 15 && h < 45 && l < 0.6 && s < 0.5) return "brown";
  if (h < 15 || h >= 340) return "red";
  if (h < 40) return "orange";
  if (h < 70) return "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  if (h < 310) return "purple";
  return "pink";
}

// ─── Filters ─────────────────────────────────────────────────────────

export interface MapFilters {
  colors: ColorFamily[];
  compositions: CompositionType[];
  accessibility: SpotAccessibility[];
  /** "Around me" radius in km, or null for anywhere. */
  radiusKm: number | null;
}

export const EMPTY_FILTERS: MapFilters = {
  colors: [],
  compositions: [],
  accessibility: [],
  radiusKm: null,
};

export function countActiveFilters(f: MapFilters): number {
  return f.colors.length + f.compositions.length + f.accessibility.length + (f.radiusKm ? 1 : 0);
}

export interface MapFilterQuery {
  compositions?: string;
  accessibility?: string;
  nearLat?: number;
  nearLng?: number;
  radiusKm?: number;
}

/**
 * The server-side part of the filters as query params. Colour families are
 * matched on the client (hex colours are free-form), and a radius needs a
 * position to be around.
 */
export function filtersToQuery(f: MapFilters, near: LatLng | null): MapFilterQuery {
  const q: MapFilterQuery = {};
  if (f.compositions.length > 0) q.compositions = f.compositions.join(",");
  if (f.accessibility.length > 0) q.accessibility = f.accessibility.join(",");
  if (f.radiusKm && near) {
    q.nearLat = near.latitude;
    q.nearLng = near.longitude;
    q.radiusKm = f.radiusKm;
  }
  return q;
}

/** Keep the pins that carry at least one colour in one of the families. */
export function filterPinsByColor(pins: MapPin[], families: ColorFamily[]): MapPin[] {
  if (families.length === 0) return pins;
  const wanted = new Set<ColorFamily>(families);
  return pins.filter((p) => p.colors.some((hex) => wanted.has(colorFamilyOf(hex))));
}

// ─── Client cache ────────────────────────────────────────────────────

/** How often an open map re-asks for its current view (a 304 when unchanged). */
export const MAP_POLL_MS = 20_000;
/** Viewport entries kept per client. */
export const MAP_CACHE_MAX_ENTRIES = 40;

/**
 * Snap a box outward to a grid a quarter of its size, so nearby views
 * share one box — one cache key, one URL, one ETag.
 */
export function quantizeBounds(b: MapBounds): MapBounds {
  const span = Math.max(b.neLat - b.swLat, b.neLng - b.swLng, 1e-6);
  const step = Math.pow(2, Math.floor(Math.log2(span / 4)));
  return {
    swLat: clampLat(Math.floor(b.swLat / step) * step),
    swLng: clampLng(Math.floor(b.swLng / step) * step),
    neLat: clampLat(Math.ceil(b.neLat / step) * step),
    neLng: clampLng(Math.ceil(b.neLng / step) * step),
  };
}

/** One key per (box, scope, server-side filters) — what a response depends on. */
export function mapCacheKey(bounds: MapBounds, scope: MapScope, query: MapFilterQuery): string {
  const q = Object.keys(query)
    .sort()
    .map((k) => `${k}=${String(query[k as keyof MapFilterQuery])}`)
    .join("&");
  return `${scope}|${bounds.swLat},${bounds.swLng},${bounds.neLat},${bounds.neLng}|${q}`;
}

export interface MapCacheEntry {
  items: MapPin[];
  truncated: boolean;
  /** The server's ETag for this box, sent back as If-None-Match. */
  etag: string | null;
  fetchedAt: number;
}

/**
 * A small LRU of viewport responses. Reads are instant; the caller
 * always revalidates in the background, so what is shown converges on
 * the server within one round trip.
 */
export class MapCache {
  private readonly entries = new Map<string, MapCacheEntry>();

  constructor(private readonly max = MAP_CACHE_MAX_ENTRIES) {}

  get(key: string): MapCacheEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    // Re-insert so the most recently read is evicted last
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry;
  }

  set(key: string, entry: MapCacheEntry): void {
    this.entries.delete(key);
    this.entries.set(key, entry);
    while (this.entries.size > this.max) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  /** Mark an entry as just confirmed by the server (a 304). */
  touch(key: string, now = Date.now()): void {
    const entry = this.entries.get(key);
    if (entry) this.set(key, { ...entry, fetchedAt: now });
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  toJSON(): [string, MapCacheEntry][] {
    return [...this.entries.entries()];
  }

  /** Rebuild from `toJSON()` output; anything malformed is ignored. */
  static fromJSON(raw: unknown, max = MAP_CACHE_MAX_ENTRIES): MapCache {
    const cache = new MapCache(max);
    if (!Array.isArray(raw)) return cache;
    for (const pair of raw) {
      if (!Array.isArray(pair) || typeof pair[0] !== "string") continue;
      const e = pair[1] as Partial<MapCacheEntry> | null;
      if (!e || !Array.isArray(e.items) || typeof e.fetchedAt !== "number") continue;
      cache.set(pair[0], {
        items: e.items,
        truncated: Boolean(e.truncated),
        etag: typeof e.etag === "string" ? e.etag : null,
        fetchedAt: e.fetchedAt,
      });
    }
    return cache;
  }
}

// ─── Cluster presentation ────────────────────────────────────────────

/**
 * Marker diameter for a cluster. Grows with log2(count) so a 1 000-pin
 * cluster is only twice the size of a 2-pin one — visible, never a blob.
 */
export function clusterMarkerSize(count: number): number {
  const size = CLUSTER_MIN_SIZE + 6 * Math.log2(Math.max(count, 2));
  return Math.round(Math.min(CLUSTER_MAX_SIZE, Math.max(CLUSTER_MIN_SIZE, size)));
}

/** "12", "1.2k", "12k" */
export function formatClusterCount(count: number): string {
  if (count < 1000) return String(count);
  if (count < 10000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(count / 1000)}k`;
}

// ─── Clustering ──────────────────────────────────────────────────────

type PinProps = { pin: MapPin };

/**
 * Wraps a supercluster index over a set of pins. Build once per pin set,
 * then query per viewport — querying is cheap, building is not.
 */
export class SpotClusterer {
  private readonly index: Supercluster<PinProps, Record<string, never>>;

  constructor(pins: MapPin[]) {
    this.index = new Supercluster<PinProps, Record<string, never>>({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
    });
    this.index.load(
      pins.map((pin) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [pin.longitude, pin.latitude] },
        properties: { pin },
      })),
    );
  }

  /** Clusters and lone pins visible in `bounds` at `zoom` (fractional ok). */
  getItems(bounds: MapBounds, zoom: number): MapItem[] {
    const z = Math.max(0, Math.floor(zoom));
    const features = this.index.getClusters(
      [bounds.swLng, bounds.swLat, bounds.neLng, bounds.neLat],
      z,
    );
    return features.map((f) => {
      const [longitude, latitude] = f.geometry.coordinates;
      const props = f.properties;
      if ("cluster" in props && props.cluster) {
        return {
          kind: "cluster",
          id: props.cluster_id,
          latitude,
          longitude,
          count: props.point_count,
        };
      }
      return { kind: "pin", pin: (props as PinProps).pin };
    });
  }

  /** The zoom at which a cluster splits — where to fly on tap. */
  getExpansionZoom(clusterId: number): number {
    return Math.min(this.index.getClusterExpansionZoom(clusterId), CLUSTER_MAX_ZOOM + 1);
  }
}
