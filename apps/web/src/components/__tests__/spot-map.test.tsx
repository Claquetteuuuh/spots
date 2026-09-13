// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import type { MapPin } from "@trs/shared/map";

import SpotMap from "../spot-map";

// Leaflet reads the container's size from the DOM; jsdom has no layout.
// Every element reports this size, popups included, so each one auto-pans into view.
const SIZE = 400;

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

/** Let Leaflet's deferred work (its 100ms first draw, animation frames) run. */
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
    for (const prop of ["clientWidth", "clientHeight", "offsetWidth", "offsetHeight"]) {
      Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => SIZE });
    }
  });

  afterEach(() => {
    window.removeEventListener("error", onError);
    for (const prop of ["clientWidth", "clientHeight", "offsetWidth", "offsetHeight"]) {
      // @ts-expect-error — back to jsdom's own (absent) layout
      delete HTMLElement.prototype[prop];
    }
  });

  it("survives a second pin tapped while the first popup is still panning into view", async () => {
    // Two pins far enough apart not to cluster, both on screen at the default zoom
    const pins = [pin("a", 48.8566, 2.3522), pin("b", 48.8566, 8.35)];
    const { container, unmount } = render(<SpotMap pins={pins} labels={LABELS} />);

    await waitFor(() => expect(container.querySelectorAll(".leaflet-marker-icon").length).toBe(2), {
      timeout: 3000,
    });
    const icons = container.querySelectorAll<HTMLElement>(".leaflet-marker-icon");

    // Tap A: its popup opens and starts panning the map to fit it in…
    await act(async () => {
      fireEvent.click(icons[0]);
    });
    // …and, mid-pan, tap B. Leaflet stops the pan to start B's own, which
    // fires `moveend` at once — a synchronous redraw there used to remove
    // B's marker under the popup being positioned and crash.
    await act(async () => {
      fireEvent.click(icons[1]);
    });
    await settle();

    expect(errors.filter((m) => m.includes("layerPointToContainerPoint"))).toEqual([]);
    expect(container.querySelector(".leaflet-popup")).not.toBeNull();
    // The basemap is Esri's quiet grey canvas, not a keyed provider
    await waitFor(() => expect(container.querySelector("img.leaflet-tile")).not.toBeNull());
    expect(container.querySelector<HTMLImageElement>("img.leaflet-tile")?.src).toContain(
      "server.arcgisonline.com/ArcGIS/rest/services/Canvas",
    );

    await act(async () => {
      unmount();
    });
  });
});
