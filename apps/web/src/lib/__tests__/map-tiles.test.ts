// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  BASEMAP_ATTRIBUTION,
  MAX_NATIVE_ZOOM,
  MAX_ZOOM,
  addBasemap,
  basemapUrls,
  isDarkMap,
  watchMapTheme,
  type LeafletForBasemap,
} from "../map-tiles";

/** A Leaflet whose tile layers record how they were built and used. */
function fakeLeaflet() {
  const layers: { url: string; options: Record<string, unknown>; added: number; urls: string[]; removed: number }[] = [];
  const tileLayer = vi.fn((url: string, options: Record<string, unknown> = {}) => {
    const layer = { url, options, added: 0, urls: [] as string[], removed: 0 };
    layers.push(layer);
    return {
      addTo() {
        layer.added += 1;
        return this;
      },
      setUrl(next: string) {
        layer.urls.push(next);
        return this;
      },
      remove() {
        layer.removed += 1;
        return this;
      },
    };
  });
  return { L: { tileLayer } as unknown as LeafletForBasemap, layers };
}

describe("basemap", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("draws Esri's grey canvases, light by day and dark by night, credited to Esri and OSM", () => {
    const [light, lightLabels] = basemapUrls(false);
    expect(light).toContain("World_Light_Gray_Base");
    expect(lightLabels).toContain("World_Light_Gray_Reference");
    const [dark, darkLabels] = basemapUrls(true);
    expect(dark).toContain("World_Dark_Gray_Base");
    expect(darkLabels).toContain("World_Dark_Gray_Reference");
    for (const url of [light, lightLabels, dark, darkLabels]) {
      expect(url).toContain("server.arcgisonline.com");
      expect(url).toMatch(/\{z\}\/\{y\}\/\{x\}$/); // Esri numbers its tiles z/y/x
    }
    expect(BASEMAP_ATTRIBUTION).toContain("Esri");
    expect(BASEMAP_ATTRIBUTION).toContain("openstreetmap.org");
  });

  it("follows the theme chosen on the page, then the system", () => {
    expect(isDarkMap()).toBe(false); // jsdom: no dark preference
    document.documentElement.setAttribute("data-theme", "dark");
    expect(isDarkMap()).toBe(true);
    expect(basemapUrls()[0]).toContain("Dark");
    document.documentElement.setAttribute("data-theme", "light");
    expect(isDarkMap()).toBe(false);
    expect(basemapUrls()[0]).toContain("Light");
  });

  it("puts the land under the labels, credited once, and keeps zooming past the last tiles", () => {
    const { L, layers } = fakeLeaflet();

    addBasemap(L, {}, false);

    expect(layers).toHaveLength(2);
    const [base, labels] = layers;
    expect(base.url).toContain("World_Light_Gray_Base");
    expect(labels.url).toContain("World_Light_Gray_Reference");
    expect(base.added).toBe(1);
    expect(labels.added).toBe(1);
    // Only one credit line, and both layers scale past their deepest tiles
    expect(base.options.attribution).toBe(BASEMAP_ATTRIBUTION);
    expect(labels.options.attribution).toBeUndefined();
    for (const layer of layers) {
      expect(layer.options.maxNativeZoom).toBe(MAX_NATIVE_ZOOM);
      expect(layer.options.maxZoom).toBe(MAX_ZOOM);
    }
  });

  it("swaps both layers when the theme flips, and takes both away together", () => {
    const { L, layers } = fakeLeaflet();

    const basemap = addBasemap(L, {}, false);
    basemap.setDark(true);

    expect(layers[0].urls).toEqual([basemapUrls(true)[0]]);
    expect(layers[1].urls).toEqual([basemapUrls(true)[1]]);

    basemap.setDark(false);
    expect(layers[0].urls.at(-1)).toBe(basemapUrls(false)[0]);

    basemap.remove();
    expect(layers.map((l) => l.removed)).toEqual([1, 1]);
  });

  it("tells a watcher when the theme changes, until stopped", async () => {
    const onChange = vi.fn();
    const stop = watchMapTheme(onChange);

    document.documentElement.setAttribute("data-theme", "dark");
    await new Promise((r) => setTimeout(r, 0)); // mutation observers are async
    expect(onChange).toHaveBeenLastCalledWith(true);

    stop();
    document.documentElement.setAttribute("data-theme", "light");
    await new Promise((r) => setTimeout(r, 0));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
