// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  BASEMAP_ATTRIBUTION,
  MAX_ZOOM,
  addBasemap,
  basemapLayers,
  isDarkMap,
  watchMapTheme,
  type LeafletForBasemap,
} from "../map-tiles";

/** A Leaflet whose tile layers record how they were built and used. */
function fakeLeaflet() {
  const layers: { url: string; options: Record<string, unknown>; added: number; removed: number }[] = [];
  const tileLayer = vi.fn((url: string, options: Record<string, unknown> = {}) => {
    const layer = { url, options, added: 0, removed: 0 };
    layers.push(layer);
    return {
      addTo() {
        layer.added += 1;
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

  it("draws Esri's topographic map by day — colour, parks and relief, to street zoom", () => {
    const layers = basemapLayers(false);
    expect(layers).toHaveLength(1);
    expect(layers[0].url).toContain("World_Topo_Map");
    expect(layers[0].url).toMatch(/\{z\}\/\{y\}\/\{x\}$/); // Esri numbers its tiles z/y/x
    expect(layers[0].maxNativeZoom).toBe(19);
  });

  it("turns to the dark grey canvas by night, labels above the land", () => {
    const [base, labels] = basemapLayers(true);
    expect(base.url).toContain("World_Dark_Gray_Base");
    expect(labels.url).toContain("World_Dark_Gray_Reference");
  });

  it("credits Esri and OpenStreetMap", () => {
    expect(BASEMAP_ATTRIBUTION).toContain("Esri");
    expect(BASEMAP_ATTRIBUTION).toContain("openstreetmap.org");
  });

  it("follows the theme chosen on the page, then the system", () => {
    expect(isDarkMap()).toBe(false); // jsdom: no dark preference
    expect(basemapLayers()[0].url).toContain("World_Topo_Map");
    document.documentElement.setAttribute("data-theme", "dark");
    expect(isDarkMap()).toBe(true);
    expect(basemapLayers()[0].url).toContain("Dark");
    document.documentElement.setAttribute("data-theme", "light");
    expect(isDarkMap()).toBe(false);
  });

  it("adds the theme's layers, credited once, and keeps zooming past the deepest tiles", () => {
    const { L, layers } = fakeLeaflet();

    addBasemap(L, {}, false);

    expect(layers).toHaveLength(1);
    expect(layers[0].added).toBe(1);
    expect(layers[0].options.attribution).toBe(BASEMAP_ATTRIBUTION);
    expect(layers[0].options.maxZoom).toBe(MAX_ZOOM);
    expect(layers[0].options.maxNativeZoom).toBe(19);
  });

  it("swaps the whole set when the theme flips, and takes it away on remove", () => {
    const { L, layers } = fakeLeaflet();

    const basemap = addBasemap(L, {}, false);
    basemap.setDark(true);

    // The day layer went, the two night ones came — only the land is credited
    expect(layers[0].removed).toBe(1);
    expect(layers).toHaveLength(3);
    expect(layers[1].url).toContain("World_Dark_Gray_Base");
    expect(layers[1].options.attribution).toBe(BASEMAP_ATTRIBUTION);
    expect(layers[2].url).toContain("World_Dark_Gray_Reference");
    expect(layers[2].options.attribution).toBeUndefined();

    basemap.remove();
    expect(layers.map((l) => l.removed)).toEqual([1, 1, 1]);
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
