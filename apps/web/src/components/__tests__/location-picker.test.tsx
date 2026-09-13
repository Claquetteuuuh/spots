/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

// jsdom has no WebGL, so the real MapLibre refuses to start
vi.mock("maplibre-gl", async () => (await import("@/test/maplibre-mock")).createMapLibreMock());

import { stubStyleFetch } from "@/test/maplibre-mock";
import LocationPicker from "../location-picker";

/** Building a map is asynchronous; a loaded machine takes its time. */
const READY = { timeout: 5000 };

describe("LocationPicker", () => {
  let restoreFetch = () => {};
  beforeEach(() => {
    restoreFetch = stubStyleFetch();
  });
  afterEach(() => {
    restoreFetch();
  });

  it("drops the pin when coordinates arrive from outside, not only on a tap", async () => {
    const onChange = vi.fn();
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<LocationPicker latitude={null} longitude={null} onChange={onChange} />);
    });
    await waitFor(() => expect(view.container.querySelector(".maplibregl-canvas-container")).toBeTruthy(), READY);
    expect(view.container.querySelector(".location-pin")).toBeNull();

    // Regression: an address search used to move the map but leave no pin
    await act(async () => {
      view.rerender(<LocationPicker latitude={48.85} longitude={2.35} onChange={onChange} />);
    });

    await waitFor(() => expect(view.container.querySelector(".location-pin")).toBeTruthy(), READY);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("starts with the pin down when coordinates are already known", async () => {
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<LocationPicker latitude={45.76} longitude={4.83} onChange={vi.fn()} />);
    });
    await waitFor(() => expect(view.container.querySelector(".location-pin")).toBeTruthy(), READY);
  });
});
