// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";

import {
  FALLBACK_ATTRIBUTION,
  GLYPHS_URL,
  MAX_ZOOM,
  fallbackLayers,
  isDarkMap,
  loadStyle,
  rasterStyle,
  styleUrl,
  watchMapTheme,
  withAppFont,
} from "../map-tiles";

const STYLE = {
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    { id: "water" },
    { id: "city", layout: { "text-font": ["Noto Sans Regular"], "text-size": 12 } },
    { id: "capital", layout: { "text-font": ["Noto Sans Bold"] } },
    { id: "river", layout: { "text-font": ["Noto Sans Italic"] } },
    { id: "odd", layout: { "text-font": ["Some Other Face"] } },
  ],
};

/** The shape of the raster stand-in, as MapLibre reads it. */
interface RasterStyle {
  version: number;
  glyphs: string;
  sources: Record<string, { tiles: string[]; maxzoom: number; attribution?: string }>;
  layers: { id: string; type: string; source: string }[];
}

describe("basemap", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("draws OpenFreeMap's colourful style by day and its dark one by night", () => {
    expect(styleUrl(false)).toBe("https://tiles.openfreemap.org/styles/liberty");
    expect(styleUrl(true)).toBe("https://tiles.openfreemap.org/styles/dark");
  });

  it("sets every label in the app's own typeface, served from the app itself", () => {
    const styled = withAppFont(STYLE);

    expect(styled.glyphs).toBe(GLYPHS_URL);
    expect(GLYPHS_URL.startsWith("/")).toBe(true); // our own files, not the provider's
    const fonts = styled.layers!.map((l) => l.layout?.["text-font"]);
    expect(fonts).toEqual([
      undefined,
      ["Figtree Regular"],
      ["Figtree SemiBold"],
      ["Figtree Regular"],
      ["Figtree Regular"], // a face we have no glyphs for falls back to the regular weight
    ]);
    // Everything else about the style is left alone
    expect(styled.layers![1].layout!["text-size"]).toBe(12);
  });

  it("fetches the style and hands it back in the app's typeface", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => STYLE }));
    vi.stubGlobal("fetch", fetchMock);

    const style = (await loadStyle(false)) as typeof STYLE;

    expect(fetchMock).toHaveBeenCalledWith(styleUrl(false));
    expect(style.glyphs).toBe(GLYPHS_URL);
    expect(style.layers![1].layout!["text-font"]).toEqual(["Figtree Regular"]);
  });

  it("follows the theme chosen on the page, then the system", () => {
    expect(isDarkMap()).toBe(false); // jsdom: no dark preference
    document.documentElement.setAttribute("data-theme", "dark");
    expect(isDarkMap()).toBe(true);
    expect(styleUrl()).toContain("/dark");
    document.documentElement.setAttribute("data-theme", "light");
    expect(isDarkMap()).toBe(false);
  });

  it("stands in with Esri's raster tiles, credited, when the style cannot be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));

    const style = (await loadStyle(false)) as RasterStyle;

    expect(style.version).toBe(8);
    expect(style.layers).toHaveLength(1);
    const source = style.sources[style.layers[0].source];
    expect(source.tiles[0]).toContain("World_Topo_Map");
    expect(source.attribution).toBe(FALLBACK_ATTRIBUTION);
    expect(source.maxzoom).toBe(MAX_ZOOM);
    // Labels still come from us, so even the stand-in is set in Figtree
    expect(style.glyphs).toBe(GLYPHS_URL);
  });

  it("stands in with the dark canvas at night, labels above the land", () => {
    const [base, labels] = fallbackLayers(true);
    expect(base.url).toContain("World_Dark_Gray_Base");
    expect(labels.url).toContain("World_Dark_Gray_Reference");

    const style = rasterStyle(true) as RasterStyle;
    expect(style.layers.map((l) => l.id)).toEqual(["esri-0", "esri-1"]);
  });

  it("stands in when the network refuses the style outright", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );

    const style = (await loadStyle(true)) as RasterStyle;

    expect(style.layers).toHaveLength(2);
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
