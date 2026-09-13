/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

// jsdom has no WebGL, so the real MapLibre refuses to start
vi.mock("maplibre-gl", async () => (await import("@/test/maplibre-mock")).createMapLibreMock());

import LocationPicker from "../location-picker";

describe("LocationPicker", () => {
  it("drops the pin when coordinates arrive from outside, not only on a tap", async () => {
    const onChange = vi.fn();
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<LocationPicker latitude={null} longitude={null} onChange={onChange} />);
    });
    await waitFor(() => expect(view.container.querySelector(".maplibregl-canvas-container")).toBeTruthy());
    expect(view.container.querySelector(".location-pin")).toBeNull();

    // Regression: an address search used to move the map but leave no pin
    await act(async () => {
      view.rerender(<LocationPicker latitude={48.85} longitude={2.35} onChange={onChange} />);
    });

    await waitFor(() => expect(view.container.querySelector(".location-pin")).toBeTruthy());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("starts with the pin down when coordinates are already known", async () => {
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<LocationPicker latitude={45.76} longitude={4.83} onChange={vi.fn()} />);
    });
    await waitFor(() => expect(view.container.querySelector(".location-pin")).toBeTruthy());
  });
});
