/**
 * The map's basemap. In the light theme it is Esri's topographic map:
 * colour where colour means something — green for parks and forests,
 * shaded relief for hills and cliffs, blue for water — at every zoom a
 * photographer needs. In the dark theme, where a bright map would fight
 * the interface, it is Esri's dark grey canvas with its labels on top.
 *
 * Free, no key, no watermark.
 */
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";

export const BASEMAP_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Past a layer's own depth Leaflet scales its last tiles rather than blanking. */
export const MAX_ZOOM = 19;

/** One tile layer of the basemap, bottom first. */
export interface BasemapLayer {
  url: string;
  /** As deep as this layer is actually drawn. */
  maxNativeZoom: number;
}

/** The layers a theme is made of: the land, and for the dark canvas its labels. */
export function basemapLayers(dark: boolean = isDarkMap()): BasemapLayer[] {
  if (dark) {
    return [
      { url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, maxNativeZoom: 16 },
      { url: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, maxNativeZoom: 16 },
    ];
  }
  return [{ url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`, maxNativeZoom: 19 }];
}

/** Whether the page is in the dark theme: an explicit choice, else the system's. */
export function isDarkMap(): boolean {
  if (typeof document === "undefined") return false;
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "dark") return true;
  if (chosen === "light") return false;
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** What a map holds on to: a way to follow the theme, and to tear down. */
export interface Basemap {
  setDark: (dark: boolean) => void;
  remove: () => void;
}

/** What a tile layer must offer — method signatures, so Leaflet's own types fit. */
interface TileLayer {
  addTo(map: unknown): unknown;
  remove(): unknown;
}

/** The bit of Leaflet the basemap needs — kept loose, Leaflet is loaded dynamically. */
export interface LeafletForBasemap {
  tileLayer(url: string, options?: object): TileLayer;
}

/**
 * Put the basemap under a Leaflet map. Following the theme swaps the whole
 * set — the two themes are not the same map with other colours, so there
 * is nothing to reuse between them.
 */
export function addBasemap(L: LeafletForBasemap, map: unknown, dark: boolean = isDarkMap()): Basemap {
  let layers = draw(L, map, dark);

  return {
    setDark: (next) => {
      for (const layer of layers) layer.remove();
      layers = draw(L, map, next);
    },
    remove: () => {
      for (const layer of layers) layer.remove();
      layers = [];
    },
  };
}

/** Add a theme's layers, bottom first, crediting the source once. */
function draw(L: LeafletForBasemap, map: unknown, dark: boolean): TileLayer[] {
  return basemapLayers(dark).map(({ url, maxNativeZoom }, i) => {
    const layer = L.tileLayer(url, {
      maxNativeZoom,
      maxZoom: MAX_ZOOM,
      ...(i === 0 ? { attribution: BASEMAP_ATTRIBUTION } : {}),
    });
    layer.addTo(map);
    return layer;
  });
}

/**
 * Follow the theme while a map is open: the explicit choice on the root
 * element, and the system setting behind it. Returns a stop function.
 */
export function watchMapTheme(onChange: (dark: boolean) => void): () => void {
  if (typeof document === "undefined") return () => {};
  const notify = () => onChange(isDarkMap());
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  media?.addEventListener("change", notify);
  return () => {
    observer.disconnect();
    media?.removeEventListener("change", notify);
  };
}
