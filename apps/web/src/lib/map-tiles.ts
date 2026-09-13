/**
 * The map's basemap: OpenFreeMap's vector tiles (OpenStreetMap data, no
 * key, no quota), drawn by MapLibre — colour where colour means something
 * (parks and forests green, shaded relief, water blue), sharp at any zoom,
 * and set in the app's own typeface: the labels are drawn from Figtree
 * glyphs served from `/map-fonts`.
 *
 * If the style provider cannot be reached, Esri's raster tiles stand in,
 * so a map is never blank.
 */
const OPENFREEMAP = "https://tiles.openfreemap.org/styles";

/** Colour by day; the dark canvas by night, which a bright map would fight. */
export function styleUrl(dark: boolean = isDarkMap()): string {
  return `${OPENFREEMAP}/${dark ? "dark" : "liberty"}`;
}

/** Figtree, as SDF glyph ranges generated from the same font the site uses. */
export const GLYPHS_URL = "/map-fonts/{fontstack}/{range}.pbf";

/** The style's Noto stacks, mapped to the weights of the site's typeface. */
const FONT_STACKS: Record<string, string> = {
  "Noto Sans Regular": "Figtree Regular",
  "Noto Sans Italic": "Figtree Regular",
  "Noto Sans Bold": "Figtree SemiBold",
};

/** Anything the app cannot draw in Figtree falls back to the regular weight. */
const DEFAULT_STACK = "Figtree Regular";

interface StyleLike {
  glyphs?: string;
  layers?: { layout?: { "text-font"?: string[] } }[];
}

/**
 * Take a published style and set it in the app's typeface: the glyphs come
 * from here, and every label asks for Figtree rather than Noto Sans.
 */
export function withAppFont<T extends StyleLike>(style: T): T {
  const next = { ...style, glyphs: GLYPHS_URL };
  next.layers = style.layers?.map((layer) => {
    const font = layer.layout?.["text-font"];
    if (!font) return layer;
    return {
      ...layer,
      layout: { ...layer.layout, "text-font": font.map((name) => FONT_STACKS[name] ?? DEFAULT_STACK) },
    };
  });
  return next;
}

// ─── The raster stand-in ─────────────────────────────────────────────

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";

export const FALLBACK_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Where vector tiles cannot be had: Esri's topographic map, or its dark canvas. */
export function fallbackLayers(dark: boolean): { url: string; maxzoom: number }[] {
  if (dark) {
    return [
      { url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, maxzoom: 16 },
      { url: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, maxzoom: 16 },
    ];
  }
  return [{ url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`, maxzoom: 19 }];
}

/** The stand-in as a MapLibre style: raster tiles, bottom layer first. */
export function rasterStyle(dark: boolean = isDarkMap()): unknown {
  const sources: Record<string, unknown> = {};
  const layers = fallbackLayers(dark).map(({ url, maxzoom }, i) => {
    const id = `esri-${i}`;
    sources[id] = {
      type: "raster",
      tiles: [url],
      tileSize: 256,
      maxzoom,
      ...(i === 0 ? { attribution: FALLBACK_ATTRIBUTION } : {}),
    };
    return { id, type: "raster", source: id };
  });
  return { version: 8, glyphs: GLYPHS_URL, sources, layers };
}

/**
 * Fetch a style and set it in the app's typeface — or, if it cannot be
 * fetched, hand back the raster stand-in rather than a blank canvas.
 */
export async function loadStyle(dark: boolean = isDarkMap()): Promise<unknown> {
  try {
    const response = await fetch(styleUrl(dark));
    if (!response.ok) throw new Error(`Style ${response.status}`);
    return withAppFont((await response.json()) as StyleLike);
  } catch {
    return rasterStyle(dark);
  }
}

/** As far in as the tiles go — MapLibre counts a step lower, see `toGLZoom`. */
export const MAX_ZOOM = 19;

/** Whether the page is in the dark theme: an explicit choice, else the system's. */
export function isDarkMap(): boolean {
  if (typeof document === "undefined") return false;
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "dark") return true;
  if (chosen === "light") return false;
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
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
