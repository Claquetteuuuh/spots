/**
 * The map's basemap: Esri's grey canvases — quiet roads, near-white land,
 * labels on a layer of their own — so the photos and the coloured pins are
 * what the eye lands on. Free, no key, no watermark, and it follows the
 * app's light and dark themes.
 *
 * The canvases are drawn down to zoom 16; past that Leaflet scales the last
 * tiles, which stays legible where a photographer places a pin.
 */
const ESRI_CANVAS = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";

export const BASEMAP_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** As deep as the canvases are drawn; Leaflet scales what is past it. */
export const MAX_NATIVE_ZOOM = 16;
export const MAX_ZOOM = 19;

/** The two layers a theme is made of: the land, then the labels over it. */
export function basemapUrls(dark: boolean = isDarkMap()): [base: string, labels: string] {
  const shade = dark ? "Dark" : "Light";
  return [
    `${ESRI_CANVAS}/World_${shade}_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    `${ESRI_CANVAS}/World_${shade}_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
  ];
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
  setUrl(url: string): unknown;
  remove(): unknown;
}

/** The bit of Leaflet the basemap needs — kept loose, Leaflet is loaded dynamically. */
export interface LeafletForBasemap {
  tileLayer(url: string, options?: object): TileLayer;
}

/**
 * Put the basemap under a Leaflet map: the land, then the labels above it.
 * Both layers stay for the map's life, so following the theme is a change
 * of URL rather than a rebuild — no flash of an empty map.
 */
export function addBasemap(L: LeafletForBasemap, map: unknown, dark: boolean = isDarkMap()): Basemap {
  const [baseUrl, labelsUrl] = basemapUrls(dark);
  const zooms = { maxNativeZoom: MAX_NATIVE_ZOOM, maxZoom: MAX_ZOOM };

  const base = L.tileLayer(baseUrl, { ...zooms, attribution: BASEMAP_ATTRIBUTION });
  base.addTo(map);
  // The labels ride above the land, and carry the credit only once
  const labels = L.tileLayer(labelsUrl, zooms);
  labels.addTo(map);

  return {
    setDark: (next) => {
      const [nextBase, nextLabels] = basemapUrls(next);
      base.setUrl(nextBase);
      labels.setUrl(nextLabels);
    },
    remove: () => {
      base.remove();
      labels.remove();
    },
  };
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
