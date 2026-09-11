import Supercluster from "supercluster";

// ─── Types ───────────────────────────────────────────────────────────

/** The minimal spot payload the map needs to draw a marker and a preview. */
export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string | null;
  photoUrl: string;
  city: string | null;
  userId: string;
  isOwn: boolean;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
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
