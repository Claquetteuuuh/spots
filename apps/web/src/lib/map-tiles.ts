/**
 * The map's tiles: CARTO's basemaps over OpenStreetMap data — quiet roads
 * and soft colours that let the pins and the photos read first. Voyager
 * in the light theme, Dark Matter in the dark one, at the screen's density.
 */
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const TILE_OPTIONS = {
  attribution: TILE_ATTRIBUTION,
  subdomains: "abcd",
  maxZoom: 20,
} as const;

/** Whether the page is in the dark theme: an explicit choice, else the system's. */
export function isDarkMap(): boolean {
  if (typeof document === "undefined") return false;
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "dark") return true;
  if (chosen === "light") return false;
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function tileUrl(dark: boolean = isDarkMap()): string {
  const style = dark ? "dark_matter" : "voyager";
  return `https://{s}.basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png`;
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
