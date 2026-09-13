// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import type { MapPin } from "@trs/shared/map";

// jsdom has no WebGL, so the real MapLibre refuses to start
vi.mock("maplibre-gl", async () => (await import("@/test/maplibre-mock")).createMapLibreMock());

import SpotMap from "../spot-map";

const LABELS = { cluster: (n: number) => `${n}`, untitled: "Untitled", open: "Open", youAreHere: "You" };

const pin = (id: string, latitude: number, longitude: number): MapPin => ({
  id,
  latitude,
  longitude,
  title: id,
  photoUrl: `https://cdn/${id}.webp`,
  city: "Paris",
  userId: "u1",
  isOwn: true,
  colors: ["#C44536"],
  compositions: [],
  accessibility: null,
});

/** Let the map's deferred work (its 100ms first draw, animation frames) run. */
const settle = (ms = 150) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

describe("SpotMap", () => {
  const errors: string[] = [];
  const onError = (e: ErrorEvent) => {
    errors.push(e.message);
  };

  beforeEach(() => {
    errors.length = 0;
    window.addEventListener("error", onError);
    // No network in a test: the basemap falls back to its raster stand-in
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
  });

  afterEach(() => {
    window.removeEventListener("error", onError);
    vi.unstubAllGlobals();
  });

  it("draws a pin per spot and swaps the preview card from one to the next", async () => {
    // Two spots far enough apart not to cluster, both on screen at the default zoom
    const pins = [pin("a", 48.8566, 2.3522), pin("b", 48.8566, 7.5)];
    const onSpotClick = vi.fn();
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<SpotMap pins={pins} labels={LABELS} onSpotClick={onSpotClick} />);
    });
    const { container, unmount } = view;

    await waitFor(() => expect(container.querySelectorAll(".spot-pin").length).toBe(2));
    const marks = container.querySelectorAll<HTMLElement>(".spot-pin");

    await act(async () => {
      fireEvent.click(marks[0]);
    });
    expect(container.querySelector(".spot-preview__title")?.textContent).toBe("a");

    // Tapping a second spot while the first card is still open used to reach
    // into a marker that had just been cleared away; the card simply moves now.
    await act(async () => {
      fireEvent.click(marks[1]);
    });
    await settle();
    expect(container.querySelectorAll(".maplibregl-popup").length).toBe(1);
    expect(container.querySelector(".spot-preview__title")?.textContent).toBe("b");
    expect(errors).toEqual([]);

    // The card itself opens the spot rather than following its link
    await act(async () => {
      fireEvent.click(container.querySelector(".spot-preview")!);
    });
    expect(onSpotClick).toHaveBeenCalledWith(pins[1]);

    await act(async () => {
      unmount();
    });
  });

  it("groups close spots into a cluster that opens on tap", async () => {
    const pins = [pin("a", 48.8566, 2.3522), pin("b", 48.857, 2.3525), pin("c", 48.8562, 2.3519)];
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<SpotMap pins={pins} labels={LABELS} />);
    });
    const { container, unmount } = view;

    await waitFor(() => expect(container.querySelector(".spot-cluster")).not.toBeNull());
    expect(container.querySelector(".spot-cluster__badge")?.textContent).toBe("3");

    // Tapping it zooms in far enough for the cluster to break apart
    await act(async () => {
      fireEvent.click(container.querySelector<HTMLElement>(".spot-cluster")!);
    });
    await settle();
    await waitFor(() => expect(container.querySelectorAll(".spot-pin").length).toBe(3));

    await act(async () => {
      unmount();
    });
  });

  it("tells the page what it is showing, in the zoom the rest of the app speaks", async () => {
    const onViewportChange = vi.fn();
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <SpotMap pins={[pin("a", 48.8566, 2.3522)]} labels={LABELS} onViewportChange={onViewportChange} />,
      );
    });
    const { unmount } = view;

    await waitFor(() => expect(onViewportChange).toHaveBeenCalled());
    const viewport = onViewportChange.mock.calls.at(-1)![0];
    expect(viewport.zoom).toBe(5); // MapLibre counts one lower: 4 on its own scale
    expect(viewport.bounds.swLat).toBeLessThan(viewport.bounds.neLat);
    expect(viewport.bounds.swLng).toBeLessThan(viewport.bounds.neLng);
    // The centre comes from the map itself. Read off the box instead and
    // every return to a remembered view slid a little further towards the
    // equator, where the midpoint of a Mercator box is not its centre.
    expect(viewport.center).toEqual({ lat: 48.8566, lng: 2.3522 });

    await act(async () => {
      unmount();
    });
  });

  it("shows the photographer where they are, facing the way they are", async () => {
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <SpotMap
          pins={[]}
          labels={LABELS}
          userPosition={{ latitude: 48.85, longitude: 2.35, accuracy: 40, heading: 90 }}
        />,
      );
    });
    const { container, unmount } = view;

    await waitFor(() => expect(container.querySelector(".you-are-here")).not.toBeNull());
    const cone = container.querySelector<HTMLElement>(".you-are-here__cone")!;
    expect(cone.hidden).toBe(false);
    expect(cone.style.transform).toBe("rotate(90deg)");
    // The accuracy ring is drawn in metres, so it has a size in pixels
    const ring = container.querySelector<HTMLElement>(".you-are-here__accuracy")!;
    expect(parseFloat(ring.style.width)).toBeGreaterThan(0);

    await act(async () => {
      unmount();
    });
  });
});
