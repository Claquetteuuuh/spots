/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import LocationPicker from "../location-picker";

describe("LocationPicker", () => {
  it("drops the pin when coordinates arrive from outside, not only on a tap", async () => {
    const onChange = vi.fn();
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<LocationPicker latitude={null} longitude={null} onChange={onChange} />);
    });
    await waitFor(() => expect(view.container.querySelector(".leaflet-container")).toBeTruthy());
    expect(view.container.querySelector(".custom-marker")).toBeNull();

    // Regression: an address search used to move the map but leave no pin
    await act(async () => {
      view.rerender(<LocationPicker latitude={48.85} longitude={2.35} onChange={onChange} />);
    });

    await waitFor(() => expect(view.container.querySelector(".custom-marker")).toBeTruthy());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("starts with the pin down when coordinates are already known", async () => {
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<LocationPicker latitude={45.76} longitude={4.83} onChange={vi.fn()} />);
    });
    await waitFor(() => expect(view.container.querySelector(".custom-marker")).toBeTruthy());
  });
});
