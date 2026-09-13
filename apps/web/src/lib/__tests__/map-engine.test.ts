// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// jsdom has no WebGL, so the real MapLibre refuses to start
vi.mock("maplibre-gl", async () => (await import("@/test/maplibre-mock")).createMapLibreMock());

import { createMap, fromGLZoom, maplibre, markerElement, toGLZoom } from "../map-engine";

describe("the map engine", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
  });

  it("starts MapLibre's worker from a copy the app serves itself", async () => {
    const gl = (await maplibre()) as unknown as { workerUrl: { current: string } };

    // A bundler rewrites the library's own URLs, and the worker it then
    // starts answers nothing: tiles load for ever and the map stays blank.
    expect(gl.workerUrl.current).toBe("/map-worker/maplibre-gl-worker.mjs");
  });

  it("gives each map a surface of its own, and takes it away again", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    // React mounts an effect twice in development: two maps, one container
    const first = await createMap({ container, center: [2.35, 48.85], zoom: 5 });
    const second = await createMap({ container, center: [2.35, 48.85], zoom: 5 });
    expect(container.children).toHaveLength(2);

    // Taking the first down leaves the second its own surface, and its size
    first.remove();
    expect(container.children).toHaveLength(1);
    expect(second.getContainer().isConnected).toBe(true);

    second.remove();
    expect(container.children).toHaveLength(0);
  });

  it("builds a marker rather than parsing one", async () => {
    const pin = markerElement({ size: 18, color: "#C44536", shadow: "0 0 0 4px red", cursor: "grab" });

    expect(pin.tagName).toBe("DIV");
    // Nothing is parsed into the DOM, so no colour or title out of the
    // database can arrive as markup
    expect(pin.children).toHaveLength(0);
    expect(pin.innerHTML).toBe("");
    expect(pin.style.width).toBe("18px");
    expect(pin.style.background).toBe("rgb(196, 69, 54)");
    expect(pin.style.borderRadius).toBe("9999px");
    expect(pin.style.cursor).toBe("grab");
  });

  it("counts zoom the way the rest of the app does, one step above MapLibre", async () => {
    const container = document.createElement("div");
    const map = await createMap({ container, center: [0, 0], zoom: 13 });

    expect(map.getZoom()).toBe(12);
    expect(fromGLZoom(map.getZoom())).toBe(13);
    expect(toGLZoom(fromGLZoom(7))).toBe(7);
    map.remove();
  });
});
