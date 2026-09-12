// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { TILE_OPTIONS, isDarkMap, tileUrl, watchMapTheme } from "../map-tiles";

describe("map tiles", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("serves CARTO tiles at the screen's density, credited to OSM and CARTO", () => {
    expect(tileUrl(false)).toBe("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png");
    expect(tileUrl(true)).toBe("https://{s}.basemaps.cartocdn.com/rastertiles/dark_matter/{z}/{x}/{y}{r}.png");
    expect(TILE_OPTIONS.attribution).toContain("openstreetmap.org");
    expect(TILE_OPTIONS.attribution).toContain("carto.com");
    expect(TILE_OPTIONS.subdomains).toBe("abcd");
  });

  it("follows the theme chosen on the page, then the system", () => {
    expect(isDarkMap()).toBe(false); // jsdom: no dark preference
    document.documentElement.setAttribute("data-theme", "dark");
    expect(isDarkMap()).toBe(true);
    expect(tileUrl()).toContain("dark_matter");
    document.documentElement.setAttribute("data-theme", "light");
    expect(isDarkMap()).toBe(false);
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
