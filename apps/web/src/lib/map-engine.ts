import "maplibre-gl/dist/maplibre-gl.css";
import type { ControlPosition, Map as GLMap, MapOptions, Marker } from "maplibre-gl";
import { MAX_ZOOM, loadStyle, isDarkMap } from "@/lib/map-tiles";

/** A point, in the order MapLibre wants it. */
export type LngLat = [number, number];

/** The one import of the library, shared by every map on the page. */
let loading: Promise<MapLibre> | null = null;

/** The library's namespace, however the bundler chose to hand it over. */
type MapLibre = typeof import("maplibre-gl");

/**
 * MapLibre draws vector tiles in a worker it starts from a URL inside its
 * own package. Bundlers rewrite those URLs, and MapLibre then starts a
 * worker that imports nothing: it answers no message, every tile stays
 * "loading", and the map is blank with not one error to show for it. So
 * the worker is served from the app itself — `scripts/sync-map-worker.mjs`
 * puts it there before dev and build.
 */
const WORKER_URL = "/map-worker/maplibre-gl-worker.mjs";

/**
 * MapLibre draws every map in the app. It is loaded on demand — it is a
 * large library and no page needs it before a map is on screen — and only
 * once, however many maps ask for it at the same moment.
 */
export function maplibre(): Promise<MapLibre> {
  loading ??= import("maplibre-gl").then((mod) => {
    const gl = ((mod as { default?: MapLibre }).default ?? mod) as MapLibre;
    gl.setWorkerUrl(WORKER_URL);
    return gl;
  });
  return loading;
}

export interface CreateMapOptions {
  container: HTMLElement;
  center: LngLat;
  zoom: number;
  /** Panning, zooming and the controls that go with them. */
  interactive?: boolean;
  dark?: boolean;
  /** Where the tile credit sits; bottom-right unless a screen needs the corner. */
  attributionPosition?: ControlPosition;
}

/**
 * A map in the app's basemap and typeface. MapLibre counts zoom in 512px
 * tiles, one step behind the 256px scale the rest of the app (and the
 * clusterer) speaks: `zoom` here is the app's, translated on the way in.
 */
export async function createMap({
  container,
  center,
  zoom,
  interactive = true,
  dark = isDarkMap(),
  attributionPosition,
}: CreateMapOptions): Promise<GLMap> {
  const [gl, style] = await Promise.all([maplibre(), loadStyle(dark)]);
  // MapLibre takes over the element it is given — its class, its children,
  // the observer that tells it its own size — and hands it all back when
  // the map is removed. React mounts an effect twice in development, so a
  // second map can be up before the first is taken down: give each one a
  // surface of its own inside the container and neither can blind the other.
  const surface = document.createElement("div");
  surface.style.width = "100%";
  surface.style.height = "100%";
  container.appendChild(surface);

  const map = new gl.Map({
    container: surface,
    style,
    center,
    zoom: toGLZoom(zoom),
    maxZoom: toGLZoom(MAX_ZOOM),
    interactive,
    // A corner of one's own is set up below; otherwise MapLibre's default
    attributionControl: attributionPosition ? false : { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    touchZoomRotate: interactive,
  } as MapOptions);
  if (attributionPosition) {
    map.addControl(new gl.AttributionControl({ compact: true }), attributionPosition);
  }
  const remove = map.remove.bind(map);
  map.remove = () => {
    remove();
    surface.remove();
  };
  return map;
}

/** The app's zoom (256px tiles, like the clusterer) → MapLibre's. */
export function toGLZoom(zoom: number): number {
  return zoom - 1;
}

/** MapLibre's zoom → the app's. */
export function fromGLZoom(zoom: number): number {
  return zoom + 1;
}

/** How a marker is drawn: the app's dot, in the size and colour asked for. */
export interface PinLook {
  size: number;
  /** The fill; the brand accent unless a spot's own colour says otherwise. */
  color?: string;
  /** The ring of page background that lifts it off the map. */
  border?: string;
  shadow?: string;
  cursor?: string;
  className?: string;
}

/**
 * A marker's element, built rather than parsed: no HTML string ever
 * reaches the DOM, so no colour or label from a spot can carry markup.
 */
export function markerElement({
  size,
  color = "var(--color-accent)",
  border = "3px solid var(--color-bg)",
  shadow,
  cursor,
  className,
}: PinLook): HTMLElement {
  const element = document.createElement("div");
  if (className) element.className = className;
  element.style.boxSizing = "border-box";
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = "9999px";
  element.style.background = color;
  element.style.border = border;
  if (shadow) element.style.boxShadow = shadow;
  if (cursor) element.style.cursor = cursor;
  return element;
}

/** Put a marker down; the caller keeps it to move or remove it. */
export async function addMarker(
  map: GLMap,
  at: LngLat,
  element: HTMLElement,
  options: { draggable?: boolean } = {},
): Promise<Marker> {
  const gl = await maplibre();
  return new gl.Marker({ element, draggable: options.draggable ?? false }).setLngLat(at).addTo(map);
}
